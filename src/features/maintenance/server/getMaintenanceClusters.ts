import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { sites, customers, workOrders, equipment } from '#/db/schema'
import { eq, inArray, desc, count } from 'drizzle-orm'
import type { MaintenanceCluster, ClusterSiteItem } from '../types'

export const getMaintenanceClustersFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MaintenanceCluster[]> => {
    const todayIso = '2025-03-01'
    const todayMs = new Date(todayIso).getTime()

    const siteResults = await db
      .select({
        site: sites,
        customer: customers,
      })
      .from(sites)
      .innerJoin(customers, eq(sites.customerId, customers.id))
      .where(eq(sites.isActive, true))

    const activeWos = await db
      .select()
      .from(workOrders)
      .where(inArray(workOrders.status, ['PROPOSED', 'SCHEDULED', 'IN_PROGRESS']))
      .orderBy(desc(workOrders.plannedDate))

    const activeWoBySiteId = new Map<string, typeof workOrders.$inferSelect>()
    for (const wo of activeWos) {
      if (wo.siteId && !activeWoBySiteId.has(wo.siteId)) {
        activeWoBySiteId.set(wo.siteId, wo)
      }
    }

    const equipmentRows = await db
      .select({
        siteId: equipment.siteId,
        cnt: count(),
      })
      .from(equipment)
      .groupBy(equipment.siteId)

    const equipmentCountBySiteId = new Map<string, number>()
    for (const row of equipmentRows) {
      if (row.siteId) {
        equipmentCountBySiteId.set(row.siteId, Number(row.cnt) || 0)
      }
    }

    const nonFireSites = siteResults.filter((r) => r.site.primaryDiscipline !== 'FIRE')

    interface RawSiteEntry {
      site: typeof sites.$inferSelect
      customer: typeof customers.$inferSelect
      diffDays: number
      dueIso: string
    }

    const locationGroups = new Map<string, RawSiteEntry[]>()

    for (const { site, customer } of nonFireSites) {
      const dueIso = site.nextDueDate || '2025-01-01'
      const dueMs = new Date(dueIso).getTime()
      const diffDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24))

      const hasActiveWo = activeWoBySiteId.has(site.id)

      if (!hasActiveWo && (diffDays > 0 || diffDays >= -45)) {
        const locKey = `${customer.id}_${site.siteAddress.toLowerCase().trim()}`
        const existingGroup = locationGroups.get(locKey) || []
        existingGroup.push({ site, customer, diffDays, dueIso })
        locationGroups.set(locKey, existingGroup)
      }
    }

    const clusterMap = new Map<string, ClusterSiteItem[]>()

    for (const entries of locationGroups.values()) {
      if (entries.length === 0) continue

      const first = entries[0]
      const customer = first.customer
      const city = (first.site.siteCity || 'Zwevegem').trim()
      const normalizedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()

      const siteIds = entries.map((e) => e.site.id)
      const sheetNumbers = entries.map((e) => e.site.sheetNumber)
      const disciplines = Array.from(new Set(entries.map((e) => e.site.primaryDiscipline)))

      let totalEquipmentCount = 0
      for (const id of siteIds) {
        totalEquipmentCount += equipmentCountBySiteId.get(id) || 0
      }

      const baseTravelHours = 0.5
      const inspectionHours = Math.max(
        0.75,
        Math.round(((entries.length * 0.5) + (totalEquipmentCount * 0.1)) * 2) / 2
      )
      const durationHours = Math.round((baseTravelHours + inspectionHours) * 10) / 10

      const maxDaysOverdue = Math.max(...entries.map((e) => Math.max(0, e.diffDays)))
      const earliestDueDate = entries.map((e) => e.dueIso).sort()[0]

      let displayName = customer.name
      if (
        first.site.name &&
        !first.site.name.toLowerCase().startsWith('inbraak') &&
        !first.site.name.toLowerCase().startsWith('camera')
      ) {
        displayName = first.site.name
      }

      const clusterItem: ClusterSiteItem = {
        id: siteIds[0],
        siteIds,
        sheetNumber: sheetNumbers.join(', '),
        sheetNumbers,
        name: displayName,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email || null,
        customerPhone: customer.phone || customer.mobile || null,
        address: first.site.siteAddress,
        city: normalizedCity,
        disciplines,
        equipmentCount: totalEquipmentCount,
        durationHours,
        nextDueDate: earliestDueDate,
        daysOverdue: maxDaysOverdue,
      }

      const list = clusterMap.get(normalizedCity) || []
      list.push(clusterItem)
      clusterMap.set(normalizedCity, list)
    }

    const techAssignments: Record<string, { id: string; name: string }> = {
      Kortrijk: { id: 'usr_tom', name: 'Tom De Coninck' },
      Kuurne: { id: 'usr_tom', name: 'Tom De Coninck' },
      Heule: { id: 'usr_tom', name: 'Tom De Coninck' },
      Harelbeke: { id: 'usr_tom', name: 'Tom De Coninck' },
      Zwevegem: { id: 'usr_wout', name: 'Wout Vanhoutte' },
      Avelgem: { id: 'usr_wout', name: 'Wout Vanhoutte' },
      Anzegem: { id: 'usr_wout', name: 'Wout Vanhoutte' },
      Menen: { id: 'usr_wout', name: 'Wout Vanhoutte' },
      Waregem: { id: 'usr_jens', name: 'Jens Maes' },
      Deerlijk: { id: 'usr_jens', name: 'Jens Maes' },
    }

    const clusters: MaintenanceCluster[] = []
    for (const [city, items] of clusterMap.entries()) {
      if (items.length === 0) continue
      const defaultTech = techAssignments[city] || { id: 'usr_tom', name: 'Tom De Coninck' }
      const estimatedHours =
        Math.round(items.reduce((sum, item) => sum + item.durationHours, 0) * 10) / 10
      const totalSheetsCount = items.reduce((sum, item) => sum + item.sheetNumbers.length, 0)

      clusters.push({
        city,
        siteCount: items.length,
        totalSheetsCount,
        sites: items.sort((a, b) => b.daysOverdue - a.daysOverdue),
        recommendedTechId: defaultTech.id,
        recommendedTechName: defaultTech.name,
        estimatedHours,
      })
    }

    clusters.sort((a, b) => b.siteCount - a.siteCount)

    return clusters
  }
)

