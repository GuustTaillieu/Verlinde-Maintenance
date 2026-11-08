import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { customers, sites } from '#/db/schema'
import { sql } from 'drizzle-orm'
import { createCustomerInputSchema } from '../types'
import { managerMiddleware } from '#/features/auth/server/authGuards'

export interface CreateCustomerResult {
  success: boolean
  customerId: string
  code: string
  sheetNumber: string
}

export const createCustomerFn = createServerFn({ method: 'POST' })
  .middleware([managerMiddleware])
  .validator(createCustomerInputSchema)
  .handler(async ({ data }): Promise<CreateCustomerResult> => {
    const trimmedName = data.name.trim()

    // 1. Check duplicate name if not explicitly allowed
    if (!data.allowDuplicate) {
      const existing = await db
        .select({ id: customers.id, code: customers.code, name: customers.name })
        .from(customers)
        .where(sql`LOWER(TRIM(${customers.name})) = LOWER(TRIM(${trimmedName})) AND ${customers.isActive} = 1`)
        .limit(1)

      if (existing.length > 0) {
        throw new Error(
          `Er bestaat reeds een klant met de naam "${existing[0].name}" (Klantcode: ${existing[0].code}).`
        )
      }
    }

    // 2. Generate next customer code (K00001 format)
    const existingCodes = await db
      .select({ code: customers.code })
      .from(customers)

    let maxKNum = 800
    for (const row of existingCodes) {
      const match = row.code.match(/^K(\d+)$/i)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxKNum) maxKNum = num
      }
    }
    const nextCode = `K${String(maxKNum + 1).padStart(5, '0')}`

    // 3. Generate next sheet number
    const existingSheets = await db
      .select({ sheetNumber: sites.sheetNumber })
      .from(sites)

    let maxSheetNum = 1200
    for (const row of existingSheets) {
      const match = row.sheetNumber.match(/\d+/)
      if (match) {
        const num = parseInt(match[0], 10)
        if (num > maxSheetNum) maxSheetNum = num
      }
    }
    const nextSheetNumber = String(maxSheetNum + 1)

    // 4. Generate unique IDs
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const newCustomerId = `cust_${nextCode.toLowerCase()}_${randomSuffix}`
    const newSiteId = `site_${nextSheetNumber}_${randomSuffix}`

    const finalSiteAddress = data.siteAddress?.trim() || data.invoiceAddress.trim()
    const finalSiteCity = data.siteCity?.trim() || data.invoiceCity.trim()
    const finalSiteZip = data.siteZip?.trim() || data.invoiceZip?.trim() || null
    const finalSiteName = data.siteName?.trim() || `${data.primaryDiscipline === 'FIRE' ? 'Branddetectie' : data.primaryDiscipline === 'CCTV' ? 'Camerabewaking' : data.primaryDiscipline === 'ACCESS' ? 'Toegangscontrole' : 'Inbraakbeveiliging'} ${trimmedName}`

    const todayIso = new Date().toISOString().split('T')[0]

    // 5. Insert in database
    await db.insert(customers).values({
      id: newCustomerId,
      code: nextCode,
      name: trimmedName,
      type: data.type,
      vatNumber: data.vatNumber?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      mobile: data.mobile?.trim() || null,
      invoiceAddress: data.invoiceAddress.trim(),
      invoiceCity: data.invoiceCity.trim(),
      invoiceZip: data.invoiceZip?.trim() || null,
      isActive: true,
    })

    await db.insert(sites).values({
      id: newSiteId,
      customerId: newCustomerId,
      sheetNumber: nextSheetNumber,
      name: finalSiteName,
      siteAddress: finalSiteAddress,
      siteCity: finalSiteCity,
      siteZip: finalSiteZip,
      primaryDiscipline: data.primaryDiscipline,
      isActive: true,
      installDate: todayIso,
      frequency: '1J',
    })

    return {
      success: true,
      customerId: newCustomerId,
      code: nextCode,
      sheetNumber: nextSheetNumber,
    }
  })
