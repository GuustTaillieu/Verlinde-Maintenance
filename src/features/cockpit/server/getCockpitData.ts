import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { sites, customers, workOrders, equipment } from '#/db/schema'
import { eq, inArray, desc, count } from 'drizzle-orm'
import type { CockpitData, FireTodoItem, RegionalCluster, ClusterSiteItem, FireStage } from '../types'

export const getCockpitDataFn = createServerFn({ method: 'GET' }).handler(async (): Promise<CockpitData> => {
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

  const fireSites = siteResults.filter((r) => r.site.primaryDiscipline === 'FIRE')
  const fireTodos: FireTodoItem[] = []

  let urgentFireCount = 0
  let pendingApprovalCount = 0

  for (const { site, customer } of fireSites) {
    const dueIso = site.nextDueDate || '2025-01-01'
    const dueMs = new Date(dueIso).getTime()
    const diffDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24))
    const isOverdueOrSoon = diffDays >= -30

    const existingWo = activeWoBySiteId.get(site.id)

    let stage: FireStage = 'NEEDS_PROPOSAL'
    if (existingWo) {
      if (existingWo.status === 'PROPOSED') {
        stage = 'PENDING_APPROVAL'
        pendingApprovalCount++
      } else if (existingWo.status === 'SCHEDULED') {
        const plannedMs = existingWo.plannedDate ? new Date(existingWo.plannedDate).getTime() : 0
        if (plannedMs <= todayMs) {
          stage = 'AWAITING_ATTEST'
        } else {
          stage = 'PENDING_APPROVAL'
        }
      }
    }

    if (isOverdueOrSoon && stage === 'NEEDS_PROPOSAL') {
      urgentFireCount++
    }

    if (isOverdueOrSoon || existingWo) {
      fireTodos.push({
        siteId: site.id,
        sheetNumber: site.sheetNumber,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || customer.mobile,
        siteName: site.name,
        siteAddress: site.siteAddress,
        siteCity: site.siteCity,
        nextDueDate: dueIso,
        daysOverdue: Math.max(0, diffDays),
        stage,
        workOrderId: existingWo?.id || null,
        proposedDate: existingWo?.plannedDate || null,
        plannedStartTime: existingWo?.plannedStartTime || null,
        plannedEndTime: existingWo?.plannedEndTime || null,
        certificateDocument: existingWo?.certificateDocument || null,
      })
    }
  }

  fireTodos.sort((a, b) => {
    const priority = { AWAITING_ATTEST: 0, NEEDS_PROPOSAL: 1, PENDING_APPROVAL: 2, COMPLETED: 3 }
    if (priority[a.stage] !== priority[b.stage]) {
      return priority[a.stage] - priority[b.stage]
    }
    return b.daysOverdue - a.daysOverdue
  })

  const nonFireSites = siteResults.filter((r) => r.site.primaryDiscipline !== 'FIRE')

  interface RawSiteEntry {
    site: typeof sites.$inferSelect
    customer: typeof customers.$inferSelect
    diffDays: number
    dueIso: string
  }

  const locationGroups = new Map<string, RawSiteEntry[]>()
  let overdueCount = 0
  let upcomingCount = 0

  for (const { site, customer } of nonFireSites) {
    const dueIso = site.nextDueDate || '2025-01-01'
    const dueMs = new Date(dueIso).getTime()
    const diffDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24))

    const hasActiveWo = activeWoBySiteId.has(site.id)

    if (diffDays > 0) {
      overdueCount++
    } else if (diffDays >= -60) {
      upcomingCount++
    }

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
    const inspectionHours = Math.max(0.75, Math.round(((entries.length * 0.5) + (totalEquipmentCount * 0.1)) * 2) / 2)
    const durationHours = Math.round((baseTravelHours + inspectionHours) * 10) / 10

    const maxDaysOverdue = Math.max(...entries.map((e) => Math.max(0, e.diffDays)))
    const earliestDueDate = entries.map((e) => e.dueIso).sort()[0]

    let displayName = customer.name
    if (first.site.name && !first.site.name.toLowerCase().startsWith('inbraak') && !first.site.name.toLowerCase().startsWith('camera')) {
      displayName = first.site.name
    }

    const clusterItem: ClusterSiteItem = {
      id: siteIds[0],
      siteIds,
      sheetNumber: sheetNumbers.join(', '),
      sheetNumbers,
      name: displayName,
      customerName: customer.name,
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

  const regionalClusters: RegionalCluster[] = []
  for (const [city, items] of clusterMap.entries()) {
    if (items.length === 0) continue
    const defaultTech = techAssignments[city] || { id: 'usr_tom', name: 'Tom De Coninck' }
    const estimatedHours = Math.round(items.reduce((sum, item) => sum + item.durationHours, 0) * 10) / 10
    const totalSheetsCount = items.reduce((sum, item) => sum + item.sheetNumbers.length, 0)

    regionalClusters.push({
      city,
      siteCount: items.length,
      totalSheetsCount,
      sites: items.sort((a, b) => b.daysOverdue - a.daysOverdue),
      recommendedTechId: defaultTech.id,
      recommendedTechName: defaultTech.name,
      estimatedHours,
    })
  }

  regionalClusters.sort((a, b) => b.siteCount - a.siteCount)

  return {
    kpis: {
      urgentFireCount,
      overdueCount,
      pendingApprovalCount,
      upcomingCount,
    },
    fireTodos,
    regionalClusters,
  }
})
