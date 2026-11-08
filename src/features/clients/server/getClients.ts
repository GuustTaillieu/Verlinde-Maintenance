import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { customers, sites } from '#/db/schema'
import { eq } from 'drizzle-orm'
import {
  getClientsFilterSchema,
  type ClientListItem,
  type MaintenanceHealthStatus,
} from '../types'
import { managerMiddleware } from '#/features/auth/server/authGuards'

export interface GetClientsResult {
  items: ClientListItem[]
  cities: string[]
  counts: {
    total: number
    b2b: number
    residential: number
    overdue: number
    dueSoon: number
    compliant: number
  }
}

export const getClientsFn = createServerFn({ method: 'GET' })
  .middleware([managerMiddleware])
  .validator(getClientsFilterSchema)
  .handler(async ({ data }): Promise<GetClientsResult> => {
    const todayIso = new Date().toISOString().split('T')[0]
    const todayMs = new Date(todayIso).getTime()

    // 1. Fetch all customers
    const customerRows = await db
      .select()
      .from(customers)
      .where(eq(customers.isActive, true))
      .orderBy(customers.name)

    // 2. Fetch all active sites
    const siteRows = await db
      .select()
      .from(sites)
      .where(eq(sites.isActive, true))

    // Group sites by customerId
    const sitesByCustomer = new Map<string, typeof siteRows>()
    const allCitiesSet = new Set<string>()

    for (const s of siteRows) {
      if (s.siteCity) {
        allCitiesSet.add(s.siteCity.trim())
      }
      if (!sitesByCustomer.has(s.customerId)) {
        sitesByCustomer.set(s.customerId, [])
      }
      sitesByCustomer.get(s.customerId)!.push(s)
    }

    const cities = Array.from(allCitiesSet).sort((a, b) => a.localeCompare(b))

    let countB2b = 0
    let countResidential = 0
    let countOverdue = 0
    let countDueSoon = 0
    let countCompliant = 0

    const clientItems: ClientListItem[] = []

    for (const c of customerRows) {
      if (c.type === 'B2B') countB2b++
      else countResidential++

      const cSites = sitesByCustomer.get(c.id) || []
      const totalSites = cSites.length

      // Collect unique disciplines
      const disciplinesSet = new Set<string>()
      let earliestDueDate: string | null = null
      let healthStatus: MaintenanceHealthStatus = 'COMPLIANT'

      let hasOverdue = false
      let hasDueSoon = false

      for (const s of cSites) {
        if (s.primaryDiscipline) {
          disciplinesSet.add(s.primaryDiscipline)
        }

        if (s.nextDueDate) {
          if (!earliestDueDate || s.nextDueDate < earliestDueDate) {
            earliestDueDate = s.nextDueDate
          }

          const dueMs = new Date(s.nextDueDate).getTime()
          const diffDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24))

          if (diffDays > 0) {
            hasOverdue = true
          } else if (diffDays >= -60) {
            hasDueSoon = true
          }
        }
      }

      if (hasOverdue) {
        healthStatus = 'OVERDUE'
        countOverdue++
      } else if (hasDueSoon) {
        healthStatus = 'DUE_SOON'
        countDueSoon++
      } else {
        healthStatus = 'COMPLIANT'
        countCompliant++
      }

      // Filter by type
      if (data.type !== 'ALL' && c.type !== data.type) {
        continue
      }

      // Filter by status
      if (data.status !== 'ALL' && healthStatus !== data.status) {
        continue
      }

      // Filter by city
      if (data.city !== 'ALL') {
        const matchesCity =
          (c.invoiceCity && c.invoiceCity.toLowerCase() === data.city.toLowerCase()) ||
          cSites.some((s) => s.siteCity && s.siteCity.toLowerCase() === data.city.toLowerCase())
        if (!matchesCity) continue
      }

      // Filter by text search
      if (data.search && data.search.trim()) {
        const q = data.search.toLowerCase().trim()
        const matchName = c.name.toLowerCase().includes(q)
        const matchCode = c.code.toLowerCase().includes(q)
        const matchCity = (c.invoiceCity || '').toLowerCase().includes(q)
        const matchStreet = (c.invoiceAddress || '').toLowerCase().includes(q)
        const matchSite = cSites.some(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.siteAddress.toLowerCase().includes(q) ||
            s.siteCity.toLowerCase().includes(q) ||
            s.sheetNumber.includes(q)
        )

        if (!matchName && !matchCode && !matchCity && !matchStreet && !matchSite) {
          continue
        }
      }

      clientItems.push({
        id: c.id,
        code: c.code,
        name: c.name,
        type: c.type as 'B2B' | 'RESIDENTIAL',
        vatNumber: c.vatNumber,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        invoiceAddress: c.invoiceAddress,
        invoiceCity: c.invoiceCity,
        invoiceZip: c.invoiceZip,
        totalSites,
        disciplines: Array.from(disciplinesSet),
        healthStatus,
        earliestDueDate,
      })
    }

    return {
      items: clientItems,
      cities,
      counts: {
        total: customerRows.length,
        b2b: countB2b,
        residential: countResidential,
        overdue: countOverdue,
        dueSoon: countDueSoon,
        compliant: countCompliant,
      },
    }
  })
