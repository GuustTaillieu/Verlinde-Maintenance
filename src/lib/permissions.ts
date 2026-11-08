import type { AuthUser } from '#/features/auth/types'

export interface SiteResource {
  id: string
  customerId: string
  primaryDiscipline: string
  accessNotesConfidential?: string | null
}

export interface WorkOrderResource {
  id: string
  siteId?: string | null
  assignedTechnicianId?: string | null
  plannedDate?: string | null
  status: string
}

export type PermissionAction =
  | 'customers:create'
  | 'customers:view'
  | 'customers:update'
  | 'customers:delete'
  | 'sites:create'
  | 'sites:view'
  | 'sites:update'
  | 'sites:delete'
  | 'sites:view_confidential_codes'
  | 'workOrders:create'
  | 'workOrders:view'
  | 'workOrders:assign'
  | 'workOrders:execute'
  | 'workOrders:complete'
  | 'dispatch:batch_schedule'
  | 'users:manage'

export interface PermissionContext {
  site?: SiteResource
  workOrder?: WorkOrderResource
  today?: string // ISO date YYYY-MM-DD
}

/**
 * Universal Attribute-Based Access Control (ABAC) & Role-Based Access Control (RBAC)
 * Used in UI for conditional rendering and in server functions to guard mutations.
 */
export function can(
  user: AuthUser | null | undefined,
  action: PermissionAction,
  context?: PermissionContext
): boolean {
  if (!user) return false

  // 1. Managers have full administrative authority
  if (user.role === 'MANAGER') {
    return true
  }

  // 2. Technicians and Subcontractors
  if (user.role === 'TECHNICIAN') {
    switch (action) {
      case 'customers:view':
      case 'sites:view':
        return true

      // Zero-Trust Confidential Alarm Codes:
      // Revealed ONLY to the assigned technician on a work order scheduled for TODAY.
      // External contractors are blocked by default.
      case 'sites:view_confidential_codes': {
        if (!context?.workOrder || !context?.today) return false
        if (user.isContractor) return false
        const isAssigned = context.workOrder.assignedTechnicianId === user.id
        const isToday = context.workOrder.plannedDate === context.today
        return isAssigned && isToday
      }

      // Technicians can view work orders assigned to them
      case 'workOrders:view': {
        if (!context?.workOrder) return true
        return context.workOrder.assignedTechnicianId === user.id
      }

      // Technicians can execute and complete their active jobs
      case 'workOrders:execute':
      case 'workOrders:complete': {
        if (!context?.workOrder) return false
        return (
          context.workOrder.assignedTechnicianId === user.id &&
          ['SCHEDULED', 'IN_PROGRESS'].includes(context.workOrder.status)
        )
      }

      // Administrative actions blocked for technicians
      case 'customers:create':
      case 'customers:update':
      case 'customers:delete':
      case 'sites:create':
      case 'sites:update':
      case 'sites:delete':
      case 'workOrders:create':
      case 'workOrders:assign':
      case 'dispatch:batch_schedule':
      case 'users:manage':
        return false

      default:
        return false
    }
  }

  return false
}

/**
 * Sanitizes confidential alarm codes in compliance with Zero-Trust GDPR policy.
 * Returns the plain code if permitted, otherwise returns null.
 */
export function sanitizeAlarmCode(
  rawCode: string | null | undefined,
  user: AuthUser | null | undefined,
  context?: PermissionContext
): string | null {
  if (!rawCode) return null
  if (can(user, 'sites:view_confidential_codes', context)) {
    return rawCode
  }
  return null
}

