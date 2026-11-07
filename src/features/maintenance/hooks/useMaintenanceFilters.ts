import { useState } from 'react'
import type { MaintenanceView } from '../types'

export function useMaintenanceFilters(initialView: MaintenanceView = 'active') {
  const [view, setView] = useState<MaintenanceView>(initialView)
  const [search, setSearch] = useState<string>('')

  return {
    view,
    setView,
    search,
    setSearch,
  }
}
