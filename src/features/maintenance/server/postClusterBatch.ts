import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { sites, workOrders, equipment, workOrderItems } from '#/db/schema'
import { inArray, eq, and } from 'drizzle-orm'
import { planClusterBatchInputSchema, WORK_ORDER_STATUS } from '../types'
import { managerMiddleware } from '#/features/auth/server/authGuards'

export const planClusterBatchFn = createServerFn({ method: 'POST' })
  .middleware([managerMiddleware])
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

      // Execute entire batch scheduling inside an atomic database transaction
      await db.transaction(async (tx) => {
        let seq = 1
        for (const assignment of data.assignments!) {
          const targetSiteIds =
            assignment.siteIds && assignment.siteIds.length > 0
              ? assignment.siteIds
              : assignment.siteId
                ? [assignment.siteId]
                : []

          for (const sId of targetSiteIds) {
            const s = siteMap.get(sId)
            if (!s) continue

            const timeCode = Date.now().toString().slice(-6)
            const randomCode = Math.floor(100 + Math.random() * 900)
            const woNumber = `WO2026-${timeCode}${seq++}${randomCode}`
            const id = `wo_batch_${Date.now()}_${seq}_${Math.random().toString(36).slice(2, 7)}`

            await tx.insert(workOrders).values({
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

            // Generate work order checklist items from site's registered equipment
            const siteEquipment = await tx
              .select()
              .from(equipment)
              .where(and(eq(equipment.siteId, s.id), eq(equipment.status, 'ACTIVE')))

            if (siteEquipment.length > 0) {
              for (const eqItem of siteEquipment) {
                await tx.insert(workOrderItems).values({
                  id: `woi_${id}_${eqItem.id}`,
                  workOrderId: id,
                  equipmentId: eqItem.id,
                  articleCode: eqItem.articleCode,
                  description: `Nazicht: ${eqItem.description} (${eqItem.location || 'Werf'})`,
                  quantity: eqItem.quantity || 1,
                  isChecked: false,
                })
              }
            } else {
              await tx.insert(workOrderItems).values({
                id: `woi_${id}_gen`,
                workOrderId: id,
                description: `Algemeen periodiek nazicht (${s.primaryDiscipline})`,
                quantity: 1,
                isChecked: false,
              })
            }

            createdCount++
          }
        }
      })

      return { success: true, count: createdCount }
    }

    if (data.siteIds && data.siteIds.length > 0 && data.plannedDate) {
      const siteRows = await db.select().from(sites).where(inArray(sites.id, data.siteIds))

      let createdCount = 0

      await db.transaction(async (tx) => {
        let seq = 1
        for (const s of siteRows) {
          const timeCode = Date.now().toString().slice(-6)
          const randomCode = Math.floor(100 + Math.random() * 900)
          const woNumber = `WO2026-${timeCode}${seq++}${randomCode}`
          const id = `wo_batch_${Date.now()}_${seq}_${Math.random().toString(36).slice(2, 7)}`

          await tx.insert(workOrders).values({
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

          const siteEquipment = await tx
            .select()
            .from(equipment)
            .where(and(eq(equipment.siteId, s.id), eq(equipment.status, 'ACTIVE')))

          if (siteEquipment.length > 0) {
            for (const eqItem of siteEquipment) {
              await tx.insert(workOrderItems).values({
                id: `woi_${id}_${eqItem.id}`,
                workOrderId: id,
                equipmentId: eqItem.id,
                articleCode: eqItem.articleCode,
                description: `Nazicht: ${eqItem.description} (${eqItem.location || 'Werf'})`,
                quantity: eqItem.quantity || 1,
                isChecked: false,
              })
            }
          } else {
            await tx.insert(workOrderItems).values({
              id: `woi_${id}_gen`,
              workOrderId: id,
              description: `Algemeen periodiek nazicht (${s.primaryDiscipline})`,
              quantity: 1,
              isChecked: false,
            })
          }

          createdCount++
        }
      })

      return { success: true, count: createdCount }
    }

    return { success: false, error: 'Geen werven opgegeven' }
  })
