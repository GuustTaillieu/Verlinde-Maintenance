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
import { DispatchEmailReview } from './dispatch/DispatchEmailReview'
import {
  ClusterDispatchContext,
  type ClusterDispatchContextValue,
  type DispatchStep,
  type CustomerEmailDraft,
} from './dispatch/ClusterDispatchContext'
import type { MaintenanceCluster, PlanClusterBatchInput } from '../types'
import { generateCustomerBatchEmail } from '../utils/emailTemplateUtils'

export { useClusterDispatch } from './dispatch/ClusterDispatchContext'

export interface ClusterDispatchDialogProps {
  cluster: MaintenanceCluster | null
  initialSelectedSiteIds?: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: PlanClusterBatchInput) => Promise<void>
  children?: React.ReactNode
}

function formatDateDutch(isoDate: string): string {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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
  cluster,
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
      draft.body = `Beste ${draft.customerName},

In het kader van het periodieke onderhoud aan uw installaties in ${city} stelt Verlinde Beveiliging voor om de volgende werven in te plannen:

${draft.sites
          .map(
            (s) =>
              `• ${s.siteName} (${s.siteAddress}): ${formatDateDutch(s.plannedDate)} van ${s.startTime} tot ${s.endTime} (${s.disciplines.join(', ') || 'Onderhoud'})`
          )
          .join('\n')}

Onze technicus ${techName} zal ter plaatse de nodige controles en het nazicht uitvoeren.

Past dit voorgestelde tijdstip voor u? Gelieve deze e-mail te beantwoorden ter bevestiging van de afspraak.

Met vriendelijke groeten,
Dirk Verlinde
Verlinde Beveiliging BV • Zwevegem`
      draft.body = generateCustomerBatchEmail(
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

  // Set default selected customer ID if empty or invalid
  React.useEffect(() => {
    const keys = Object.keys(emailDrafts)
    if (keys.length > 0 && (!selectedCustomerId || !emailDrafts[selectedCustomerId])) {
      setSelectedCustomerId(keys[0])
    }
  }, [emailDrafts, selectedCustomerId])

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
    selectedCustomerId,
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
