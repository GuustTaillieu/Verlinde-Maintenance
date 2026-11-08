import { z } from 'zod'

export type TechnicianDiscipline = 'FIRE' | 'INTRUSION' | 'CCTV' | 'ACCESS' | 'OTHER'

export type TechnicianWorkOrderStatus =
  | 'UNASSIGNED'
  | 'PROPOSED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export interface TechnicianChecklistItem {
  id: string
  workOrderId: string
  equipmentId?: string | null
  articleCode?: string | null
  description: string
  quantity: number
  isChecked: boolean
  techRemarks?: string | null
}

export interface TechnicianEquipmentItem {
  id: string
  siteId: string
  articleCode: string
  description: string
  location?: string | null
  serialNumber?: string | null
  quantity: number
  status: string
}

export interface TechnicianWorkOrder {
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
  primaryDiscipline: TechnicianDiscipline
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  durationHours: number
  status: TechnicianWorkOrderStatus
  kind: string
  accessNotesConfidential?: string | null
  officeNotes?: string | null
  techNotes?: string | null
  isSigned: boolean
  signedByName?: string | null
  signedAt?: string | null
  completedAt?: string | null
  certificateDocument?: string | null
  items: TechnicianChecklistItem[]
  equipment: TechnicianEquipmentItem[]
}

export interface TechnicianProfile {
  id: string
  name: string
  email: string
  techCode: string | null
  initials: string | null
  title: string | null
  weeklySchedule: {
    mon: number
    tue: number
    wed: number
    thu: number
    fri: number
  }
}

export interface TechnicianDayData {
  date: string // YYYY-MM-DD
  technician: TechnicianProfile
  scheduledDailyHours: number
  isDayOff: boolean
  isHalfDay: boolean
  slots: TechnicianWorkOrder[]
}

export const technicianScheduleSearchSchema = z.object({
  date: z.string().optional(), // YYYY-MM-DD
  selectedWoId: z.string().optional(),
})

export type TechnicianScheduleSearch = z.infer<typeof technicianScheduleSearchSchema>
