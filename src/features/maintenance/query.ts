import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query'
import { getMaintenanceDashboardDataFn } from './server/getMaintenanceDashboardData'
import { getMaintenanceKpisFn } from './server/getMaintenanceKpis'
import { getFireInspectionsFn } from './server/getFireInspections'
import { getMaintenanceClustersFn } from './server/getMaintenanceClusters'
import { getTechniciansFn, type TechnicianUser } from './server/getTechnicians'
import { getTechnicianScheduleFn, type ScheduledSlot } from './server/getTechnicianSchedule'
import type { GetFireInspectionsInput } from './types'

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  kpis: () => [...maintenanceKeys.all, 'kpis'] as const,
  fireInspections: (filter: string = 'all') =>
    [...maintenanceKeys.all, 'fire-inspections', filter] as const,
  fireInspectionsInfinite: (filter: string = 'all') =>
    [...maintenanceKeys.all, 'fire-inspections-infinite', filter] as const,
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
  fireInspections: (
    filter: GetFireInspectionsInput['filter'] = 'all'
  ) =>
    queryOptions({
      queryKey: maintenanceKeys.fireInspections(filter),
      queryFn: () => getFireInspectionsFn({ data: { filter, cursor: 0, limit: 100 } }),
      staleTime: 1000 * 30,
    }),
  fireInspectionsInfinite: (
    filter: GetFireInspectionsInput['filter'] = 'all',
    limit: number = 25
  ) =>
    infiniteQueryOptions({
      queryKey: maintenanceKeys.fireInspectionsInfinite(filter),
      queryFn: ({ pageParam = 0 }) =>
        getFireInspectionsFn({
          data: { filter, cursor: Number(pageParam), limit },
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 1000 * 30,
    }),
  clusters: () =>
    queryOptions({
      queryKey: maintenanceKeys.clusters(),
      queryFn: () => getMaintenanceClustersFn(),
      staleTime: 1000 * 30,
    }),
  data: () =>
    queryOptions({
      queryKey: maintenanceKeys.data(),
      queryFn: () => getMaintenanceDashboardDataFn(),
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
