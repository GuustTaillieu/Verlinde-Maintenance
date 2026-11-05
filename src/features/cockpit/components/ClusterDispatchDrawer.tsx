import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
} from '#/features/shared/components/ui/dialog'
import { useDispatchPlanner } from './dispatch/useDispatchPlanner'
import { DispatchHeader } from './dispatch/DispatchHeader'
import { DispatchWeekGrid } from './dispatch/DispatchWeekGrid'
import { DispatchJobsList } from './dispatch/DispatchJobsList'
import { DispatchFooter } from './dispatch/DispatchFooter'
import type { RegionalCluster } from '../types'

interface ClusterDispatchDialogProps {
  cluster: RegionalCluster | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: {
    assignments: Array<{
      siteId?: string
      siteIds?: string[]
      techId: string
      plannedDate: string
      startTime: string
      endTime: string
    }>
    techId: string
  }) => Promise<void>
}

export function ClusterDispatchDialog({
  cluster,
  open,
  onOpenChange,
  onConfirm,
}: ClusterDispatchDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const DialogContentRef = useRef<HTMLDivElement | null>(null)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={DialogContentRef}
        className="max-w-[96vw]! max-h-[96vh]! h-full w-full flex flex-col gap-0"
      >
        <DispatchHeader
          city={cluster.city}
          technicians={planner.technicians}
          selectedTechId={planner.selectedTechId}
          onSelectTechId={planner.setSelectedTechId}
          recommendedTech={planner.recommendedTech}
          otherTechs={planner.otherTechs}
          weekDays={planner.weekDays}
          currentYear={planner.currentMonday.getFullYear()}
          onNavigateWeek={planner.handleNavigateWeek}
          isCalendarPickerOpen={planner.isCalendarPickerOpen}
          onCalendarPickerOpenChange={planner.setIsCalendarPickerOpen}
          pickerMonth={planner.pickerMonth}
          onChangePickerMonth={planner.setPickerMonth}
          calendarDays={planner.calendarDays}
          onSelectCalendarDate={planner.handleSelectCalendarDate}
        />

        <div className="flex flex-1 divide-x divide-border">
          <DispatchWeekGrid
            activeTech={planner.activeTech}
            weekDays={planner.weekDays}
            existingSlots={planner.existingSlots}
            proposedSlots={planner.proposedSlots}
            dayLoads={planner.dayLoads}
            isLoadingSlots={planner.isLoadingSlots}
            isOverCapacity={planner.isOverCapacity}
          />

          <DispatchJobsList
            city={cluster.city}
            sites={cluster.sites}
            selectedSiteIds={planner.selectedSiteIds}
            onToggleSite={planner.handleToggleSite}
            onSelectAll={planner.handleSelectAll}
            totalSelectedHours={planner.totalSelectedHours}
          />
        </div>

        <DispatchFooter
          selectedCount={planner.selectedSiteIds.length}
          techName={planner.activeTech.name}
          weekLabel={planner.weekDays[0]?.dayLabel || ''}
          isSubmitting={isSubmitting}
          isOverCapacity={planner.isOverCapacity}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirmDispatch}
        />
      </DialogContent>
    </Dialog>
  )
}
