import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { workOrders, sites } from '#/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

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

function calculateDurationHours(start?: string | null, end?: string | null): number {
  if (!start || !end) return 2.0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diffMinutes = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(1, Math.round((diffMinutes / 60) * 10) / 10)
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

    return rows.map((r) => ({
      id: r.id,
      woNumber: r.woNumber,
      siteName: r.siteName || 'Onderhoud werf',
      siteAddress: r.siteAddress || '',
      siteCity: r.siteCity || 'Zwevegem',
      date: r.plannedDate || data.weekStartDate,
      startTime: r.plannedStartTime || '08:30',
      endTime: r.plannedEndTime || '10:30',
      durationHours: calculateDurationHours(r.plannedStartTime, r.plannedEndTime),
      status: r.status || undefined,
    }))
  })

