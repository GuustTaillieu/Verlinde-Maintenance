import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { customers, sites, equipment, workOrders, user } from '#/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { z } from 'zod'
import {
  type ClientDetail,
  type ClientSiteDetail,
  type ClientEquipmentItem,
  type ClientInspectionHistoryItem,
  type MaintenanceHealthStatus,
} from '../types'
import { managerMiddleware } from '#/features/auth/server/authGuards'

export const getClientDetailInputSchema = z.object({
  customerId: z.string(),
})

export const getClientDetailFn = createServerFn({ method: 'GET' })
  .middleware([managerMiddleware])
  .validator(getClientDetailInputSchema)
  .handler(async ({ data }): Promise<ClientDetail | null> => {
    const todayIso = new Date().toISOString().split('T')[0]
    const todayMs = new Date(todayIso).getTime()

    // 1. Fetch customer
    const customerList = await db
      .select()
      .from(customers)
      .where(eq(customers.id, data.customerId))
      .limit(1)

    if (customerList.length === 0) {
      return null
    }

    const c = customerList[0]

    // 2. Fetch sites for this customer
    const siteRows = await db
      .select()
      .from(sites)
      .where(eq(sites.customerId, c.id))

    const siteIds = siteRows.map((s) => s.id)

    // 3. Fetch equipment for all customer sites
    const equipmentRows =
      siteIds.length > 0
        ? await db
            .select()
            .from(equipment)
            .where(inArray(equipment.siteId, siteIds))
        : []

    // 4. Fetch work orders for customer sites
    const workOrderRows =
      siteIds.length > 0
        ? await db
            .select({
              wo: workOrders,
              techName: user.name,
              techInitials: user.initials,
            })
            .from(workOrders)
            .leftJoin(user, eq(workOrders.assignedTechnicianId, user.id))
            .where(inArray(workOrders.siteId, siteIds))
            .orderBy(desc(workOrders.plannedDate))
        : []

    // Group equipment and work orders by siteId
    const equipmentBySite = new Map<string, ClientEquipmentItem[]>()
    for (const eqItem of equipmentRows) {
      if (!equipmentBySite.has(eqItem.siteId)) {
        equipmentBySite.set(eqItem.siteId, [])
      }

      // Check battery age (> 4 years / 48 months = expired/replace)
      let isBatteryExpired = false
      if (eqItem.articleCode.toUpperCase().startsWith('BAT')) {
        const installMs = new Date(eqItem.installDate).getTime()
        const fourYearsMs = 4 * 365.25 * 24 * 60 * 60 * 1000
        if (todayMs - installMs > fourYearsMs) {
          isBatteryExpired = true
        }
      }

      equipmentBySite.get(eqItem.siteId)!.push({
        id: eqItem.id,
        siteId: eqItem.siteId,
        articleCode: eqItem.articleCode,
        description: eqItem.description,
        location: eqItem.location,
        serialNumber: eqItem.serialNumber,
        quantity: eqItem.quantity,
        installDate: eqItem.installDate,
        maintenanceIntervalMonths: eqItem.maintenanceIntervalMonths,
        lastServiceDate: eqItem.lastServiceDate,
        nextDueDate: eqItem.nextDueDate,
        status: eqItem.status as 'ACTIVE' | 'REPLACED' | 'DECOMMISSIONED',
        isBatteryExpired,
      })
    }

    const workOrdersBySite = new Map<string, ClientInspectionHistoryItem[]>()
    for (const row of workOrderRows) {
      const siteId = row.wo.siteId
      if (!siteId) continue
      if (!workOrdersBySite.has(siteId)) {
        workOrdersBySite.set(siteId, [])
      }

      workOrdersBySite.get(siteId)!.push({
        id: row.wo.id,
        woNumber: row.wo.woNumber,
        plannedDate: row.wo.plannedDate,
        completedAt: row.wo.completedAt,
        technicianName: row.techName,
        technicianInitials: row.techInitials,
        status: row.wo.status,
        kind: row.wo.kind,
        description: row.wo.description,
        isSigned: Boolean(row.wo.isSigned),
        signedByName: row.wo.signedByName,
        certificateDocument: row.wo.certificateDocument,
      })
    }

    // Assemble sites with health status
    const disciplinesSet = new Set<string>()
    let customerHealth: MaintenanceHealthStatus = 'COMPLIANT'

    const clientSites: ClientSiteDetail[] = siteRows.map((s) => {
      if (s.primaryDiscipline) disciplinesSet.add(s.primaryDiscipline)

      let siteHealth: MaintenanceHealthStatus = 'COMPLIANT'
      if (s.nextDueDate) {
        const dueMs = new Date(s.nextDueDate).getTime()
        const diffDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24))
        if (diffDays > 0) {
          siteHealth = 'OVERDUE'
          customerHealth = 'OVERDUE'
        } else if (diffDays >= -60) {
          siteHealth = 'DUE_SOON'
          if (customerHealth !== 'OVERDUE') customerHealth = 'DUE_SOON'
        }
      }

      return {
        id: s.id,
        customerId: s.customerId,
        sheetNumber: s.sheetNumber,
        name: s.name,
        siteAddress: s.siteAddress,
        siteCity: s.siteCity,
        siteZip: s.siteZip,
        primaryDiscipline: s.primaryDiscipline,
        accessNotesConfidential: s.accessNotesConfidential,
        isActive: s.isActive,
        installDate: s.installDate,
        frequency: s.frequency,
        lastServiceDate: s.lastServiceDate,
        nextDueDate: s.nextDueDate,
        healthStatus: siteHealth,
        equipment: equipmentBySite.get(s.id) || [],
        workOrders: workOrdersBySite.get(s.id) || [],
      }
    })

    return {
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type as 'B2B' | 'RESIDENTIAL',
      vatNumber: c.vatNumber,
      email: c.email,
      phone: c.phone,
      mobile: c.mobile,
      invoiceAddress: c.invoiceAddress,
      invoiceCity: c.invoiceCity,
      invoiceZip: c.invoiceZip,
      notes: c.notes,
      totalSites: siteRows.length,
      disciplines: Array.from(disciplinesSet),
      healthStatus: customerHealth,
      sites: clientSites,
    }
  })
