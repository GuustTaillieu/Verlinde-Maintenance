/**
 * Normalizes a municipality or city name for comparison and grouping.
 */
export function normalizeCity(city?: string | null): string {
  if (!city) return ''
  const trimmed = city.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

/**
 * Standard operational region clusters in Flanders (West-Flanders core territory).
 * Technicians should only be dispatched within the same region on any single working day
 * to eliminate inefficient travel and back-and-forth commuting.
 */
export const OPERATIONAL_REGIONS: Record<string, string[]> = {
  KORTRIJK_CENTRAL: ['kortrijk', 'kuurne', 'heule', 'harelbeke', 'wevelgem', 'menen'],
  ZWEVEGEM_SOUTH: ['zwevegem', 'avelgem', 'anzegem', 'heestert'],
  WAREGEM_EAST: ['waregem', 'deerlijk', 'wielsbeke'],
  ROESELARE_NORTH: ['roeselare', 'izegem'],
  OUDENAARDE: ['oudenaarde', 'enaarde'],
}

/**
 * Checks if two municipality names belong to the same operational cluster/region.
 * Used to ensure technicians are never scheduled in multiple conflicting cities on the same day.
 */
export function areCitiesInSameRegion(cityA?: string | null, cityB?: string | null): boolean {
  if (!cityA || !cityB) return true
  const a = cityA.trim().toLowerCase()
  const b = cityB.trim().toLowerCase()

  if (a === b) return true

  for (const cluster of Object.values(OPERATIONAL_REGIONS)) {
    const hasA = cluster.some((c) => a.includes(c))
    const hasB = cluster.some((c) => b.includes(c))
    if (hasA && hasB) {
      return true
    }
  }

  return false
}

/**
 * Returns a human-friendly region label or canonical city name.
 */
export function getRegionLabel(city?: string | null): string {
  if (!city) return 'Overig'
  const norm = city.trim().toLowerCase()

  for (const [key, cluster] of Object.entries(OPERATIONAL_REGIONS)) {
    if (cluster.some((c) => norm.includes(c))) {
      switch (key) {
        case 'KORTRIJK_CENTRAL':
          return 'Regio Kortrijk'
        case 'ZWEVEGEM_SOUTH':
          return 'Regio Zwevegem'
        case 'WAREGEM_EAST':
          return 'Regio Waregem'
        case 'ROESELARE_NORTH':
          return 'Regio Roeselare'
        case 'OUDENAARDE':
          return 'Regio Oudenaarde'
      }
    }
  }

  return normalizeCity(city)
}

