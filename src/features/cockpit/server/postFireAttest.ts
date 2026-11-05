import { db } from "#/db";
import { sites, workOrders } from "#/db/schema";
import { addMonthsToIso } from "#/features/shared/lib/date";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

export const uploadFireAttestFn = createServerFn({ method: 'POST' })
    .validator((d: { workOrderId: string; siteId: string; certificateDocument: string; officeNotes?: string }) => d)
    .handler(async ({ data }) => {
        const todayIso = '2025-03-01'
        const nextDue = addMonthsToIso(todayIso, 12)

        await db
            .update(workOrders)
            .set({
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                certificateDocument: data.certificateDocument,
                officeNotes: data.officeNotes || 'Keuringsattest Brandtec goedgekeurd en gearchiveerd',
            })
            .where(eq(workOrders.id, data.workOrderId))

        await db
            .update(sites)
            .set({
                lastServiceDate: todayIso,
                nextDueDate: nextDue,
            })
            .where(eq(sites.id, data.siteId))

        return { success: true, nextDueDate: nextDue }
    })