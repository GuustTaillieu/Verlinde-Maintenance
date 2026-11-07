import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { sites, customers, workOrders } from '#/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import {
  getFireInspectionsInputSchema,
  type FireInspectionItem,
  type FireStage,
  type PaginatedInspectionsResult,
} from '../types'

export const getFireInspectionsFn = createServerFn({ method: 'GET' })
  .validator(getFireInspectionsInputSchema)
  .handler(async ({ data }): Promise<PaginatedInspectionsResult> => {
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

    const allInspections: FireInspectionItem[] = []

    for (const { site, customer } of siteResults) {
      const dueIso = site.nextDueDate || '2025-01-01'
      const dueMs = new Date(dueIso).getTime()
      const diffDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24))

      const existingWo = activeWoBySiteId.get(site.id)

      let stage: FireStage = 'NEEDS_PROPOSAL'
      if (existingWo) {
        if (existingWo.status === 'PROPOSED') {
          stage = 'PENDING_APPROVAL'
        } else if (existingWo.status === 'SCHEDULED') {
          const plannedMs = existingWo.plannedDate ? new Date(existingWo.plannedDate).getTime() : 0
          if (plannedMs <= todayMs && site.primaryDiscipline === 'FIRE') {
            stage = 'AWAITING_ATTEST'
          } else {
            stage = 'PENDING_APPROVAL'
          }
        }
      }

      const isFire = site.primaryDiscipline === 'FIRE'
      const isOverdue = diffDays > 0
      const isUpcoming3Months = diffDays <= 0 && diffDays >= -90
      const isWaitingStep = stage === 'PENDING_APPROVAL' || stage === 'AWAITING_ATTEST'

      // Only relevant items
      if (isFire || isOverdue || isUpcoming3Months || isWaitingStep) {
        allInspections.push({
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
          primaryDiscipline: site.primaryDiscipline || 'INTRUSION',
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

    const view = data?.view || 'active'
    let filtered = allInspections.filter((item) => {
      const isWaiting = item.stage === 'PENDING_APPROVAL' || item.stage === 'AWAITING_ATTEST'
      if (view === 'inbox') {
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
    if (view === 'active') {
      // Fire items first, then overdue descending
      filtered.sort((a, b) => {
        if ((a.primaryDiscipline === 'FIRE') !== (b.primaryDiscipline === 'FIRE')) {
          return a.primaryDiscipline === 'FIRE' ? -1 : 1
        }
        return b.daysOverdue - a.daysOverdue
      })
    } else {
      // Inbox: Awaiting attest first, then pending approval
      filtered.sort((a, b) => {
        const priority: Record<FireStage, number> = {
          AWAITING_ATTEST: 0,
          PENDING_APPROVAL: 1,
          NEEDS_PROPOSAL: 2,
          COMPLETED: 3,
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
