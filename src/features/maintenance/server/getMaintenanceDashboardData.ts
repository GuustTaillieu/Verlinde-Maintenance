import { createServerFn } from '@tanstack/react-start'
import type { MaintenanceDashboardData } from '../types'
import { MAINTENANCE_VIEW } from '../types'
import { getMaintenanceKpisFn } from './getMaintenanceKpis'
import { getFireInspectionsFn } from './getFireInspections'
import { getMaintenanceClustersFn } from './getMaintenanceClusters'

export const getMaintenanceDashboardDataFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MaintenanceDashboardData> => {
    const [kpis, paginatedInspections, clusters] = await Promise.all([
      getMaintenanceKpisFn(),
      getFireInspectionsFn({ data: { view: MAINTENANCE_VIEW.active, cursor: 0, limit: 100 } }),
      getMaintenanceClustersFn(),
    ])

    return {
      kpis,
      fireInspections: paginatedInspections.items,
      clusters,
    }
  }
)

