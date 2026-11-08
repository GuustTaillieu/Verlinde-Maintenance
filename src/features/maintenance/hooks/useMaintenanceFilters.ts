import { useCallback, useState } from 'react'
import { MAINTENANCE_VIEW, type MaintenanceView } from '../types'

export interface MaintenanceFiltersHook {
  view: MaintenanceView
  setView: (view: MaintenanceView) => void
  search: string
  setSearch: (search: string) => void
}

/**
 * Hook for managing maintenance filters.
 * Supports both URL-driven search param synchronization and local fallback.
 */
export function useMaintenanceFilters(
  externalView?: MaintenanceView,
  externalSearch?: string,
  onParamsChange?: (params: { view?: MaintenanceView; search?: string }) => void
): MaintenanceFiltersHook {
  const [internalView, setInternalView] = useState<MaintenanceView>(
    externalView ?? MAINTENANCE_VIEW.active
  )
  const [internalSearch, setInternalSearch] = useState<string>(
    externalSearch ?? ''
  )

  const view = externalView !== undefined ? externalView : internalView
  const search = externalSearch !== undefined ? externalSearch : internalSearch

  const setView = useCallback(
    (nextView: MaintenanceView) => {
      if (onParamsChange) {
        onParamsChange({ view: nextView })
      } else {
        setInternalView(nextView)
      }
    },
    [onParamsChange]
  )

  const setSearch = useCallback(
    (nextSearch: string) => {
      if (onParamsChange) {
        onParamsChange({ search: nextSearch })
      } else {
        setInternalSearch(nextSearch)
      }
    },
    [onParamsChange]
  )

  return {
    view,
    setView,
    search,
    setSearch,
  }
}
