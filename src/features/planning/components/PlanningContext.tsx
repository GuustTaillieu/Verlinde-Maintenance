import { createContext, useContext, type ReactNode } from 'react'
import type {
  PlanningSlot,
  PlanningTechnician,
  TechnicianCapacity,
} from '../types'

export interface PlanningContextValue {
  weekStartDate: string
  weekEndDate: string
  weekNumber: number
  year: number
  activeTechId: string
  onSelectTech: (techId: string) => void
  onSelectWeek: (mondayDateIso: string) => void
  technicians: PlanningTechnician[]
  capacities: TechnicianCapacity[]
  teamCapacity: {
    totalHoursScheduled: number
    weeklyMaxHours: number
    utilizationPercent: number
  }
  slots: PlanningSlot[]
  selectedSlot: PlanningSlot | null
  setSelectedSlot: (slot: PlanningSlot | null) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
}

const PlanningContext = createContext<PlanningContextValue | null>(null)

export function usePlanningContext(): PlanningContextValue {
  const context = useContext(PlanningContext)
  if (!context) {
    throw new Error('usePlanningContext must be used within a PlanningRoot component')
  }
  return context
}

export interface PlanningProviderProps {
  value: PlanningContextValue
  children: ReactNode
}

export function PlanningProvider({ value, children }: PlanningProviderProps) {
  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>
}
