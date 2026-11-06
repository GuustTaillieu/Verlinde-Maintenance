import * as React from 'react'
import type { MaintenanceCluster } from '../../types'
import type { useDispatchPlanner } from '../../hooks/useDispatchPlanner'

export interface ClusterDispatchContextValue {
  cluster: MaintenanceCluster
  planner: ReturnType<typeof useDispatchPlanner>
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
