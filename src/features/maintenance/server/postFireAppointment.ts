import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { workOrders, equipment, workOrderItems } from '#/db/schema'
import { eq, sql, and } from 'drizzle-orm'
import {
  proposeFireAppointmentInputSchema,
  confirmFireAppointmentInputSchema,
} from '../types'
import { requireAuthUser } from '#/features/auth/server/authGuards'

export const proposeFireAppointmentFn = createServerFn({ method: 'POST' })
  .validator(proposeFireAppointmentInputSchema)
  .handler(async ({ data }) => {
    await requireAuthUser(['MANAGER'])

    const existing = await db
      .select()
      .from(workOrders)
      .where(
        sql`${workOrders.siteId} = ${data.siteId} AND ${workOrders.status} IN ('PROPOSED', 'SCHEDULED')`
      )
      .limit(1)

    const woNumber = `WO2026-BRT-${Date.now().toString().slice(-6)}`

    if (existing.length > 0) {
      await db
        .update(workOrders)
        .set({
          plannedDate: data.proposedDate,
          plannedStartTime: data.startTime || '09:00',
          plannedEndTime: data.endTime || '11:00',
          status: 'PROPOSED',
          assignedTechnicianId: 'usr_brandtec',
        })
        .where(eq(workOrders.id, existing[0].id))
      return { success: true, workOrderId: existing[0].id }
    }

    const id = `wo_brt_${Date.now()}`

    await db.transaction(async (tx) => {
      await tx.insert(workOrders).values({
        id,
        woNumber,
        customerId: data.customerId,
        siteId: data.siteId,
        assignedTechnicianId: 'usr_brandtec',
        status: 'PROPOSED',
        kind: 'MAINTENANCE',
        plannedDate: data.proposedDate,
        plannedStartTime: data.startTime || '09:00',
        plannedEndTime: data.endTime || '11:00',
        description: 'Jaarlijks branddetectie onderhoud (Brandtec BV)',
      })

      // Generate checklist items for fire equipment
      const fireEquipment = await tx
        .select()
        .from(equipment)
        .where(and(eq(equipment.siteId, data.siteId), eq(equipment.status, 'ACTIVE')))

      if (fireEquipment.length > 0) {
        for (const item of fireEquipment) {
          await tx.insert(workOrderItems).values({
            id: `woi_${id}_${item.id}`,
            workOrderId: id,
            equipmentId: item.id,
            articleCode: item.articleCode,
            description: `Branddetectiekeuring: ${item.description}`,
            quantity: item.quantity || 1,
            isChecked: false,
          })
        }
      } else {
        await tx.insert(workOrderItems).values({
          id: `woi_${id}_gen`,
          workOrderId: id,
          description: 'Wettelijke jaarlijkse branddetectiekeuring (NBN S 21-100)',
          quantity: 1,
          isChecked: false,
        })
      }
    })

    return { success: true, workOrderId: id }
  })

export const confirmFireAppointmentFn = createServerFn({ method: 'POST' })
  .validator(confirmFireAppointmentInputSchema)
  .handler(async ({ data }) => {
    await requireAuthUser(['MANAGER'])

    await db
      .update(workOrders)
      .set({
        status: 'SCHEDULED',
      })
      .where(eq(workOrders.id, data.workOrderId))

    return { success: true }
  })
