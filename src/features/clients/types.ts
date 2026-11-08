import { z } from 'zod'

export const customerTypeSchema = z.enum(['B2B', 'RESIDENTIAL'])
export type CustomerType = z.infer<typeof customerTypeSchema>

export const maintenanceHealthStatusSchema = z.enum([
  'COMPLIANT', // Green: All sites inspected within valid interval
  'DUE_SOON',  // Amber: Next inspection due within 30-60 days
  'OVERDUE',   // Red: Maintenance overdue or fire compliance expired
])
export type MaintenanceHealthStatus = z.infer<typeof maintenanceHealthStatusSchema>
export const MAINTENANCE_HEALTH_STATUS = maintenanceHealthStatusSchema.enum

export const clientListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: customerTypeSchema,
  vatNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  invoiceAddress: z.string().nullable().optional(),
  invoiceCity: z.string().nullable().optional(),
  invoiceZip: z.string().nullable().optional(),
  totalSites: z.number().int().nonnegative(),
  disciplines: z.array(z.string()),
  healthStatus: maintenanceHealthStatusSchema,
  earliestDueDate: z.string().nullable().optional(),
})
export type ClientListItem = z.infer<typeof clientListItemSchema>

export const clientEquipmentItemSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  articleCode: z.string(),
  description: z.string(),
  location: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  quantity: z.number(),
  installDate: z.string(),
  maintenanceIntervalMonths: z.number(),
  lastServiceDate: z.string().nullable().optional(),
  nextDueDate: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'REPLACED', 'DECOMMISSIONED']),
  isBatteryExpired: z.boolean().default(false), // True if battery installed > 4 years ago
})
export type ClientEquipmentItem = z.infer<typeof clientEquipmentItemSchema>

export const clientInspectionHistoryItemSchema = z.object({
  id: z.string(),
  woNumber: z.string(),
  plannedDate: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  technicianName: z.string().nullable().optional(),
  technicianInitials: z.string().nullable().optional(),
  status: z.string(),
  kind: z.string(),
  description: z.string().nullable().optional(),
  isSigned: z.boolean(),
  signedByName: z.string().nullable().optional(),
  certificateDocument: z.string().nullable().optional(),
})
export type ClientInspectionHistoryItem = z.infer<typeof clientInspectionHistoryItemSchema>

export const clientSiteDetailSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  sheetNumber: z.string(),
  name: z.string(),
  siteAddress: z.string(),
  siteCity: z.string(),
  siteZip: z.string().nullable().optional(),
  primaryDiscipline: z.string(),
  accessNotesConfidential: z.string().nullable().optional(),
  isActive: z.boolean(),
  installDate: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  lastServiceDate: z.string().nullable().optional(),
  nextDueDate: z.string().nullable().optional(),
  healthStatus: maintenanceHealthStatusSchema,
  equipment: z.array(clientEquipmentItemSchema),
  workOrders: z.array(clientInspectionHistoryItemSchema),
})
export type ClientSiteDetail = z.infer<typeof clientSiteDetailSchema>

export const clientDetailSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: customerTypeSchema,
  vatNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  invoiceAddress: z.string().nullable().optional(),
  invoiceCity: z.string().nullable().optional(),
  invoiceZip: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  totalSites: z.number().int().nonnegative(),
  disciplines: z.array(z.string()),
  healthStatus: maintenanceHealthStatusSchema,
  sites: z.array(clientSiteDetailSchema),
})
export type ClientDetail = z.infer<typeof clientDetailSchema>

export interface ClientLocationGroup {
  id: string
  name: string
  address: string
  city: string
  zip?: string | null
  healthStatus: MaintenanceHealthStatus
  fiches: ClientSiteDetail[]
}

/**
 * Groups raw fiches (sites) by physical premises / location.
 * Allows displaying real-world physical locations (e.g. "Woning Ann", "Hoofdzetel Zwevegem")
 * with their underlying installed disciplines (e.g. Camerabewaking, Toegangscontrole).
 */
export function groupSitesByLocation(sites: ClientSiteDetail[]): ClientLocationGroup[] {
  const groupsMap = new Map<string, ClientLocationGroup>()

  for (const s of sites) {
    // Clean discipline prefixes to find the physical building description
    const stripped = s.name
      .replace(/^(Branddetectie|Inbraakalarm|Inbraakbeveiliging|Camerabewaking|Toegangscontrole)\s*(pand|woning|Fam\.|)/i, '')
      .trim()

    // Determine normalized address or location key
    const hasRealAddress = s.siteAddress && s.siteAddress.trim() !== '' && s.siteAddress.toLowerCase() !== 'adres onbekend'
    const locationKey = hasRealAddress
      ? `${s.siteAddress.trim().toLowerCase()}__${(s.siteCity || '').trim().toLowerCase()}`
      : `${(stripped || s.name).trim().toLowerCase()}__${(s.siteCity || '').trim().toLowerCase()}`

    // Clean location display title
    let displayTitle = stripped
    if (!displayTitle || displayTitle.length < 2) {
      displayTitle = hasRealAddress ? s.siteAddress.split(',')[0].trim() : s.name
    }
    // Capitalize first letter
    displayTitle = displayTitle.charAt(0).toUpperCase() + displayTitle.slice(1)

    if (!groupsMap.has(locationKey)) {
      groupsMap.set(locationKey, {
        id: locationKey,
        name: displayTitle,
        address: s.siteAddress,
        city: s.siteCity,
        zip: s.siteZip,
        healthStatus: s.healthStatus,
        fiches: [s],
      })
    } else {
      const group = groupsMap.get(locationKey)!
      group.fiches.push(s)
      // Escalate health status if needed
      if (s.healthStatus === 'OVERDUE') {
        group.healthStatus = 'OVERDUE'
      } else if (s.healthStatus === 'DUE_SOON' && group.healthStatus !== 'OVERDUE') {
        group.healthStatus = 'DUE_SOON'
      }
    }
  }

  return Array.from(groupsMap.values())
}

export const createCustomerInputSchema = z.object({
  name: z.string().min(2, 'Klantnaam moet minimaal 2 tekens bevatten'),
  type: customerTypeSchema,
  vatNumber: z.string().optional().nullable(),
  email: z.string().email('Ongeldig e-mailadres').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  invoiceAddress: z.string().min(3, 'Facturatieadres is verplicht'),
  invoiceZip: z.string().optional().nullable(),
  invoiceCity: z.string().min(2, 'Gemeente is verplicht'),
  siteName: z.string().optional().nullable(),
  siteAddress: z.string().optional().nullable(),
  siteZip: z.string().optional().nullable(),
  siteCity: z.string().optional().nullable(),
  primaryDiscipline: z.enum(['FIRE', 'INTRUSION', 'CCTV', 'ACCESS']).default('INTRUSION'),
  allowDuplicate: z.boolean().default(false),
})
export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>

export const getClientsFilterSchema = z.object({
  search: z.string().optional().default(''),
  type: z.enum(['ALL', 'B2B', 'RESIDENTIAL']).optional().default('ALL'),
  status: z.enum(['ALL', 'COMPLIANT', 'DUE_SOON', 'OVERDUE']).optional().default('ALL'),
  city: z.string().optional().default('ALL'),
})
export type GetClientsFilter = z.infer<typeof getClientsFilterSchema>
