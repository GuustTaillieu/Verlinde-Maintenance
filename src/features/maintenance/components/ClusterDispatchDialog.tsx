import * as React from 'react'
import {
  Dialog,
  DialogContent,
} from '#/features/shared/components/ui/dialog'
import { useDispatchPlanner } from '../hooks/useDispatchPlanner'
import { DispatchHeader } from './dispatch/DispatchHeader'
import { DispatchWeekGrid } from './dispatch/DispatchWeekGrid'
import { DispatchJobsList } from './dispatch/DispatchJobsList'
import { DispatchFooter } from './dispatch/DispatchFooter'
import {
  ClusterDispatchContext,
  type ClusterDispatchContextValue,
} from './dispatch/ClusterDispatchContext'
import type { MaintenanceCluster, PlanClusterBatchInput } from '../types'

export { useClusterDispatch } from './dispatch/ClusterDispatchContext'

export interface ClusterDispatchDialogProps {
  cluster: MaintenanceCluster | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: PlanClusterBatchInput) => Promise<void>
  children?: React.ReactNode
}

export function ClusterDispatchBody({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={`flex flex-1 divide-x divide-border ${className || ''}`} {...props}>
      {children || (
        <>
          <DispatchWeekGrid />
          <DispatchJobsList />
        </>
      )}
    </div>
  )
}

export function ClusterDispatchDialog({
  cluster,
  open,
  onOpenChange,
  onConfirm,
  children,
}: ClusterDispatchDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const planner = useDispatchPlanner(cluster, open)

  if (!cluster) return null

  const handleConfirmDispatch = async () => {
    if (planner.proposedSlots.length === 0) return
    setIsSubmitting(true)
    try {
      await onConfirm({
        assignments: planner.proposedSlots.map((slot) => ({
          siteId: slot.siteId,
          siteIds: slot.siteIds,
          techId: planner.selectedTechId,
          plannedDate: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
        techId: planner.selectedTechId,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const contextValue: ClusterDispatchContextValue = {
    cluster,
    planner,
    isSubmitting,
    onConfirmDispatch: handleConfirmDispatch,
    onClose: () => onOpenChange(false),
  }

  return (
    <ClusterDispatchContext.Provider value={contextValue}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[96vw]! max-h-[96vh]! h-full w-full flex flex-col gap-0">
          {children || (
            <>
              <DispatchHeader />
              <ClusterDispatchBody />
              <DispatchFooter />
            </>
          )}
        </DialogContent>
      </Dialog>
    </ClusterDispatchContext.Provider>
  )
}

// Compound component attachments
ClusterDispatchDialog.Header = DispatchHeader
ClusterDispatchDialog.Body = ClusterDispatchBody
ClusterDispatchDialog.WeekGrid = DispatchWeekGrid
ClusterDispatchDialog.JobsList = DispatchJobsList
ClusterDispatchDialog.Footer = DispatchFooter
