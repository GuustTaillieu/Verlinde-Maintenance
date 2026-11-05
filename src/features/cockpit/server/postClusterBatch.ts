import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { sites, workOrders } from '#/db/schema'
import { inArray } from 'drizzle-orm'

export const planClusterBatchFn = createServerFn({ method: 'POST' })
    .validator(
        (d: {
            siteIds?: string[]
            techId: string
            plannedDate?: string
            assignments?: Array<{
                siteId?: string
                siteIds?: string[]
                techId: string
                plannedDate: string
                startTime: string
                endTime: string
            }>
        }) => d
    )
    .handler(async ({ data }) => {
        if (data.assignments && data.assignments.length > 0) {
            const allSiteIds = Array.from(
                new Set(
                    data.assignments.flatMap((a) =>
                        a.siteIds && a.siteIds.length > 0 ? a.siteIds : a.siteId ? [a.siteId] : []
                    )
                )
            )

            const siteRows = allSiteIds.length > 0
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
                    const id = `wo_cl_${Date.now()}_${randomSuffix}`

                    await db.insert(workOrders).values({
                        id,
                        woNumber,
                        customerId: s.customerId,
                        siteId: s.id,
                        assignedTechnicianId: assignment.techId,
                        status: 'SCHEDULED',
                        kind: 'MAINTENANCE',
                        plannedDate: assignment.plannedDate,
                        plannedStartTime: assignment.startTime,
                        plannedEndTime: assignment.endTime,
                        description: `Periodiek onderhoud beveiliging (${s.name})`,
                        siteAddress: s.siteAddress,
                    })
                    createdCount++
                }
            }
            return { success: true, count: createdCount }
        }

        if (!data.siteIds || data.siteIds.length === 0 || !data.plannedDate) {
            return { success: false, count: 0 }
        }

        const siteRows = await db
            .select()
            .from(sites)
            .where(inArray(sites.id, data.siteIds))

        let startHour = 8
        let startMin = 30

        for (const s of siteRows) {
            const randomSuffix = Math.floor(1000 + Math.random() * 9000)
            const woNumber = `WB2025-${randomSuffix}`
            const id = `wo_cl_${Date.now()}_${randomSuffix}`

            const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`
            startMin += 30
            if (startMin >= 60) {
                startHour += 1
                startMin -= 60
            }
            startHour += 1
            const endTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`

            await db.insert(workOrders).values({
                id,
                woNumber,
                customerId: s.customerId,
                siteId: s.id,
                assignedTechnicianId: data.techId,
                status: 'SCHEDULED',
                kind: 'MAINTENANCE',
                plannedDate: data.plannedDate,
                plannedStartTime: startTime,
                plannedEndTime: endTime,
                description: `Periodiek onderhoud beveiliging (${s.name})`,
                siteAddress: s.siteAddress,
            })
        }

        return { success: true, count: siteRows.length }
    })