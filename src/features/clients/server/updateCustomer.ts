import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { customers } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { managerMiddleware } from '#/features/auth/server/authGuards'

export const updateCustomerInputSchema = z.object({
  customerId: z.string(),
  name: z.string().min(1, 'Klantnaam is verplicht'),
  vatNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  invoiceAddress: z.string().min(1, 'Facturatieadres is verplicht'),
  invoiceZip: z.string().nullable().optional(),
  invoiceCity: z.string().min(1, 'Gemeente is verplicht'),
})

export const updateCustomerFn = createServerFn({ method: 'POST' })
  .middleware([managerMiddleware])
  .validator(updateCustomerInputSchema)
  .handler(async ({ data }) => {
    await db
      .update(customers)
      .set({
        name: data.name.trim(),
        vatNumber: data.vatNumber?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        mobile: data.mobile?.trim() || null,
        invoiceAddress: data.invoiceAddress.trim(),
        invoiceZip: data.invoiceZip?.trim() || null,
        invoiceCity: data.invoiceCity.trim(),
      })
      .where(eq(customers.id, data.customerId))

    return { success: true }
  })
