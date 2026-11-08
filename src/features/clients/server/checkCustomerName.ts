import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { customers } from '#/db/schema'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { managerMiddleware } from '#/features/auth/server/authGuards'

export const checkCustomerNameInputSchema = z.object({
  name: z.string().trim(),
})

export interface CheckCustomerNameResult {
  isDuplicate: boolean
  existingCustomer?: {
    id: string
    code: string
    name: string
    invoiceCity: string | null
    vatNumber: string | null
  }
}

export const checkCustomerNameFn = createServerFn({ method: 'GET' })
  .middleware([managerMiddleware])
  .validator(checkCustomerNameInputSchema)
  .handler(async ({ data }): Promise<CheckCustomerNameResult> => {
    const trimmed = data.name.trim()
    if (trimmed.length < 2) {
      return { isDuplicate: false }
    }

    // Case-insensitive exact name lookup
    const matches = await db
      .select({
        id: customers.id,
        code: customers.code,
        name: customers.name,
        invoiceCity: customers.invoiceCity,
        vatNumber: customers.vatNumber,
      })
      .from(customers)
      .where(sql`LOWER(TRIM(${customers.name})) = LOWER(TRIM(${trimmed})) AND ${customers.isActive} = 1`)
      .limit(1)

    if (matches.length > 0) {
      return {
        isDuplicate: true,
        existingCustomer: matches[0],
      }
    }

    return { isDuplicate: false }
  })
