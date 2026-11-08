import { queryOptions } from '@tanstack/react-query'
import { getPlanningDataFn } from './server/getPlanningData'

export const planningKeys = {
  all: ['planning'] as const,
  weeks: () => [...planningKeys.all, 'week'] as const,
  week: (weekStartDate: string, weekEndDate: string, techId: string = 'ALL') =>
    [...planningKeys.weeks(), { weekStartDate, weekEndDate, techId }] as const,
}

export const planningQueries = {
  all: () => planningKeys.all,
  week: (weekStartDate: string, weekEndDate: string, techId: string = 'ALL') =>
    queryOptions({
      queryKey: planningKeys.week(weekStartDate, weekEndDate, techId),
      queryFn: () =>
        getPlanningDataFn({
          data: {
            weekStartDate,
            weekEndDate,
            techId,
          },
        }),
      staleTime: 1000 * 30,
    }),
}
