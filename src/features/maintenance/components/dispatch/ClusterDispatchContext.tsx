import * as React from 'react'
import type { MaintenanceCluster } from '../../types'
import type { useDispatchPlanner } from '../../hooks/useDispatchPlanner'

export type DispatchStep = 'PLANNING' | 'EMAILS'

export interface CustomerDraftSite {
  siteId: string
  siteName: string
  siteAddress: string
  plannedDate: string
  startTime: string
  endTime: string
  durationHours: number
  disciplines: string[]
}

export interface CustomerEmailDraft {
  customerId: string
  customerName: string
  toEmail: string
  subject: string
  body: string
  sites: CustomerDraftSite[]
}

export interface ClusterDispatchContextValue {
  cluster: MaintenanceCluster
  planner: ReturnType<typeof useDispatchPlanner>
  step: DispatchStep
  setStep: (step: DispatchStep) => void
  emailDrafts: Record<string, CustomerEmailDraft>
  updateEmailDraft: (customerId: string, patch: Partial<CustomerEmailDraft>) => void
  selectedCustomerId: string
  setSelectedCustomerId: (id: string) => void
  onProceedToEmails: () => void
  onBackToPlanning: () => void
  isSubmitting: boolean
  onConfirmDispatch: () => Promise<void>
  onClose: () => void
}

export const ClusterDispatchContext = React.createContext<ClusterDispatchContextValue | null>(null)

export function useClusterDispatch() {
  const context = React.useContext(ClusterDispatchContext)
  if (!context) {
    throw new Error('useClusterDispatch must be used within a ClusterDispatchDialog provider')
  }
  return context
}
