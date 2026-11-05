export interface CockpitKPIs {
  urgentFireCount: number
  overdueCount: number
  pendingApprovalCount: number
  upcomingCount: number
}

export type FireStage = 'NEEDS_PROPOSAL' | 'PENDING_APPROVAL' | 'AWAITING_ATTEST' | 'COMPLETED'

export interface FireTodoItem {
  siteId: string
  sheetNumber: string
  customerId: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  siteName: string
  siteAddress: string
  siteCity: string
  nextDueDate: string
  daysOverdue: number
  stage: FireStage
  workOrderId: string | null
  proposedDate: string | null
  plannedStartTime: string | null
  plannedEndTime: string | null
  certificateDocument: string | null
}

export interface ClusterSiteItem {
  id: string
  siteIds: string[]
  sheetNumber: string
  sheetNumbers: string[]
  name: string
  customerName: string
  address: string
  city: string
  disciplines: string[]
  equipmentCount: number
  durationHours: number
  nextDueDate: string
  daysOverdue: number
}

export interface RegionalCluster {
  city: string
  siteCount: number
  totalSheetsCount: number
  sites: ClusterSiteItem[]
  recommendedTechId: string
  recommendedTechName: string
  estimatedHours: number
}

export interface CockpitData {
  kpis: CockpitKPIs
  fireTodos: FireTodoItem[]
  regionalClusters: RegionalCluster[]
}
