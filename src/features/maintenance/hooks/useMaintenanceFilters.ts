import { useState } from 'react'
import { MAINTENANCE_VIEW, type MaintenanceView } from '../types'

export function useMaintenanceFilters(initialView: MaintenanceView = MAINTENANCE_VIEW.active) {
  const [view, setView] = useState<MaintenanceView>(initialView)
  const [search, setSearch] = useState<string>('')

  return {
    view,
    setView,
    search,
    setSearch,
  }
}
