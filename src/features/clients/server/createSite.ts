import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { sites } from '#/db/schema'
import { z } from 'zod'
import { managerMiddleware } from '#/features/auth/server/authGuards'

export const createSiteInputSchema = z.object({
  customerId: z.string(),
  name: z.string().min(1, 'Locatienaam is verplicht'),
  siteAddress: z.string().min(1, 'Adres is verplicht'),
  siteZip: z.string().nullable().optional(),
  siteCity: z.string().min(1, 'Gemeente is verplicht'),
  primaryDiscipline: z.enum(['FIRE', 'INTRUSION', 'CCTV', 'ACCESS']),
  accessNotesConfidential: z.string().nullable().optional(),
})

export interface CreateSiteResult {
  success: boolean
  siteId: string
  sheetNumber: string
}

export const createSiteFn = createServerFn({ method: 'POST' })
  .middleware([managerMiddleware])
  .validator(createSiteInputSchema)
  .handler(async ({ data }): Promise<CreateSiteResult> => {
    // Generate next sheet number
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
    const siteId = `site_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    await db.insert(sites).values({
      id: siteId,
      customerId: data.customerId,
      sheetNumber: nextSheetNumber,
      name: data.name.trim(),
      siteAddress: data.siteAddress.trim(),
      siteZip: data.siteZip?.trim() || null,
      siteCity: data.siteCity.trim(),
      primaryDiscipline: data.primaryDiscipline,
      accessNotesConfidential: data.accessNotesConfidential?.trim() || null,
      isActive: true,
      frequency: '1J',
    })

    return {
      success: true,
      siteId,
      sheetNumber: nextSheetNumber,
    }
  })
