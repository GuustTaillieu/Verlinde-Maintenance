/**
 * Formats a Date object as ISO 'YYYY-MM-DD'.
 */
export function formatDateIso(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Returns today's ISO date string 'YYYY-MM-DD'.
 */
export function getTodayIso(): string {
  return formatDateIso(new Date())
}

/**
 * Returns the Monday (at 00:00:00) of the week for a given Date or ISO string.
 */
export function getMonday(dateInput: Date | string): Date {
  const d = typeof dateInput === 'string' ? new Date(`${dateInput}T00:00:00`) : new Date(dateInput)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Sunday is 0, Monday is 1
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Returns the earliest schedulable date (strictly in the future, skipping weekends).
 * Rule: never today, minimum tomorrow. If tomorrow is weekend, move to next Monday.
 */
export function getEarliestSchedulableDate(fromDate: Date = new Date()): Date {
  const target = new Date(fromDate)
  target.setDate(target.getDate() + 1) // strictly tomorrow or later
  target.setHours(0, 0, 0, 0)

  // If Saturday (6), move to Monday (+2)
  if (target.getDay() === 6) {
    target.setDate(target.getDate() + 2)
  }
  // If Sunday (0), move to Monday (+1)
  else if (target.getDay() === 0) {
    target.setDate(target.getDate() + 1)
  }

  return target
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into natural Belgian Dutch.
 * Example: '2026-11-09' -> 'maandag 9 november 2026'
 */
export function formatDateDutch(isoDate: string): string {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formats a short date (e.g. '09/11/2026').
 */
export function formatShortDateDutch(isoDate: string): string {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Returns a recommended future working day (skips weekend).
 */
export function getRecommendedFutureDate(daysAhead = 2): string {
  const earliest = getEarliestSchedulableDate()
  if (daysAhead <= 1) {
    return formatDateIso(earliest)
  }

  const target = new Date(earliest)
  let added = 1
  while (added < daysAhead) {
    target.setDate(target.getDate() + 1)
    if (target.getDay() !== 0 && target.getDay() !== 6) {
      added++
    }
  }

  return formatDateIso(target)
}

/**
 * Converts a time string 'HH:MM' to minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Converts minutes from midnight into 'HH:MM'.
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface DayInterval {
  start: number // minutes from midnight
  end: number
}

/**
 * Intelligent single-day appointment placement algorithm.
 * Working hours: 08:30 (510 min) to 17:00 (1020 min).
 * Lunch: 12:00 (720 min) to 13:00 (780 min).
 * Jobs can span across lunch naturally if duration > 3.5h (e.g. 4.5h = 08:30 - 14:00).
 */
export function findAvailableSlotOnDay(
  existingIntervals: DayInterval[],
  durationMinutes: number
): { start: number; end: number } | null {
  const dayStart = 8 * 60 + 30 // 08:30 (510 min)
  const dayEnd = 17 * 60 // 17:00 (1020 min)
  const lunchStart = 12 * 60 // 12:00 (720 min)
  const lunchEnd = 13 * 60 // 13:00 (780 min)

  // Maximum working minutes in a standard day: (720 - 510) + (1020 - 780) = 450 min (7.5h)
  if (durationMinutes > 450) {
    return null
  }

  // Filter and sort booked technician intervals within working hours
  const bookedSlots = existingIntervals
    .filter((slot) => slot.end > dayStart && slot.start < dayEnd)
    .sort((a, b) => a.start - b.start)

  // Candidate start times: 08:30, after lunch (13:00), or immediately after any existing booked slot
  const candidateStarts = [dayStart, lunchEnd]
  for (const slot of bookedSlots) {
    if (slot.end >= dayStart && slot.end < dayEnd) {
      candidateStarts.push(slot.end)
    }
  }

  // Remove duplicates and sort chronologically
  const uniqueStarts = Array.from(new Set(candidateStarts)).sort((a, b) => a - b)

  for (const start of uniqueStarts) {
    if (start < dayStart || start >= dayEnd) continue

    // 1. Candidate start time CANNOT be inside lunch (12:00 - 13:00)
    if (start >= lunchStart && start < lunchEnd) continue

    // 2. Candidate start time CANNOT be inside any booked technician slot
    if (bookedSlots.some((slot) => start >= slot.start && start < slot.end)) continue

    // 3. Trace forward from 'start' to see if 'durationMinutes' fits without colliding with any booked slot
    let remaining = durationMinutes
    let t = start
    let fits = true

    while (remaining > 0) {
      // Reached end of working day without finishing
      if (t >= dayEnd) {
        fits = false
        break
      }

      // If t is inside or at lunch, advance over lunch pause (12:00 -> 13:00)
      if (t >= lunchStart && t < lunchEnd) {
        t = lunchEnd
        continue
      }

      // Check if t collides with any booked slot
      const colliding = bookedSlots.find((slot) => t >= slot.start && t < slot.end)
      if (colliding) {
        // Cannot jump over an existing technician job; candidate start is invalid
        fits = false
        break
      }

      // Determine the next boundary/obstacle:
      // - Lunch start (if t < lunchStart)
      // - Next booked slot start (if there is one starting after t)
      // - End of day (dayEnd)
      let nextObstacle = dayEnd
      if (t < lunchStart) {
        nextObstacle = Math.min(nextObstacle, lunchStart)
      }
      for (const slot of bookedSlots) {
        if (slot.start > t) {
          nextObstacle = Math.min(nextObstacle, slot.start)
        }
      }

      const availableChunk = nextObstacle - t
      if (availableChunk <= 0) {
        fits = false
        break
      }

      const useChunk = Math.min(remaining, availableChunk)
      remaining -= useChunk
      t += useChunk
    }

    if (fits && remaining === 0 && t <= dayEnd) {
      return { start, end: t }
    }
  }

  return null
}
