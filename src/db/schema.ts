import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'

/**
 * 1. BETTER AUTH TABLES
 * user, session, account, verification
 */
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),

  // Extended domain fields
  role: text('role', { enum: ['MANAGER', 'TECHNICIAN'] }).notNull().default('TECHNICIAN'),
  isContractor: integer('is_contractor', { mode: 'boolean' }).notNull().default(false),
  techCode: text('tech_code'), // Legacy code: 'DV', 'TDC', 'WVH', 'JMS', 'BRT'
  initials: text('initials'),
  title: text('title'),
  specialties: text('specialties', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),
  weeklySchedule: text('weekly_schedule', { mode: 'json' }).$type<{
    mon: number
    tue: number
    wed: number
    thu: number
    fri: number
  }>(),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

/**
 * 2. CUSTOMERS (DEBTORS / BILLING ENTITIES)
 * Sourced from legacy REL.json
 */
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. 'K00126'
  name: text('name').notNull(),
  type: text('type', { enum: ['B2B', 'RESIDENTIAL'] }).notNull().default('RESIDENTIAL'),
  vatNumber: text('vat_number'),
  email: text('email'),
  phone: text('phone'),
  mobile: text('mobile'),
  invoiceAddress: text('invoice_address'),
  invoiceCity: text('invoice_city').default('Zwevegem'),
  invoiceZip: text('invoice_zip'),
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
})

/**
 * 3. SITES / INSTALLATION SHEETS (PHYSICAL LOCATIONS)
 * Sourced from legacy MS_HDR.json
 */
export const sites = sqliteTable('sites', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  sheetNumber: text('sheet_number').notNull().unique(), // e.g. '1001'
  name: text('name').notNull(),
  siteAddress: text('site_address').notNull(),
  siteCity: text('site_city').notNull(), // Indexed/used for municipality grouping (Kortrijk, Zwevegem, etc.)
  siteZip: text('site_zip'),
  primaryDiscipline: text('primary_discipline', {
    enum: ['FIRE', 'INTRUSION', 'CCTV', 'ACCESS', 'OTHER'],
  }).notNull().default('INTRUSION'),
  accessNotesConfidential: text('access_notes_confidential'), // Alarm codes (protected by zero-trust policies)
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  installDate: text('install_date'), // YYYY-MM-DD
  frequency: text('frequency').default('1J'), // 1 year interval
  lastServiceDate: text('last_service_date'), // Dynamic: latest completed maintenance work order
  nextDueDate: text('next_due_date'), // Dynamic: lastServiceDate + interval
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
})

/**
 * 4. EQUIPMENT & COMPONENTS
 * Sourced from legacy MS_COMP.json
 */
export const equipment = sqliteTable('equipment', {
  id: text('id').primaryKey(),
  siteId: text('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  articleCode: text('article_code').notNull(), // e.g. 'ALC-CEN-32'
  description: text('description').notNull(),
  location: text('location'),
  serialNumber: text('serial_number'),
  quantity: integer('quantity').notNull().default(1),
  installDate: text('install_date').notNull(),
  maintenanceIntervalMonths: integer('maintenance_interval_months').notNull().default(12),
  lastServiceDate: text('last_service_date'),
  nextDueDate: text('next_due_date'),
  status: text('status', { enum: ['ACTIVE', 'REPLACED', 'DECOMMISSIONED'] }).notNull().default('ACTIVE'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
})

/**
 * 5. WORK ORDERS (JOB TICKETS)
 * Sourced from legacy WO_HDR.json
 */
export const workOrders = sqliteTable('work_orders', {
  id: text('id').primaryKey(),
  woNumber: text('wo_number').notNull().unique(), // e.g. 'WB2023-0002'
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  siteId: text('site_id').references(() => sites.id, { onDelete: 'set null' }),
  assignedTechnicianId: text('assigned_technician_id').references(() => user.id, { onDelete: 'set null' }),
  status: text('status', {
    enum: ['UNASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  }).notNull().default('UNASSIGNED'),
  kind: text('kind', {
    enum: ['MAINTENANCE', 'INTERVENTION_REPAIR', 'NEW_INSTALLATION'],
  }).notNull().default('MAINTENANCE'),
  plannedDate: text('planned_date'), // YYYY-MM-DD
  plannedStartTime: text('planned_start_time'), // e.g. '08:30'
  plannedEndTime: text('planned_end_time'), // e.g. '10:30'
  description: text('description'),
  siteAddress: text('site_address'),
  officeNotes: text('office_notes'),
  techNotes: text('tech_notes'),
  isSigned: integer('is_signed', { mode: 'boolean' }).notNull().default(false),
  signedByName: text('signed_by_name'),
  signedAt: text('signed_at'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
})

/**
 * 6. WORK ORDER ITEMS / INSPECTION CHECKLIST
 */
export const workOrderItems = sqliteTable('work_order_items', {
  id: text('id').primaryKey(),
  workOrderId: text('work_order_id').notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
  equipmentId: text('equipment_id').references(() => equipment.id, { onDelete: 'set null' }),
  articleCode: text('article_code'),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(1),
  isChecked: integer('is_checked', { mode: 'boolean' }).notNull().default(false),
  techRemarks: text('tech_remarks'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
})

/**
 * 7. ARTICLES CATALOG
 * Sourced from legacy ART.json
 */
export const articles = sqliteTable('articles', {
  code: text('code').primaryKey(),
  description: text('description').notNull(),
  price: real('price').notNull().default(0),
  unit: text('unit').default('st'),
  category: text('category'),
  supplierCode: text('supplier_code'),
})

/**
 * RELATIONS
 */
export const userRelations = relations(user, ({ many }) => ({
  assignedWorkOrders: many(workOrders),
}))

export const customerRelations = relations(customers, ({ many }) => ({
  sites: many(sites),
  workOrders: many(workOrders),
}))

export const siteRelations = relations(sites, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sites.customerId],
    references: [customers.id],
  }),
  equipment: many(equipment),
  workOrders: many(workOrders),
}))

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  site: one(sites, {
    fields: [equipment.siteId],
    references: [sites.id],
  }),
  checklistItems: many(workOrderItems),
}))

export const workOrderRelations = relations(workOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [workOrders.customerId],
    references: [customers.id],
  }),
  site: one(sites, {
    fields: [workOrders.siteId],
    references: [sites.id],
  }),
  assignedTechnician: one(user, {
    fields: [workOrders.assignedTechnicianId],
    references: [user.id],
  }),
  items: many(workOrderItems),
}))

export const workOrderItemRelations = relations(workOrderItems, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderItems.workOrderId],
    references: [workOrders.id],
  }),
  equipment: one(equipment, {
    fields: [workOrderItems.equipmentId],
    references: [equipment.id],
  }),
}))
