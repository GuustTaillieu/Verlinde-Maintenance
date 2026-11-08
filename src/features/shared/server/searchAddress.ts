import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export interface AddressSuggestion {
  formatted: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
}

export const searchAddressInputSchema = z.object({
  query: z.string().trim(),
})

// In-memory cache for fast responsive lookups
const addressCache = new Map<string, { data: AddressSuggestion[]; timestamp: number }>()
const CACHE_TTL_MS = 1000 * 60 * 30 // 30 minutes

export const searchAddressFn = createServerFn({ method: 'GET' })
  .validator(searchAddressInputSchema)
  .handler(async ({ data }): Promise<AddressSuggestion[]> => {
    const q = data.query.trim()
    if (q.length < 3) return []

    const cacheKey = q.toLowerCase()
    const cached = addressCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q
      )}&countrycodes=be&addressdetails=1&format=json&limit=6`

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'VerlindenSecurityApp/1.0 (dispatch@verlinden-security.be)',
          'Accept-Language': 'nl-BE,nl;q=0.9',
        },
      })

      if (!res.ok) {
        return []
      }

      const results = (await res.json()) as Array<{
        display_name: string
        address?: {
          road?: string
          pedestrian?: string
          street?: string
          house_number?: string
          postcode?: string
          city?: string
          town?: string
          village?: string
          municipality?: string
        }
      }>

      const suggestions: AddressSuggestion[] = []

      for (const item of results) {
        const addr = item.address
        if (!addr) continue

        const street = (addr.road || addr.pedestrian || addr.street || '').trim()
        const houseNumber = (addr.house_number || '').trim()
        const postalCode = (addr.postcode || '').trim()
        const city = (addr.city || addr.town || addr.village || addr.municipality || '').trim()

        // Filter out bare cities or administrative areas that have no street address
        if (!street || !city) continue

        const streetLine = houseNumber ? `${street} ${houseNumber}` : street
        const formatted = `${streetLine}, ${postalCode ? `${postalCode} ` : ''}${city}`

        suggestions.push({
          formatted,
          street: streetLine,
          houseNumber,
          postalCode,
          city,
        })
      }

      addressCache.set(cacheKey, { data: suggestions, timestamp: Date.now() })
      return suggestions
    } catch {
      return []
    }
  })
