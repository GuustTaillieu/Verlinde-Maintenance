import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { workOrders, sites, customers, user, workOrderItems, equipment } from '#/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { authMiddleware, AuthError } from '#/features/auth/server/authGuards'
import { normalizeCity } from '#/features/maintenance/utils/regionUtils'
import { sanitizeAlarmCode } from '#/lib/permissions'
import { formatDateIso } from '#/features/maintenance/utils/dateUtils'
import type {
  TechnicianDayData,
  TechnicianWorkOrder,
  TechnicianChecklistItem,
  TechnicianEquipmentItem,
  TechnicianDiscipline,
  TechnicianWorkOrderStatus,
} from '../types'

export const getTechnicianDayScheduleInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

function sanitizeTimes(
  start?: string | null,
  end?: string | null
): { startTime: string; endTime: string; durationHours: number } {
  let sTime = start && /^\d{1,2}:\d{2}$/.test(start.trim()) ? start.trim() : '08:30'
  if (sTime.length === 4) sTime = `0${sTime}`

  const [sh, sm] = sTime.split(':').map(Number)
  const startMin = sh * 60 + sm

  let endMin: number
  if (end && /^\d{1,2}:\d{2}$/.test(end.trim())) {
    let eTime = end.trim()
    if (eTime.length === 4) eTime = `0${eTime}`
    const [eh, em] = eTime.split(':').map(Number)
    endMin = eh * 60 + em
  } else {
    endMin = startMin + 120
  }

  if (endMin <= startMin) {
    endMin = Math.min(17 * 60, startMin + 120)
  }

  const durationHours = Math.max(0.5, Math.round(((endMin - startMin) / 60) * 10) / 10)
  const eh = Math.floor(endMin / 60)
  const em = endMin % 60
  const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`

  return { startTime: sTime, endTime, durationHours }
}

export const getTechnicianDayScheduleFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(getTechnicianDayScheduleInputSchema)
  .handler(async ({ data, context }): Promise<TechnicianDayData> => {
    const currentUser = context.user

    if (!currentUser) {
      throw new AuthError('Niet geauthenticeerd.', 401)
    }

    const targetDate = data?.date || formatDateIso(new Date())

    // 1. Fetch technician profile and schedule
    const [technicianUser] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        techCode: user.techCode,
        initials: user.initials,
        title: user.title,
        weeklySchedule: user.weeklySchedule,
      })
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1)

    if (!technicianUser) {
      throw new AuthError('Technicus niet gevonden in database.', 404)
    }

    const defaultSchedule = { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 }
    const schedule = technicianUser.weeklySchedule || defaultSchedule

    // Calculate part-time schedule for the selected date
    const targetDt = new Date(`${targetDate}T00:00:00`)
    const dayOfWeek = targetDt.getDay() // 0 = sun, 1 = mon, ..., 6 = sat

    const dayKeyMap: Record<number, 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'weekend'> = {
      0: 'weekend',
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
      6: 'weekend',
    }

    const dayKey = dayKeyMap[dayOfWeek]
    const scheduledDailyHours =
      dayKey === 'weekend' ? 0 : (schedule[dayKey] ?? 8)

    const isDayOff = scheduledDailyHours === 0
    const isHalfDay = scheduledDailyHours > 0 && scheduledDailyHours <= 4

    // 2. Fetch technician's assigned work orders for that day
    const rows = await db
      .select({
        wo: workOrders,
        site: sites,
        customer: customers,
      })
      .from(workOrders)
      .leftJoin(sites, eq(workOrders.siteId, sites.id))
      .leftJoin(customers, eq(workOrders.customerId, customers.id))
      .where(
        and(
          eq(workOrders.assignedTechnicianId, currentUser.id),
          eq(workOrders.plannedDate, targetDate)
        )
      )

    const workOrderIds = rows.map((r) => r.wo.id)
    const siteIds = Array.from(new Set(rows.map((r) => r.wo.siteId).filter(Boolean))) as string[]

    // 3. Fetch checklist items
    const itemsRows =
      workOrderIds.length > 0
        ? await db
            .select()
            .from(workOrderItems)
            .where(inArray(workOrderItems.workOrderId, workOrderIds))
        : []

    const itemsByWoId = new Map<string, TechnicianChecklistItem[]>()
    for (const item of itemsRows) {
      if (!itemsByWoId.has(item.workOrderId)) {
        itemsByWoId.set(item.workOrderId, [])
      }
      itemsByWoId.get(item.workOrderId)!.push({
        id: item.id,
        workOrderId: item.workOrderId,
        equipmentId: item.equipmentId,
        articleCode: item.articleCode,
        description: item.description,
        quantity: item.quantity,
        isChecked: item.isChecked,
        techRemarks: item.techRemarks,
      })
    }

    // 4. Fetch site equipment with building locations
    const equipmentRows =
      siteIds.length > 0
        ? await db
            .select()
            .from(equipment)
            .where(inArray(equipment.siteId, siteIds))
        : []

    const equipmentBySite = new Map<string, TechnicianEquipmentItem[]>()
    for (const eqItem of equipmentRows) {
      if (!equipmentBySite.has(eqItem.siteId)) {
        equipmentBySite.set(eqItem.siteId, [])
      }
      equipmentBySite.get(eqItem.siteId)!.push({
        id: eqItem.id,
        siteId: eqItem.siteId,
        articleCode: eqItem.articleCode,
        description: eqItem.description,
        location: eqItem.location || null,
        serialNumber: eqItem.serialNumber || null,
        quantity: eqItem.quantity,
        status: eqItem.status,
      })
    }

    // 5. Map slots with zero-trust alarm code protection
    const slots: TechnicianWorkOrder[] = rows.map((r) => {
      const times = sanitizeTimes(r.wo.plannedStartTime, r.wo.plannedEndTime)
      const primaryDiscipline = (r.site?.primaryDiscipline || 'INTRUSION') as TechnicianDiscipline
      const siteEquipment = r.wo.siteId ? equipmentBySite.get(r.wo.siteId) || [] : []

      // Zero-Trust: Reveal alarm code ONLY to the assigned technician on the scheduled day
      const sanitizedCode = sanitizeAlarmCode(r.site?.accessNotesConfidential, currentUser, {
        workOrder: {
          id: r.wo.id,
          assignedTechnicianId: currentUser.id,
          plannedDate: r.wo.plannedDate,
          status: r.wo.status || 'SCHEDULED',
        },
        today: targetDate,
      })

      // Default standard inspection items if checklist was not explicitly pre-seeded
      const existingItems = itemsByWoId.get(r.wo.id) || []
      const items =
        existingItems.length > 0
          ? existingItems
          : [
              {
                id: `default_1_${r.wo.id}`,
                workOrderId: r.wo.id,
                description: `Controle en werkingstest van ${primaryDiscipline.toLowerCase()}centrale`,
                quantity: 1,
                isChecked: r.wo.status === 'COMPLETED',
                techRemarks: null,
              },
              {
                id: `default_2_${r.wo.id}`,
                workOrderId: r.wo.id,
                description: 'Visuele inspectie en reiniging van componenten/detectoren',
                quantity: siteEquipment.length > 0 ? siteEquipment.length : 4,
                isChecked: r.wo.status === 'COMPLETED',
                techRemarks: null,
              },
              {
                id: `default_3_${r.wo.id}`,
                workOrderId: r.wo.id,
                description: 'Spanningsmeting back-up accu en noodvoeding (min. 12.8V)',
                quantity: 1,
                isChecked: r.wo.status === 'COMPLETED',
                techRemarks: null,
              },
              {
                id: `default_4_${r.wo.id}`,
                workOrderId: r.wo.id,
                description: 'Test alarmtransmissie naar dispatching / meldkamer',
                quantity: 1,
                isChecked: r.wo.status === 'COMPLETED',
                techRemarks: null,
              },
            ]

      return {
        id: r.wo.id,
        woNumber: r.wo.woNumber,
        customerId: r.wo.customerId,
        customerName: r.customer?.name || r.site?.name || 'Klant ter plaatse',
        customerPhone: r.customer?.phone || r.customer?.mobile || null,
        customerEmail: r.customer?.email || null,
        siteId: r.wo.siteId,
        siteName: r.site?.name || 'Hoofdlocatie',
        siteAddress: r.wo.siteAddress || r.site?.siteAddress || '',
        siteCity: normalizeCity(r.site?.siteCity) || 'Zwevegem',
        primaryDiscipline,
        date: r.wo.plannedDate || targetDate,
        startTime: times.startTime,
        endTime: times.endTime,
        durationHours: times.durationHours,
        status: (r.wo.status || 'SCHEDULED') as TechnicianWorkOrderStatus,
        kind: r.wo.kind || 'MAINTENANCE',
        accessNotesConfidential: sanitizedCode,
        officeNotes: r.wo.officeNotes,
        techNotes: r.wo.techNotes,
        isSigned: Boolean(r.wo.isSigned),
        signedByName: r.wo.signedByName,
        signedAt: r.wo.signedAt,
        completedAt: r.wo.completedAt,
        certificateDocument: r.wo.certificateDocument,
        items,
        equipment: siteEquipment,
      }
    })

    // Sort chronologically by start time
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime))

    return {
      date: targetDate,
      technician: {
        id: technicianUser.id,
        name: technicianUser.name,
        email: technicianUser.email,
        techCode: technicianUser.techCode,
        initials: technicianUser.initials || technicianUser.name.slice(0, 2).toUpperCase(),
        title: technicianUser.title || 'Veldtechnicus Beveiliging',
        weeklySchedule: schedule,
      },
      scheduledDailyHours,
      isDayOff,
      isHalfDay,
      slots,
    }
  })
