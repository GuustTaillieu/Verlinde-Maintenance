import { z } from 'zod'

/**
 * Stage of a statutory fire compliance inspection (NBN S 21-100).
 * Lifecycle: Needs Proposal -> Pending Customer Approval -> Awaiting Attest -> Completed
 */

export const fireStageSchema = z.enum([
  'NEEDS_PROPOSAL',
  'PENDING_APPROVAL',
  'AWAITING_ATTEST',
  'COMPLETED',
])
export type FireStage = z.infer<typeof fireStageSchema>
export const MAINTENANCE_STAGE = fireStageSchema.enum

/**
 * Technical disciplines supported by Verlinde Beveiliging.
 */
export const disciplineSchema = z.enum(['FIRE', 'INTRUSION', 'CCTV', 'ACCESS'])
export type Discipline = z.infer<typeof disciplineSchema>
export const DISCIPLINE = disciplineSchema.enum

/**
 * Work order operational execution status.
 */
export const workOrderStatusSchema = z.enum([
  'PROPOSED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])
export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>
export const WORK_ORDER_STATUS = workOrderStatusSchema.enum

/**
 * Base site identification and address fields.
 */
export const baseSiteSchema = z.object({
  siteId: z.string(),
  sheetNumber: z.string(),
  siteName: z.string(),
  siteAddress: z.string(),
  siteCity: z.string(),
  nextDueDate: z.string(),
  daysOverdue: z.number().int().nonnegative(),
})
export type BaseSite = z.infer<typeof baseSiteSchema>

/**
 * Base customer contact details.
 */
export const baseCustomerSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
})
export type BaseCustomer = z.infer<typeof baseCustomerSchema>

/**
 * A statutory fire inspection item.
 * Composes BaseSite and BaseCustomer with inspection lifecycle fields.
 */
export const fireInspectionItemSchema = baseSiteSchema.merge(baseCustomerSchema).extend({
  primaryDiscipline: z.string().default('FIRE'),
  stage: fireStageSchema,
  workOrderId: z.string().nullable().optional(),
  proposedDate: z.string().nullable().optional(),
  plannedStartTime: z.string().nullable().optional(),
  plannedEndTime: z.string().nullable().optional(),
  certificateDocument: z.string().nullable().optional(),
  diffDays: z.number().optional(),
})
export type FireInspectionItem = z.infer<typeof fireInspectionItemSchema>

/**
 * Single site belonging to a regional maintenance cluster batch.
 */
export const clusterSiteItemSchema = z.object({
  id: z.string(),
  siteIds: z.array(z.string()),
  sheetNumber: z.string(),
  sheetNumbers: z.array(z.string()),
  name: z.string(),
  customerId: z.string().optional(),
  customerName: z.string(),
  customerEmail: z.string().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  address: z.string(),
  city: z.string(),
  disciplines: z.array(z.string()),
  equipmentCount: z.number().int().nonnegative(),
  durationHours: z.number().positive(),
  nextDueDate: z.string(),
  daysOverdue: z.number().int().nonnegative(),
})
export type ClusterSiteItem = z.infer<typeof clusterSiteItemSchema>

/**
 * Regional maintenance cluster batch grouping sites by municipality for dispatch.
 */
export const maintenanceClusterSchema = z.object({
  city: z.string(),
  siteCount: z.number().int().nonnegative(),
  totalSheetsCount: z.number().int().nonnegative(),
  sites: z.array(clusterSiteItemSchema),
  recommendedTechId: z.string(),
  recommendedTechName: z.string(),
  estimatedHours: z.number().nonnegative(),
})
export type MaintenanceCluster = z.infer<typeof maintenanceClusterSchema>

/**
 * High-level operational metrics for periodic maintenance and statutory inspections.
 */
export const maintenanceKpisSchema = z.object({
  urgentFireCount: z.number().int().nonnegative(),
  overdueCount: z.number().int().nonnegative(),
  pendingApprovalCount: z.number().int().nonnegative(),
  upcomingCount: z.number().int().nonnegative(),
})
export type MaintenanceKPIs = z.infer<typeof maintenanceKpisSchema>

/**
 * Combined dashboard payload for periodic maintenance and inspections overview.
 */
export const maintenanceDashboardDataSchema = z.object({
  kpis: maintenanceKpisSchema,
  fireInspections: z.array(fireInspectionItemSchema),
  clusters: z.array(maintenanceClusterSchema),
})
export type MaintenanceDashboardData = z.infer<typeof maintenanceDashboardDataSchema>

/**
 * Single dispatch assignment slot to a technician.
 */
export const dispatchAssignmentSchema = z.object({
  siteId: z.string().optional(),
  siteIds: z.array(z.string()).optional(),
  techId: z.string(),
  plannedDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
})
export type DispatchAssignment = z.infer<typeof dispatchAssignmentSchema>

/**
 * Mutation inputs with validation schemas.
 */
export const planClusterBatchInputSchema = z.object({
  techId: z.string(),
  siteIds: z.array(z.string()).optional(),
  plannedDate: z.string().optional(),
  assignments: z.array(dispatchAssignmentSchema).optional(),
})
export type PlanClusterBatchInput = z.infer<typeof planClusterBatchInputSchema>

export const proposeFireAppointmentInputSchema = z.object({
  siteId: z.string(),
  customerId: z.string(),
  technicianId: z.string().optional(),
  proposedDate: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  toEmail: z.string().optional(),
  ccEmail: z.string().optional(),
  subject: z.string().optional(),
  emailBody: z.string().optional(),
})

export type ProposeFireAppointmentInput = z.infer<typeof proposeFireAppointmentInputSchema>

export const confirmFireAppointmentInputSchema = z.object({
  workOrderId: z.string(),
})
export type ConfirmFireAppointmentInput = z.infer<typeof confirmFireAppointmentInputSchema>

export const uploadFireAttestInputSchema = z.object({
  workOrderId: z.string(),
  siteId: z.string(),
  certificateDocument: z.string(),
  officeNotes: z.string().optional(),
})
export type UploadFireAttestInput = z.infer<typeof uploadFireAttestInputSchema>

/**
 * Top-level dashboard view:
 * - 'active': Actieve Taken (Action queue requiring Dirk's initiative)
 * - 'inbox': In Afwachting (Waiting room for client confirmations / inspection attests)
 */

export const maintenanceViewSchema = z.enum(['active', 'inbox'])
export type MaintenanceView = z.infer<typeof maintenanceViewSchema>
export const MAINTENANCE_VIEW = maintenanceViewSchema.enum

/**
 * Paginated query input schema for fetching maintenance inspections/todos.
 */
export const getFireInspectionsInputSchema = z
  .object({
    view: maintenanceViewSchema.default('active'),
    search: z.string().optional(),
    cursor: z.number().int().nonnegative().default(0),
    limit: z.number().int().positive().default(50),
  })
  .default({ view: 'active', cursor: 0, limit: 50 })
export type GetFireInspectionsInput = z.infer<typeof getFireInspectionsInputSchema>

/**
 * Paginated inspections output schema.
 */
export const paginatedInspectionsResultSchema = z.object({
  items: z.array(fireInspectionItemSchema),
  nextCursor: z.number().nullable(),
  total: z.number().int().nonnegative(),
})
export type PaginatedInspectionsResult = z.infer<typeof paginatedInspectionsResultSchema>
