import { db } from '#/db'
import { sites, workOrders, equipment } from '#/db/schema'
import { addMonthsToIso } from '#/features/shared/lib/date'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { uploadFireAttestInputSchema } from '../types'
import { managerMiddleware } from '#/features/auth/server/authGuards'

export const uploadFireAttestFn = createServerFn({ method: 'POST' })
  .middleware([managerMiddleware])
  .validator(uploadFireAttestInputSchema)
  .handler(async ({ data }) => {
    const todayIso = new Date().toISOString().split('T')[0]
    const nextDue = addMonthsToIso(todayIso, 12)

    // Atomic transaction updating work order, site dates, and all linked equipment
    await db.transaction(async (tx) => {
      await tx
        .update(workOrders)
        .set({
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          certificateDocument: data.certificateDocument,
          officeNotes:
            data.officeNotes || 'Keuringsattest NBN S 21-100 goedgekeurd en gearchiveerd',
        })
        .where(eq(workOrders.id, data.workOrderId))


      await tx
        .update(sites)
        .set({
          lastServiceDate: todayIso,
          nextDueDate: nextDue,
        })
        .where(eq(sites.id, data.siteId))

      // Bump last service date and next due date on all equipment for this site
      await tx
        .update(equipment)
        .set({
          lastServiceDate: todayIso,
          nextDueDate: nextDue,
        })
        .where(eq(equipment.siteId, data.siteId))
    })

    return { success: true, nextDueDate: nextDue }
  })
