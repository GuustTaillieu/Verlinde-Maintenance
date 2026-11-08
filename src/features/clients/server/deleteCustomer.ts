import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { customers, sites, equipment, workOrders, workOrderItems } from '#/db/schema'
import { eq, inArray, or } from 'drizzle-orm'
import { z } from 'zod'
import { managerMiddleware } from '#/features/auth/server/authGuards'

export const deleteCustomerInputSchema = z.object({
  customerId: z.string(),
  confirmName: z.string().min(1, 'Bevestigingsnaam is verplicht'),
})

export const deleteCustomerFn = createServerFn({ method: 'POST' })
  .middleware([managerMiddleware])
  .validator(deleteCustomerInputSchema)
  .handler(async ({ data }) => {
    // 1. Fetch customer to verify name and existence
    const existing = await db
      .select({ id: customers.id, name: customers.name, code: customers.code })
      .from(customers)
      .where(eq(customers.id, data.customerId))
      .limit(1)

    if (existing.length === 0) {
      throw new Error('Klant niet gevonden.')
    }

    const customer = existing[0]

    // 2. Exact name verification check
    if (customer.name.trim().toLowerCase() !== data.confirmName.trim().toLowerCase()) {
      throw new Error(
        `Ingevoerde naam \"${data.confirmName.trim()}\" komt niet overeen met klantnaam \"${customer.name}\".`
      )
    }

    // 3. Find all site IDs belonging to this customer
    const customerSites = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.customerId, data.customerId))

    const siteIds = customerSites.map((s) => s.id)

    // 4. Find all work orders for this customer or these sites
    let woIds: string[] = []
    if (siteIds.length > 0) {
      const wos = await db
        .select({ id: workOrders.id })
        .from(workOrders)
        .where(or(eq(workOrders.customerId, data.customerId), inArray(workOrders.siteId, siteIds)))
      woIds = wos.map((w) => w.id)
    } else {
      const wos = await db
        .select({ id: workOrders.id })
        .from(workOrders)
        .where(eq(workOrders.customerId, data.customerId))
      woIds = wos.map((w) => w.id)
    }

    // 5. Delete in cascade order
    if (woIds.length > 0) {
      await db.delete(workOrderItems).where(inArray(workOrderItems.workOrderId, woIds))
      await db.delete(workOrders).where(inArray(workOrders.id, woIds))
    }

    if (siteIds.length > 0) {
      await db.delete(equipment).where(inArray(equipment.siteId, siteIds))
      await db.delete(sites).where(inArray(sites.id, siteIds))
    }

    await db.delete(customers).where(eq(customers.id, data.customerId))

    return {
      success: true,
      customerName: customer.name,
      customerCode: customer.code,
    }
  })
