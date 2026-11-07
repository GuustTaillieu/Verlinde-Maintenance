import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query'
import { getMaintenanceKpisFn } from './server/getMaintenanceKpis'
import { getFireInspectionsFn } from './server/getFireInspections'
import { getMaintenanceClustersFn } from './server/getMaintenanceClusters'
import { getTechniciansFn, type TechnicianUser } from './server/getTechnicians'
import { getTechnicianScheduleFn, type ScheduledSlot } from './server/getTechnicianSchedule'
import type { MaintenanceView } from './types'
import { MAINTENANCE_VIEW } from './types'

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  kpis: () => [...maintenanceKeys.all, 'kpis'] as const,
  fireInspections: (view: MaintenanceView = MAINTENANCE_VIEW.active) =>
    [...maintenanceKeys.all, 'fire-inspections', view] as const,
  fireInspectionsInfinite: (view: MaintenanceView = MAINTENANCE_VIEW.active, search: string = '') =>
    [...maintenanceKeys.all, 'inspections-infinite', view, search] as const,
  clusters: () => [...maintenanceKeys.all, 'clusters'] as const,
  data: () => [...maintenanceKeys.all, 'data'] as const,
  technicians: () => ['technicians', 'list'] as const,
  technicianSchedule: (techId: string, weekStartDate: string, weekEndDate: string) =>
    ['technicians', 'schedule', techId, weekStartDate, weekEndDate] as const,
}

export const maintenanceQueries = {
  kpis: () =>
    queryOptions({
      queryKey: maintenanceKeys.kpis(),
      queryFn: () => getMaintenanceKpisFn(),
      staleTime: 1000 * 30,
    }),
  clusters: () =>
    queryOptions({
      queryKey: maintenanceKeys.clusters(),
      queryFn: () => getMaintenanceClustersFn(),
      staleTime: 1000 * 30,
    }),
  fireInspectionsInfinite: (
    view: MaintenanceView = MAINTENANCE_VIEW.active,
    search: string = '',
    limit: number = 50
  ) =>
    infiniteQueryOptions({
      queryKey: maintenanceKeys.fireInspectionsInfinite(view, search),
      queryFn: ({ pageParam = 0 }) =>
        getFireInspectionsFn({
          data: { view, search, cursor: Number(pageParam), limit },
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 1000 * 30,
    }),
  technicians: () =>
    queryOptions({
      queryKey: maintenanceKeys.technicians(),
      queryFn: async (): Promise<TechnicianUser[]> => {
        const res = await getTechniciansFn()
        return (res as unknown as TechnicianUser[]) || []
      },
      staleTime: 1000 * 60 * 5,
    }),
  technicianSchedule: (
    techId: string,
    weekStartDate: string,
    weekEndDate: string,
    options?: { enabled?: boolean }
  ) =>
    queryOptions({
      queryKey: maintenanceKeys.technicianSchedule(techId, weekStartDate, weekEndDate),
      queryFn: async (): Promise<ScheduledSlot[]> => {
        const res = await getTechnicianScheduleFn({
          data: { techId, weekStartDate, weekEndDate },
        })
        return (res as unknown as ScheduledSlot[]) || []
      },
      staleTime: 1000 * 30,
      enabled: options?.enabled ?? true,
    }),
}
