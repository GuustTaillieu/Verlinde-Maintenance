import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { workOrders, sites } from '#/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import { normalizeCity } from '../utils/regionUtils'

export interface ScheduledSlot {
  id: string
  woNumber: string
  siteName: string
  siteAddress: string
  siteCity: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  durationHours: number
  status?: string
}

export const technicianScheduleInputSchema = z.object({
  techId: z.string(),
  weekStartDate: z.string(),
  weekEndDate: z.string(),
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

  // If end time is earlier or equal to start time (legacy invalid data in DB), repair by adding 2h
  if (endMin <= startMin) {
    endMin = Math.min(17 * 60, startMin + 120)
  }

  const durationHours = Math.max(0.5, Math.round(((endMin - startMin) / 60) * 10) / 10)
  const eh = Math.floor(endMin / 60)
  const em = endMin % 60
  const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`

  return { startTime: sTime, endTime, durationHours }
}

export const getTechnicianScheduleFn = createServerFn({ method: 'GET' })
  .validator(technicianScheduleInputSchema)
  .handler(async ({ data }): Promise<ScheduledSlot[]> => {
    const rows = await db
      .select({
        id: workOrders.id,
        woNumber: workOrders.woNumber,
        plannedDate: workOrders.plannedDate,
        plannedStartTime: workOrders.plannedStartTime,
        plannedEndTime: workOrders.plannedEndTime,
        status: workOrders.status,
        siteName: sites.name,
        siteAddress: sites.siteAddress,
        siteCity: sites.siteCity,
      })
      .from(workOrders)
      .leftJoin(sites, eq(workOrders.siteId, sites.id))
      .where(
        and(
          eq(workOrders.assignedTechnicianId, data.techId),
          gte(workOrders.plannedDate, data.weekStartDate),
          lte(workOrders.plannedDate, data.weekEndDate)
        )
      )

    return rows.map((r) => {
      const times = sanitizeTimes(r.plannedStartTime, r.plannedEndTime)
      return {
        id: r.id,
        woNumber: r.woNumber,
        siteName: r.siteName || 'Onderhoud werf',
        siteAddress: r.siteAddress || '',
        siteCity: normalizeCity(r.siteCity) || 'Kortrijk',
        date: r.plannedDate || data.weekStartDate,
        startTime: times.startTime,
        endTime: times.endTime,
        durationHours: times.durationHours,
        status: r.status || undefined,
      }
    })
  })

