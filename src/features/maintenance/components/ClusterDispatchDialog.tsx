import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
} from '#/features/shared/components/ui/dialog'
import { useDispatchPlanner } from '../hooks/useDispatchPlanner'
import { maintenanceQueries } from '../query'
import { DispatchHeader } from './dispatch/DispatchHeader'
import { DispatchWeekGrid } from './dispatch/DispatchWeekGrid'
import { DispatchJobsList } from './dispatch/DispatchJobsList'
import { DispatchFooter } from './dispatch/DispatchFooter'
import { DispatchEmailReview } from './dispatch/DispatchEmailReview'
import {
  ClusterDispatchContext,
  type ClusterDispatchContextValue,
  type DispatchStep,
  type CustomerEmailDraft,
} from './dispatch/ClusterDispatchContext'
import type { MaintenanceCluster, PlanClusterBatchInput } from '../types'
import { generateCustomerBatchEmailHtml } from '../utils/emailTemplateUtils'

export { useClusterDispatch } from './dispatch/ClusterDispatchContext'

export interface ClusterDispatchDialogProps {
  cluster?: MaintenanceCluster | null
  city?: string | null
  initialSelectedSiteIds?: string[]
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
    <div
      className={`-m-4 flex flex-1 min-h-0 divide-x divide-border overflow-hidden ${className || ''}`}
      {...props}
    >
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
  cluster: propCluster,
  city,
  initialSelectedSiteIds,
  open,
  onOpenChange,
  onConfirm,
  children,
}: ClusterDispatchDialogProps) {
  const [step, setStep] = React.useState<DispatchStep>('PLANNING')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [userDraftEdits, setUserDraftEdits] = React.useState<
    Record<string, Partial<CustomerEmailDraft>>
  >({})
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('')

  const clustersQuery = useQuery({
    ...maintenanceQueries.clusters(),
    enabled: open && !propCluster && Boolean(city),
  })

  const cluster = React.useMemo(() => {
    if (propCluster) return propCluster
    if (!city) return null
    const list = clustersQuery.data || []
    return (
      list.find((c) => c.city.toLowerCase() === city.toLowerCase()) || null
    )
  }, [propCluster, city, clustersQuery.data])

  const planner = useDispatchPlanner(cluster, open, initialSelectedSiteIds)

  // Reset to PLANNING step whenever dialog opens or cluster changes
  React.useEffect(() => {
    if (open) {
      setStep('PLANNING')
      setUserDraftEdits({})
    }
  }, [open, cluster?.city])

  // Computed base drafts grouped per customer
  const baseEmailDrafts = React.useMemo(() => {
    if (!cluster) return {}
    const siteMap = new Map(cluster.sites.map((s) => [s.id, s]))
    const grouped: Record<string, CustomerEmailDraft> = {}

    for (const slot of planner.proposedSlots) {
      const siteInfo = siteMap.get(slot.siteId)
      const customerId = siteInfo?.customerId || slot.customerName
      const customerName = slot.customerName

      if (!grouped[customerId]) {
        const cleanEmail =
          siteInfo?.customerEmail ||
          `planning@${customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}.be`
        grouped[customerId] = {
          customerId,
          customerName,
          toEmail: cleanEmail,
          subject: `Afspraakvoorstel periodiek onderhoud installaties — ${customerName}`,
          body: '',
          sites: [],
        }
      }

      grouped[customerId].sites.push({
        siteId: slot.siteId,
        siteName: slot.siteName,
        siteAddress: siteInfo?.address || slot.city,
        plannedDate: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationHours: slot.durationHours,
        disciplines: slot.disciplines,
      })
    }

    const techName = planner.activeTech.name
    const city = cluster.city

    for (const draft of Object.values(grouped)) {
      draft.body = generateCustomerBatchEmailHtml(
        draft.customerName,
        city,
        techName,
        draft.sites,
        'concise'
      )
    }

    return grouped
  }, [cluster, planner.proposedSlots, planner.activeTech])

  // Merge base drafts with user edits
  const emailDrafts = React.useMemo(() => {
    const merged: Record<string, CustomerEmailDraft> = {}
    for (const [cId, baseDraft] of Object.entries(baseEmailDrafts)) {
      const edits = userDraftEdits[cId] || {}
      merged[cId] = {
        ...baseDraft,
        ...edits,
        sites: baseDraft.sites,
      }
    }
    return merged
  }, [baseEmailDrafts, userDraftEdits])

  // Derive active selected customer ID without cascading effects
  const activeCustomerId =
    selectedCustomerId && emailDrafts[selectedCustomerId]
      ? selectedCustomerId
      : Object.keys(emailDrafts)[0] || ''

  if (!cluster) return null


  const handleUpdateEmailDraft = (customerId: string, patch: Partial<CustomerEmailDraft>) => {
    setUserDraftEdits((prev) => ({
      ...prev,
      [customerId]: {
        ...(prev[customerId] || {}),
        ...patch,
      },
    }))
  }

  const handleProceedToEmails = () => {
    if (planner.proposedSlots.length === 0 || planner.isOverCapacity) return
    setStep('EMAILS')
  }

  const handleBackToPlanning = () => {
    setStep('PLANNING')
  }

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
    step,
    setStep,
    emailDrafts,
    updateEmailDraft: handleUpdateEmailDraft,
    selectedCustomerId: activeCustomerId,
    setSelectedCustomerId,
    onProceedToEmails: handleProceedToEmails,

    onBackToPlanning: handleBackToPlanning,
    isSubmitting,
    onConfirmDispatch: handleConfirmDispatch,
    onClose: () => onOpenChange(false),
  }

  return (
    <ClusterDispatchContext.Provider value={contextValue}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[96vw]! max-h-[96vh]! h-full w-full flex flex-col overflow-hidden bg-background">
          {children || (
            <>
              <DispatchHeader />
              {step === 'PLANNING' ? <ClusterDispatchBody /> : <DispatchEmailReview />}
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
ClusterDispatchDialog.EmailReview = DispatchEmailReview
ClusterDispatchDialog.Footer = DispatchFooter
