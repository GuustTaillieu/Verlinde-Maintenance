import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { workOrders, sites } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { authMiddleware, AuthError } from '#/features/auth/server/authGuards'
import { formatDateIso } from '#/features/maintenance/utils/dateUtils'

export const completeWorkOrderInputSchema = z.object({
  workOrderId: z.string(),
  signedByName: z.string().min(2, 'Naam van ondertekenaar is verplicht.'),
  signatureDataUrl: z.string().optional(),
  techNotes: z.string().optional(),
})

export const completeWorkOrderFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(completeWorkOrderInputSchema)
  .handler(async ({ data, context }) => {
    const currentUser = context.user
    if (!currentUser) {
      throw new AuthError('Niet geauthenticeerd.', 401)
    }

    // 1. Fetch work order to verify ownership
    const [wo] = await db
      .select({
        id: workOrders.id,
        woNumber: workOrders.woNumber,
        assignedTechnicianId: workOrders.assignedTechnicianId,
        siteId: workOrders.siteId,
        plannedDate: workOrders.plannedDate,
        certificateDocument: workOrders.certificateDocument,
      })
      .from(workOrders)
      .where(eq(workOrders.id, data.workOrderId))
      .limit(1)

    if (!wo) {
      throw new AuthError('Werkorder niet gevonden.', 404)
    }

    if (currentUser.role === 'TECHNICIAN' && wo.assignedTechnicianId !== currentUser.id) {
      throw new AuthError('U heeft geen toestemming om deze werkorder te voltooien.', 403)
    }

    const now = new Date()
    const nowIso = now.toISOString()
    const todayIso = formatDateIso(now)
    const certificateName =
      wo.certificateDocument || `Keuringsattest_${wo.woNumber}_NBN-S21-100.pdf`

    // 2. Mark work order as COMPLETED with digital signature
    await db
      .update(workOrders)
      .set({
        status: 'COMPLETED',
        isSigned: true,
        signedByName: data.signedByName.trim(),
        signedAt: nowIso,
        completedAt: nowIso,
        techNotes: data.techNotes?.trim() || 'Periodiek onderhoud conform voorschriften uitgevoerd en goedgekeurd.',
        certificateDocument: certificateName,
      })
      .where(eq(workOrders.id, data.workOrderId))

    // 3. Automated Lifecycle Bumping (Project Architecture Rule 4.3):
    // When a technician completes a work order, automatically bump sites.lastServiceDate and sites.nextDueDate (+12 months)
    if (wo.siteId) {
      const completionDate = wo.plannedDate || todayIso
      const nextDue = new Date(completionDate)
      nextDue.setFullYear(nextDue.getFullYear() + 1)
      const nextDueDateIso = formatDateIso(nextDue)

      await db
        .update(sites)
        .set({
          lastServiceDate: completionDate,
          nextDueDate: nextDueDateIso,
        })
        .where(eq(sites.id, wo.siteId))
    }

    return {
      success: true,
      workOrderId: data.workOrderId,
      completedAt: nowIso,
      signedByName: data.signedByName,
    }
  })
