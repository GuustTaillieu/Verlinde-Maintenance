import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { sites, customers, workOrders, equipment } from '#/db/schema'
import { eq, inArray, desc, count } from 'drizzle-orm'
import type { MaintenanceCluster, ClusterSiteItem } from '../types'
import { normalizeCity } from '../utils/regionUtils'
import { managerMiddleware } from '#/features/auth/server/authGuards'

export const getMaintenanceClustersFn = createServerFn({ method: 'GET' })
  .middleware([managerMiddleware])
  .handler(async (): Promise<MaintenanceCluster[]> => {
    const todayIso = new Date().toISOString().split('T')[0]

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

    const clusterMap = new Map<string, ClusterSiteItem[]>()

    for (const { site, customer } of nonFireSites) {
      const dueIso = site.nextDueDate || '2025-01-01'
      const dueMs = new Date(dueIso).getTime()
      const diffDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24))

      const hasActiveWo = activeWoBySiteId.has(site.id)

      if (!hasActiveWo && (diffDays > 0 || diffDays >= -90)) {
        const rawCity = (site.siteCity || 'Overig').trim()
        const normalizedCity = normalizeCity(rawCity) || 'Overig'

        const totalEquipmentCount = equipmentCountBySiteId.get(site.id) || 1
        const durationHours = 1.5

        const clusterItem: ClusterSiteItem = {
          id: site.id,
          siteIds: [site.id],
          sheetNumber: site.sheetNumber,
          sheetNumbers: [site.sheetNumber],
          name: site.name,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email || null,
          customerPhone: customer.phone || customer.mobile || null,
          address: site.siteAddress,
          city: normalizedCity,
          disciplines: [site.primaryDiscipline],
          equipmentCount: totalEquipmentCount,
          durationHours,
          nextDueDate: dueIso,
          daysOverdue: Math.max(0, diffDays),
        }

        const list = clusterMap.get(normalizedCity) || []
        list.push(clusterItem)
        clusterMap.set(normalizedCity, list)
      }
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

