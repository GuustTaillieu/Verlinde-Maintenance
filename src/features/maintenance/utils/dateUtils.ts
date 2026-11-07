/**
 * Formats an ISO date string (YYYY-MM-DD) into natural Belgian Dutch.
 * Example: '2025-03-17' -> 'maandag 17 maart 2025'
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
 * Formats a short date (e.g. '17/03/2025').
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
export function getRecommendedFutureDate(daysAhead = 5): string {
  const now = new Date()
  const target = new Date(now)
  target.setDate(target.getDate() + daysAhead)
  if (target.getDay() === 6) target.setDate(target.getDate() + 2) // Sat -> Mon
  if (target.getDay() === 0) target.setDate(target.getDate() + 1) // Sun -> Mon
  const y = target.getFullYear()
  const m = String(target.getMonth() + 1).padStart(2, '0')
  const d = String(target.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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

