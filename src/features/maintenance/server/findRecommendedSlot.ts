import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { workOrders, user, sites } from '#/db/schema'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { z } from 'zod'
import {
  formatDateIso,
  getEarliestSchedulableDate,
  getMonday,
  minutesToTimeString,
  timeStringToMinutes,
  findAvailableSlotOnDay,
} from '../utils/dateUtils'
import { areCitiesInSameRegion, normalizeCity } from '../utils/regionUtils'
import { requireAuthUser } from '#/features/auth/server/authGuards'

export const findRecommendedSlotInputSchema = z.object({
  city: z.string().default('Kortrijk'),
  durationHours: z.number().positive().default(1.5),
  preferredTechId: z.string().optional(),
})

export type FindRecommendedSlotInput = z.infer<typeof findRecommendedSlotInputSchema>

export interface RecommendedScheduleSlot {
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  durationHours: number
  techId: string
  techName: string
  weekMonday: string // YYYY-MM-DD
}

function getPreferredTechIdForCity(city: string): string {
  const c = city.toLowerCase().trim()
  if (
    c.includes('kortrijk') ||
    c.includes('wevelgem') ||
    c.includes('heule') ||
    c.includes('kuurne') ||
    c.includes('harelbeke')
  ) {
    return 'usr_tom'
  }
  if (c.includes('waregem') || c.includes('deerlijk')) {
    return 'usr_jens'
  }
  return 'usr_wout'
}

export const findRecommendedSlotFn = createServerFn({ method: 'GET' })
  .validator(findRecommendedSlotInputSchema)
  .handler(async ({ data }): Promise<RecommendedScheduleSlot> => {
    await requireAuthUser(['MANAGER'])
    const requiredDurationMinutes = Math.round(data.durationHours * 60)
    const preferredTechId = data.preferredTechId || getPreferredTechIdForCity(data.city)

    // 1. Fetch available internal technicians
    const technicians = await db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(and(eq(user.role, 'TECHNICIAN'), eq(user.isContractor, false)))

    if (technicians.length === 0) {
      const earliest = getEarliestSchedulableDate()
      return {
        date: formatDateIso(earliest),
        startTime: '08:30',
        endTime: minutesToTimeString(8 * 60 + 30 + Math.min(210, requiredDurationMinutes)),
        durationHours: data.durationHours,
        techId: preferredTechId,
        techName: 'Tom De Coninck',
        weekMonday: formatDateIso(getMonday(earliest)),
      }
    }

    // Sort technicians: preferred first, then remaining
    const sortedTechs = [...technicians].sort((a, b) => {
      if (a.id === preferredTechId) return -1
      if (b.id === preferredTechId) return 1
      return a.name.localeCompare(b.name)
    })

    const techIds = sortedTechs.map((t) => t.id)

    // 2. Determine search range: tomorrow up to 28 days ahead
    const startDate = getEarliestSchedulableDate()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 28)

    const startDateIso = formatDateIso(startDate)
    const endDateIso = formatDateIso(endDate)

    // 3. Query active work orders in this range with their site municipality
    const activeWos = await db
      .select({
        techId: workOrders.assignedTechnicianId,
        plannedDate: workOrders.plannedDate,
        plannedStartTime: workOrders.plannedStartTime,
        plannedEndTime: workOrders.plannedEndTime,
        siteCity: sites.siteCity,
      })
      .from(workOrders)
      .leftJoin(sites, eq(workOrders.siteId, sites.id))
      .where(
        and(
          inArray(workOrders.assignedTechnicianId, techIds),
          gte(workOrders.plannedDate, startDateIso),
          lte(workOrders.plannedDate, endDateIso),
          inArray(workOrders.status, ['PROPOSED', 'SCHEDULED', 'IN_PROGRESS'])
        )
      )

    // Group work orders by `${techId}_${date}`
    const wosByTechAndDate = new Map<
      string,
      { intervals: Array<{ start: number; end: number }>; cities: string[] }
    >()
    for (const wo of activeWos) {
      if (!wo.techId || !wo.plannedDate || !wo.plannedStartTime || !wo.plannedEndTime) continue
      const key = `${wo.techId}_${wo.plannedDate}`
      const entry = wosByTechAndDate.get(key) || { intervals: [], cities: [] }
      entry.intervals.push({
        start: timeStringToMinutes(wo.plannedStartTime),
        end: timeStringToMinutes(wo.plannedEndTime),
      })
      if (wo.siteCity) {
        entry.cities.push(normalizeCity(wo.siteCity))
      }
      wosByTechAndDate.set(key, entry)
    }

    // 4. Search day by day from startDate to endDate
    const currentCursor = new Date(startDate)

    while (currentCursor <= endDate) {
      const dayOfWeek = currentCursor.getDay()
      // Skip weekends (0 is Sunday, 6 is Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentCursor.setDate(currentCursor.getDate() + 1)
        continue
      }

      const dateIso = formatDateIso(currentCursor)

      // Check each technician on this day (preferred technician evaluated first)
      for (const tech of sortedTechs) {
        const key = `${tech.id}_${dateIso}`
        const entry = wosByTechAndDate.get(key)
        const bookedIntervals = entry?.intervals || []
        const existingCities = entry?.cities || []

        // Geographic co-location check: do not schedule in data.city if tech is already booked in a different region
        const hasRegionConflict = existingCities.some(
          (city) => !areCitiesInSameRegion(city, data.city)
        )
        if (hasRegionConflict) {
          continue
        }

        const availableSlot = findAvailableSlotOnDay(bookedIntervals, requiredDurationMinutes)
        if (availableSlot) {
          return {
            date: dateIso,
            startTime: minutesToTimeString(availableSlot.start),
            endTime: minutesToTimeString(availableSlot.end),
            durationHours: data.durationHours,
            techId: tech.id,
            techName: tech.name,
            weekMonday: formatDateIso(getMonday(currentCursor)),
          }
        }
      }

      // No technician available on this day, advance to next day
      currentCursor.setDate(currentCursor.getDate() + 1)
    }

    // 5. Fallback if capacity not found: return the earliest date with preferred technician
    const fallbackTech = sortedTechs[0]
    return {
      date: startDateIso,
      startTime: '08:30',
      endTime: minutesToTimeString(8 * 60 + 30 + Math.min(210, requiredDurationMinutes)),
      durationHours: data.durationHours,
      techId: fallbackTech.id,
      techName: fallbackTech.name,
      weekMonday: formatDateIso(getMonday(startDate)),
    }
  })
