import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { sites, workOrders } from '#/db/schema'
import { inArray } from 'drizzle-orm'
import { planClusterBatchInputSchema, WORK_ORDER_STATUS } from '../types'

export const planClusterBatchFn = createServerFn({ method: 'POST' })
  .validator(planClusterBatchInputSchema)
  .handler(async ({ data }) => {
    if (data.assignments && data.assignments.length > 0) {
      const allSiteIds = Array.from(
        new Set(
          data.assignments.flatMap((a) =>
            a.siteIds && a.siteIds.length > 0 ? a.siteIds : a.siteId ? [a.siteId] : []
          )
        )
      )

      const siteRows =
        allSiteIds.length > 0
          ? await db.select().from(sites).where(inArray(sites.id, allSiteIds))
          : []
      const siteMap = new Map(siteRows.map((s) => [s.id, s]))

      let createdCount = 0
      for (const assignment of data.assignments) {
        const targetSiteIds =
          assignment.siteIds && assignment.siteIds.length > 0
            ? assignment.siteIds
            : assignment.siteId
              ? [assignment.siteId]
              : []

        for (const sId of targetSiteIds) {
          const s = siteMap.get(sId)
          if (!s) continue
          const randomSuffix = Math.floor(1000 + Math.random() * 9000)
          const woNumber = `WB2025-${randomSuffix}`

          const id = `wo_batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
          await db.insert(workOrders).values({
            id,
            woNumber,
            customerId: s.customerId,
            siteId: s.id,
            assignedTechnicianId: assignment.techId,
            status: WORK_ORDER_STATUS.PROPOSED,
            kind: 'MAINTENANCE',
            plannedDate: assignment.plannedDate,
            plannedStartTime: assignment.startTime,
            plannedEndTime: assignment.endTime,
            description: `Geclusterd periodiek onderhoud (${s.primaryDiscipline})`,
          })
          createdCount++
        }
      }

      return { success: true, count: createdCount }
    }

    if (data.siteIds && data.siteIds.length > 0 && data.plannedDate) {
      const siteRows = await db.select().from(sites).where(inArray(sites.id, data.siteIds))

      let createdCount = 0
      for (const s of siteRows) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000)
        const woNumber = `WB2025-${randomSuffix}`

        const id = `wo_batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        await db.insert(workOrders).values({
          id,
          woNumber,
          customerId: s.customerId,
          siteId: s.id,
          assignedTechnicianId: data.techId,
          status: WORK_ORDER_STATUS.PROPOSED,
          kind: 'MAINTENANCE',
          plannedDate: data.plannedDate,
          plannedStartTime: '08:30',
          plannedEndTime: '12:00',
          description: `Geclusterd periodiek onderhoud (${s.primaryDiscipline})`,
        })
        createdCount++
      }

      return { success: true, count: createdCount }
    }

    return { success: false, error: 'Geen werven opgegeven' }
  })
