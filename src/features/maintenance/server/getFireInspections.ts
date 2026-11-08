import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { sites, customers, workOrders } from '#/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { normalizeCity } from '../utils/regionUtils'
import {
  getFireInspectionsInputSchema,
  type FireInspectionItem,
  type FireStage,
  type PaginatedInspectionsResult,
  MAINTENANCE_STAGE,
  DISCIPLINE,
  WORK_ORDER_STATUS,
  MAINTENANCE_VIEW,
} from '../types'
import { requireAuthUser } from '#/features/auth/server/authGuards'

export const getFireInspectionsFn = createServerFn({ method: 'GET' })
  .validator(getFireInspectionsInputSchema)
  .handler(async ({ data }): Promise<PaginatedInspectionsResult> => {
    await requireAuthUser(['MANAGER'])
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
      .where(
        inArray(workOrders.status, [
          WORK_ORDER_STATUS.PROPOSED,
          WORK_ORDER_STATUS.SCHEDULED,
          WORK_ORDER_STATUS.IN_PROGRESS,
        ])
      )
      .orderBy(desc(workOrders.plannedDate))

    const activeWoBySiteId = new Map<string, typeof workOrders.$inferSelect>()
    for (const wo of activeWos) {
      if (wo.siteId && !activeWoBySiteId.has(wo.siteId)) {
        activeWoBySiteId.set(wo.siteId, wo)
      }
    }

    const allInspections: FireInspectionItem[] = []

    for (const { site, customer } of siteResults) {
      const dueIso = site.nextDueDate || '2025-01-01'
      const dueMs = new Date(dueIso).getTime()
      const diffDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24))

      const existingWo = activeWoBySiteId.get(site.id)

      let stage: FireStage = MAINTENANCE_STAGE.NEEDS_PROPOSAL
      if (existingWo) {
        if (existingWo.status === WORK_ORDER_STATUS.PROPOSED) {
          stage = MAINTENANCE_STAGE.PENDING_APPROVAL
        } else if (existingWo.status === WORK_ORDER_STATUS.SCHEDULED) {
          const plannedMs = existingWo.plannedDate ? new Date(existingWo.plannedDate).getTime() : 0
          if (plannedMs <= todayMs && site.primaryDiscipline === DISCIPLINE.FIRE) {
            stage = MAINTENANCE_STAGE.AWAITING_ATTEST
          } else {
            stage = MAINTENANCE_STAGE.COMPLETED
          }
        }
      }

      const isFire = site.primaryDiscipline === DISCIPLINE.FIRE
      const isOverdue = diffDays > 0
      const isUpcoming3Months = diffDays <= 0 && diffDays >= -90
      const isWaitingStep =
        stage === MAINTENANCE_STAGE.PENDING_APPROVAL ||
        stage === MAINTENANCE_STAGE.AWAITING_ATTEST

      const isScheduledFuture =
        existingWo?.status === WORK_ORDER_STATUS.SCHEDULED &&
        (existingWo.plannedDate ? new Date(existingWo.plannedDate).getTime() > todayMs : false)

      // Only include items needing Dirk's action or waiting on external confirmation
      if (isWaitingStep || (!isScheduledFuture && (isFire || isOverdue || isUpcoming3Months))) {
        allInspections.push({
          siteId: site.id,
          sheetNumber: site.sheetNumber,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone || customer.mobile,
          siteName: site.name,
          siteAddress: site.siteAddress,
          siteCity: normalizeCity(site.siteCity) || 'Overig',
          nextDueDate: dueIso,
          daysOverdue: Math.max(0, diffDays),
          primaryDiscipline: site.primaryDiscipline || DISCIPLINE.INTRUSION,
          stage,
          workOrderId: existingWo?.id || null,
          proposedDate: existingWo?.plannedDate || null,
          plannedStartTime: existingWo?.plannedStartTime || null,
          plannedEndTime: existingWo?.plannedEndTime || null,
          certificateDocument: existingWo?.certificateDocument || null,
          diffDays,
        })
      }
    }

    const view = data?.view || MAINTENANCE_VIEW.active
    let filtered = allInspections.filter((item) => {
      const isWaiting =
        item.stage === MAINTENANCE_STAGE.PENDING_APPROVAL ||
        item.stage === MAINTENANCE_STAGE.AWAITING_ATTEST
      if (view === MAINTENANCE_VIEW.inbox) {
        return isWaiting
      } else {
        // Active queue: everything requiring Dirk's initiative (not waiting on external response)
        return !isWaiting
      }
    })

    // Search filter if query provided
    const search = data?.search?.toLowerCase().trim()
    if (search) {
      filtered = filtered.filter((item) => {
        return (
          item.customerName.toLowerCase().includes(search) ||
          item.siteName.toLowerCase().includes(search) ||
          item.sheetNumber.toLowerCase().includes(search) ||
          item.siteAddress.toLowerCase().includes(search) ||
          item.siteCity.toLowerCase().includes(search)
        )
      })
    }

    // Sort:
    if (view === MAINTENANCE_VIEW.active) {
      // Group-aware sorting:
      // 1. Fire items first (statutory compliance)
      // 2. Non-fire items grouped contiguous by municipality, with most urgent municipality first
      const cityUrgency = new Map<
        string,
        { overdueCount: number; maxOverdue: number; totalCount: number }
      >()
      for (const item of filtered) {
        if (item.primaryDiscipline === DISCIPLINE.FIRE) continue
        const city = item.siteCity || 'Overig'
        const stats = cityUrgency.get(city) || { overdueCount: 0, maxOverdue: 0, totalCount: 0 }
        if (item.daysOverdue > 0) stats.overdueCount++
        stats.maxOverdue = Math.max(stats.maxOverdue, item.daysOverdue)
        stats.totalCount++
        cityUrgency.set(city, stats)
      }

      filtered.sort((a, b) => {
        const isFireA = a.primaryDiscipline === DISCIPLINE.FIRE
        const isFireB = b.primaryDiscipline === DISCIPLINE.FIRE
        if (isFireA !== isFireB) {
          return isFireA ? -1 : 1
        }
        if (isFireA) {
          return b.daysOverdue - a.daysOverdue
        }

        const cityA = a.siteCity || 'Overig'
        const cityB = b.siteCity || 'Overig'

        if (cityA !== cityB) {
          const statsA = cityUrgency.get(cityA) || { overdueCount: 0, maxOverdue: 0, totalCount: 0 }
          const statsB = cityUrgency.get(cityB) || { overdueCount: 0, maxOverdue: 0, totalCount: 0 }

          if (statsA.overdueCount !== statsB.overdueCount) {
            return statsB.overdueCount - statsA.overdueCount
          }
          if (statsA.maxOverdue !== statsB.maxOverdue) {
            return statsB.maxOverdue - statsA.maxOverdue
          }
          return cityA.localeCompare(cityB)
        }

        return b.daysOverdue - a.daysOverdue
      })
    } else {
      // Inbox: Awaiting attest first, then pending approval
      filtered.sort((a, b) => {
        const priority: Record<FireStage, number> = {
          [MAINTENANCE_STAGE.AWAITING_ATTEST]: 0,
          [MAINTENANCE_STAGE.PENDING_APPROVAL]: 1,
          [MAINTENANCE_STAGE.NEEDS_PROPOSAL]: 2,
          [MAINTENANCE_STAGE.COMPLETED]: 3,
        }
        return priority[a.stage] - priority[b.stage]
      })
    }

    const cursor = data?.cursor ?? 0
    const limit = data?.limit ?? 50
    const items = filtered.slice(cursor, cursor + limit)
    const nextCursor = cursor + limit < filtered.length ? cursor + limit : null

    return {
      items,
      nextCursor,
      total: filtered.length,
    }
  })
