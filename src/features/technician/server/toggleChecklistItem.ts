import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { workOrderItems, workOrders } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { authMiddleware, AuthError } from '#/features/auth/server/authGuards'

export const toggleChecklistItemInputSchema = z.object({
  workOrderId: z.string(),
  itemId: z.string(),
  isChecked: z.boolean(),
  description: z.string().optional(),
  quantity: z.number().optional().default(1),
  techRemarks: z.string().optional(),
})

export const toggleChecklistItemFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(toggleChecklistItemInputSchema)
  .handler(async ({ data, context }) => {
    const currentUser = context.user
    if (!currentUser) {
      throw new AuthError('Niet geauthenticeerd.', 401)
    }

    // 1. Verify technician owns this work order
    const [wo] = await db
      .select({
        id: workOrders.id,
        assignedTechnicianId: workOrders.assignedTechnicianId,
        status: workOrders.status,
      })
      .from(workOrders)
      .where(eq(workOrders.id, data.workOrderId))
      .limit(1)

    if (!wo) {
      throw new AuthError('Werkorder niet gevonden.', 404)
    }

    if (currentUser.role === 'TECHNICIAN' && wo.assignedTechnicianId !== currentUser.id) {
      throw new AuthError('U heeft geen toegang om deze werkorder te bewerken.', 403)
    }

    // 2. Automatically advance status to IN_PROGRESS when starting checklist
    if (wo.status === 'SCHEDULED') {
      await db
        .update(workOrders)
        .set({ status: 'IN_PROGRESS' })
        .where(eq(workOrders.id, data.workOrderId))
    }

    // 3. Upsert the checklist item
    const existing = await db
      .select({ id: workOrderItems.id })
      .from(workOrderItems)
      .where(eq(workOrderItems.id, data.itemId))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(workOrderItems)
        .set({
          isChecked: data.isChecked,
          ...(data.techRemarks !== undefined ? { techRemarks: data.techRemarks } : {}),
        })
        .where(eq(workOrderItems.id, data.itemId))
    } else {
      // Dynamic default item persisted on first interaction
      await db.insert(workOrderItems).values({
        id: data.itemId,
        workOrderId: data.workOrderId,
        description: data.description || 'Standaard controlepunt',
        quantity: data.quantity,
        isChecked: data.isChecked,
        techRemarks: data.techRemarks || null,
      })
    }

    return {
      success: true,
      workOrderId: data.workOrderId,
      itemId: data.itemId,
      isChecked: data.isChecked,
    }
  })
