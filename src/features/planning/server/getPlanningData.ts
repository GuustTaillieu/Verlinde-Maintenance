import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { workOrders, sites, customers, user, workOrderItems, equipment } from '#/db/schema'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { managerMiddleware } from '#/features/auth/server/authGuards'
import { normalizeCity } from '#/features/maintenance/utils/regionUtils'
import {
  type PlanningSlot,
  type PlanningWeekData,
  type PlanningTechnician,
  type TechnicianCapacity,
  type PlanningDiscipline,
  type WorkOrderStatus,
  type WorkOrderKind,
  type PlanningChecklistItem,
  type PlanningEquipmentItem,
} from '../types'

export const getPlanningDataInputSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  techId: z.string().optional().default('ALL'),
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

  // Repair invalid end times by defaulting to start + 2h
  if (endMin <= startMin) {
    endMin = Math.min(17 * 60, startMin + 120)
  }

  const durationHours = Math.max(0.5, Math.round(((endMin - startMin) / 60) * 10) / 10)
  const eh = Math.floor(endMin / 60)
  const em = endMin % 60
  const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`

  return { startTime: sTime, endTime, durationHours }
}

function getWeekNumber(dateStr: string): { weekNumber: number; year: number } {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return { weekNumber, year: d.getFullYear() }
}

export const getPlanningDataFn = createServerFn({ method: 'GET' })
  .middleware([managerMiddleware])
  .validator(getPlanningDataInputSchema)
  .handler(async ({ data }): Promise<PlanningWeekData> => {
    // 1. Fetch internal technicians (Dirk, Tom, Wout, Jens)
    const technicianRows = await db
      .select({
        id: user.id,
        name: user.name,
        role: user.role,
        techCode: user.techCode,
        initials: user.initials,
        title: user.title,
        specialties: user.specialties,
        weeklySchedule: user.weeklySchedule,
      })
      .from(user)
      .where(and(eq(user.isContractor, false)))

    const technicians: PlanningTechnician[] = technicianRows
      .filter((t) => Boolean(t.techCode))
      .map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role as 'MANAGER' | 'TECHNICIAN',
        techCode: t.techCode,
        initials: t.initials || t.name.slice(0, 2).toUpperCase(),
        title: t.title || (t.role === 'MANAGER' ? 'Zaakvoerder / Dispatch' : 'Technicus'),
        specialties: t.specialties || [],
        weeklySchedule: t.weeklySchedule || { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
      }))

    // 2. Build where filter for scheduled work orders in the requested week
    const dateFilter = and(
      gte(workOrders.plannedDate, data.weekStartDate),
      lte(workOrders.plannedDate, data.weekEndDate)
    )

    // Load all work orders for the week so capacities and available hours are accurate for all team members
    const whereClause = dateFilter

    // 3. Query week work orders joined with customer and site
    const rows = await db
      .select({
        wo: workOrders,
        site: sites,
        customer: customers,
        tech: {
          id: user.id,
          name: user.name,
          initials: user.initials,
        },
      })
      .from(workOrders)
      .leftJoin(sites, eq(workOrders.siteId, sites.id))
      .leftJoin(customers, eq(workOrders.customerId, customers.id))
      .leftJoin(user, eq(workOrders.assignedTechnicianId, user.id))
      .where(whereClause)

    const workOrderIds = rows.map((r) => r.wo.id)
    const siteIds = Array.from(new Set(rows.map((r) => r.wo.siteId).filter(Boolean))) as string[]

    // 4. Query work order items for checklist verification
    const itemsRows =
      workOrderIds.length > 0
        ? await db
            .select()
            .from(workOrderItems)
            .where(inArray(workOrderItems.workOrderId, workOrderIds))
        : []

    const itemsByWoId = new Map<string, PlanningChecklistItem[]>()
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

    // 5. Query site equipment including physical building locations ("Serverruimte", "Inkomhal", etc.)
    const equipmentRows =
      siteIds.length > 0
        ? await db
            .select()
            .from(equipment)
            .where(inArray(equipment.siteId, siteIds))
        : []

    const equipmentBySite = new Map<string, PlanningEquipmentItem[]>()
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

    // 6. Map into strongly-typed PlanningSlot
    const slots: PlanningSlot[] = rows.map((r) => {
      const times = sanitizeTimes(r.wo.plannedStartTime, r.wo.plannedEndTime)
      const primaryDiscipline = (r.site?.primaryDiscipline || 'INTRUSION') as PlanningDiscipline
      const siteEquipment = r.wo.siteId ? equipmentBySite.get(r.wo.siteId) || [] : []

      return {
        id: r.wo.id,
        woNumber: r.wo.woNumber,
        customerId: r.wo.customerId,
        customerName: r.customer?.name || r.site?.name || 'Onbekende Klant',
        customerPhone: r.customer?.phone || r.customer?.mobile || null,
        customerEmail: r.customer?.email || null,
        siteId: r.wo.siteId,
        siteName: r.site?.name || 'Hoofdvestiging',
        siteAddress: r.wo.siteAddress || r.site?.siteAddress || '',
        siteCity: normalizeCity(r.site?.siteCity) || 'Zwevegem',
        primaryDiscipline,
        date: r.wo.plannedDate || data.weekStartDate,
        startTime: times.startTime,
        endTime: times.endTime,
        durationHours: times.durationHours,
        status: (r.wo.status || 'SCHEDULED') as WorkOrderStatus,
        kind: (r.wo.kind || 'MAINTENANCE') as WorkOrderKind,
        assignedTechnicianId: r.wo.assignedTechnicianId,
        assignedTechnicianName: r.tech?.name || null,
        assignedTechnicianInitials: r.tech?.initials || null,
        accessNotesConfidential: r.site?.accessNotesConfidential || null,
        officeNotes: r.wo.officeNotes,
        techNotes: r.wo.techNotes,
        isSigned: r.wo.isSigned,
        signedByName: r.wo.signedByName,
        signedAt: r.wo.signedAt,
        completedAt: r.wo.completedAt,
        certificateDocument: r.wo.certificateDocument,
        items: itemsByWoId.get(r.wo.id) || [],
        equipment: siteEquipment,
      }
    })

    // 7. Compute Capacities per technician
    const capacities: TechnicianCapacity[] = technicians.map((tech) => {
      const techSlots = slots.filter((s) => s.assignedTechnicianId === tech.id)
      const totalHoursScheduled = techSlots.reduce((acc, s) => acc + s.durationHours, 0)
      const weeklyMaxHours =
        tech.weeklySchedule.mon +
        tech.weeklySchedule.tue +
        tech.weeklySchedule.wed +
        tech.weeklySchedule.thu +
        tech.weeklySchedule.fri

      const utilizationPercent =
        weeklyMaxHours > 0 ? Math.round((totalHoursScheduled / weeklyMaxHours) * 100) : 0

      return {
        techId: tech.id,
        techName: tech.name,
        techCode: tech.techCode,
        techInitials: tech.initials,
        totalHoursScheduled: Math.round(totalHoursScheduled * 10) / 10,
        weeklyMaxHours,
        utilizationPercent,
        isOverloaded: totalHoursScheduled > weeklyMaxHours,
      }
    })

    const totalTeamHours = capacities.reduce((acc, c) => acc + c.totalHoursScheduled, 0)
    const totalTeamMax = capacities.reduce((acc, c) => acc + c.weeklyMaxHours, 0)
    const teamUtilization =
      totalTeamMax > 0 ? Math.round((totalTeamHours / totalTeamMax) * 100) : 0

    const { weekNumber, year } = getWeekNumber(data.weekStartDate)

    return {
      weekStartDate: data.weekStartDate,
      weekEndDate: data.weekEndDate,
      weekNumber,
      year,
      technicians,
      slots,
      capacities,
      teamCapacity: {
        totalHoursScheduled: Math.round(totalTeamHours * 10) / 10,
        weeklyMaxHours: totalTeamMax,
        utilizationPercent: teamUtilization,
      },
    }
  })
