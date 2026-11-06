import { useState } from 'react'
import type { MaintenanceFilterKey } from '../types'

export function useMaintenanceFilters(initialFilter: MaintenanceFilterKey = 'all') {
  const [activeFilter, setActiveFilter] = useState<MaintenanceFilterKey>(initialFilter)

  return {
    activeFilter,
    setActiveFilter,
  }
}
