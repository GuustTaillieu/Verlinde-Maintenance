import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { workOrders } from '#/db/schema'
import { eq, sql } from 'drizzle-orm'

export const proposeFireAppointmentFn = createServerFn({ method: 'POST' })
    .validator((d: { siteId: string; customerId: string; proposedDate: string; startTime?: string; endTime?: string }) => d)
    .handler(async ({ data }) => {
        const existing = await db
            .select()
            .from(workOrders)
            .where(sql`${workOrders.siteId} = ${data.siteId} AND ${workOrders.status} IN ('PROPOSED', 'SCHEDULED')`)
            .limit(1)

        const randomSuffix = Math.floor(1000 + Math.random() * 9000)
        const woNumber = `WB2025-BRT-${randomSuffix}`

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
        await db.insert(workOrders).values({
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

        return { success: true, workOrderId: id }
    })

export const confirmFireAppointmentFn = createServerFn({ method: 'POST' })
    .validator((d: { workOrderId: string }) => d)
    .handler(async ({ data }) => {
        await db
            .update(workOrders)
            .set({
                status: 'SCHEDULED',
            })
            .where(eq(workOrders.id, data.workOrderId))

        return { success: true }
    })