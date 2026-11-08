import { useState, type ReactNode } from 'react'
import { PlanningProvider, type PlanningContextValue } from './PlanningContext'
import { PlanningHeader } from './PlanningHeader'
import { PlanningCapacityGauge } from './PlanningCapacityGauge'
import { PlanningWeekGrid } from './PlanningWeekGrid'
import { JobDetailsDrawer } from './JobDetailsDrawer'
import { formatDateIso } from '#/features/maintenance/utils/dateUtils'
import type { PlanningWeekData, PlanningSlot } from '../types'

export interface PlanningRootProps {
  data: PlanningWeekData
  activeTechId: string
  onSelectTech: (techId: string) => void
  onSelectWeek: (mondayIso: string) => void
  selectedWoId?: string
  children?: ReactNode
}

export function PlanningRoot({
  data,
  activeTechId,
  onSelectTech,
  onSelectWeek,
  selectedWoId,
  children,
}: PlanningRootProps) {
  // Find initial selected slot if URL has selectedWoId
  const initialSlot = selectedWoId
    ? data.slots.find((s) => s.id === selectedWoId) || null
    : null

  const [selectedSlot, setSelectedSlot] = useState<PlanningSlot | null>(initialSlot)

  // Default mobile selected date: today if in current week, else Monday
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = formatDateIso(new Date())
    const isInWeek = today >= data.weekStartDate && today <= data.weekEndDate
    return isInWeek ? today : data.weekStartDate
  })

  const contextValue: PlanningContextValue = {
    weekStartDate: data.weekStartDate,
    weekEndDate: data.weekEndDate,
    weekNumber: data.weekNumber,
    year: data.year,
    activeTechId,
    onSelectTech,
    onSelectWeek,
    technicians: data.technicians,
    capacities: data.capacities,
    teamCapacity: data.teamCapacity,
    slots: data.slots,
    selectedSlot,
    setSelectedSlot,
    selectedDate,
    setSelectedDate,
  }

  return (
    <PlanningProvider value={contextValue}>
      <div className="space-y-5 max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 pb-12 w-full">
        {children || (
          <>
            <PlanningHeader />
            <PlanningCapacityGauge />
            <PlanningWeekGrid />
            <JobDetailsDrawer
              slot={selectedSlot}
              open={Boolean(selectedSlot)}
              onOpenChange={(open) => !open && setSelectedSlot(null)}
            />
          </>
        )}
      </div>
    </PlanningProvider>
  )
}

// Compound subcomponent attachments
PlanningRoot.Header = PlanningHeader
PlanningRoot.Capacity = PlanningCapacityGauge
PlanningRoot.Grid = PlanningWeekGrid
PlanningRoot.Drawer = JobDetailsDrawer
