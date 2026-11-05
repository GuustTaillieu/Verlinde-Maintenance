export function addMonthsToIso(isoDate: string, months: number): string {
    const [y, m, d] = isoDate.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setMonth(date.getMonth() + months)
    const newY = date.getFullYear()
    const newM = String(date.getMonth() + 1).padStart(2, '0')
    const newD = String(date.getDate()).padStart(2, '0')
    return `${newY}-${newM}-${newD}`
}

/**
 * Normalizes Dutch DD/MM/YYYY dates to ISO YYYY-MM-DD
 */
export function parseDdMmYyyyToIso(dateStr?: string | null): string {
    if (!dateStr || typeof dateStr !== 'string') return '2025-01-01'
    const trimmed = dateStr.trim()
    const parts = trimmed.split(/[/.-]/)
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0')
        const month = parts[1].padStart(2, '0')
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
        return `${year}-${month}-${day}`
    }
    return trimmed
}

export function parseDateObj(dateStr?: string | null): Date | null {
    if (!dateStr) return null
    const iso = parseDdMmYyyyToIso(dateStr)
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : d
}

export function normalizeDiscipline(groupStr?: string): 'FIRE' | 'INTRUSION' | 'CCTV' | 'ACCESS' | 'OTHER' {
    const g = (groupStr || '').toUpperCase()
    if (g.includes('BRAND') || g.includes('FIRE')) return 'FIRE'
    if (g.includes('INBR') || g.includes('ALARM')) return 'INTRUSION'
    if (g.includes('CAM') || g.includes('CCTV')) return 'CCTV'
    if (g.includes('TOEG') || g.includes('ACCESS') || g.includes('BADGE')) return 'ACCESS'
    return 'OTHER'
}

export function extractCityFromAddress(addr?: string): string {
    if (!addr) return 'Zwevegem'
    const match = addr.match(/\b\d{4}\s+([A-Za-z\-]+)/)
    if (match) return match[1].trim()
    return 'Zwevegem'
}

export function extractZipFromAddress(addr?: string): string | null {
    if (!addr) return null
    const match = addr.match(/\b(\d{4})\b/)
    return match ? match[1] : null
}