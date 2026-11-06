import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { sites, workOrders } from '#/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import type { MaintenanceKPIs } from '../types'

export const getMaintenanceKpisFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MaintenanceKPIs> => {
    const todayIso = new Date().toISOString().split('T')[0]
    const todayMs = new Date(todayIso).getTime()

    const activeSites = await db
      .select({
        id: sites.id,
        primaryDiscipline: sites.primaryDiscipline,
        nextDueDate: sites.nextDueDate,
      })
      .from(sites)
      .where(eq(sites.isActive, true))

    const activeWos = await db
      .select({
        id: workOrders.id,
        siteId: workOrders.siteId,
        status: workOrders.status,
        plannedDate: workOrders.plannedDate,
      })
      .from(workOrders)
      .where(inArray(workOrders.status, ['PROPOSED', 'SCHEDULED', 'IN_PROGRESS']))
      .orderBy(desc(workOrders.plannedDate))

    const activeWoBySiteId = new Map<string, (typeof activeWos)[number]>()
    for (const wo of activeWos) {
      if (wo.siteId && !activeWoBySiteId.has(wo.siteId)) {
        activeWoBySiteId.set(wo.siteId, wo)
      }
    }

    let urgentFireCount = 0
    let pendingApprovalCount = 0
    let overdueCount = 0
    let upcomingCount = 0

    for (const site of activeSites) {
      const dueIso = site.nextDueDate || '2025-01-01'
      const dueMs = new Date(dueIso).getTime()
      const diffDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24))
      const existingWo = activeWoBySiteId.get(site.id)

      const isWaitingForStep =
        existingWo?.status === 'PROPOSED' ||
        (existingWo?.status === 'SCHEDULED' &&
          site.primaryDiscipline === 'FIRE' &&
          (existingWo.plannedDate ? new Date(existingWo.plannedDate).getTime() <= todayMs : false))

      if (isWaitingForStep) {
        pendingApprovalCount++
      }

      if (site.primaryDiscipline === 'FIRE') {
        urgentFireCount++
      } else {
        if (diffDays > 0) {
          overdueCount++
        } else if (diffDays >= -90) {
          upcomingCount++
        }
      }
    }

    return {
      urgentFireCount,
      overdueCount,
      pendingApprovalCount,
      upcomingCount,
    }
  }
)
