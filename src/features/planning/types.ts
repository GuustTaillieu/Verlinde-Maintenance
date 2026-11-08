import { z } from 'zod'

export type PlanningDiscipline = 'FIRE' | 'INTRUSION' | 'CCTV' | 'ACCESS' | 'OTHER'

export type WorkOrderStatus =
  | 'UNASSIGNED'
  | 'PROPOSED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type WorkOrderKind = 'MAINTENANCE' | 'INTERVENTION_REPAIR' | 'NEW_INSTALLATION'

export interface PlanningChecklistItem {
  id: string
  workOrderId: string
  equipmentId?: string | null
  articleCode?: string | null
  description: string
  quantity: number
  isChecked: boolean
  techRemarks?: string | null
}

export interface PlanningEquipmentItem {
  id: string
  siteId: string
  articleCode: string
  description: string
  location?: string | null
  serialNumber?: string | null
  quantity: number
  status: string
}

export interface PlanningSlot {
  id: string
  woNumber: string
  customerId: string | null
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  siteId: string | null
  siteName: string
  siteAddress: string
  siteCity: string
  primaryDiscipline: PlanningDiscipline
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  durationHours: number
  status: WorkOrderStatus
  kind: WorkOrderKind
  assignedTechnicianId: string | null
  assignedTechnicianName: string | null
  assignedTechnicianInitials: string | null
  accessNotesConfidential?: string | null
  officeNotes?: string | null
  techNotes?: string | null
  isSigned: boolean
  signedByName?: string | null
  signedAt?: string | null
  completedAt?: string | null
  certificateDocument?: string | null
  items: PlanningChecklistItem[]
  equipment: PlanningEquipmentItem[]
}

export interface PlanningTechnician {
  id: string
  name: string
  role: 'MANAGER' | 'TECHNICIAN'
  techCode: string | null
  initials: string | null
  title: string | null
  specialties: string[]
  weeklySchedule: {
    mon: number
    tue: number
    wed: number
    thu: number
    fri: number
  }
}

export interface TechnicianCapacity {
  techId: string
  techName: string
  techCode: string | null
  techInitials: string | null
  totalHoursScheduled: number
  weeklyMaxHours: number
  utilizationPercent: number
  isOverloaded: boolean
}

export interface PlanningWeekData {
  weekStartDate: string // YYYY-MM-DD (Monday)
  weekEndDate: string // YYYY-MM-DD (Sunday or Friday)
  weekNumber: number
  year: number
  technicians: PlanningTechnician[]
  slots: PlanningSlot[]
  capacities: TechnicianCapacity[]
  teamCapacity: {
    totalHoursScheduled: number
    weeklyMaxHours: number
    utilizationPercent: number
  }
}

export const planningSearchSchema = z.object({
  week: z.string().optional(), // YYYY-MM-DD Monday
  techId: z.string().optional(),
  selectedWoId: z.string().optional(),
  status: z.enum(['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED']).optional().default('ALL'),
})

export type PlanningSearchFilter = z.infer<typeof planningSearchSchema>
