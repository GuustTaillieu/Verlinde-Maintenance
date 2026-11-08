import { queryOptions } from '@tanstack/react-query'
import { getTechnicianDayScheduleFn } from './server/getTechnicianDaySchedule'

export const technicianKeys = {
  all: ['technician'] as const,
  days: () => [...technicianKeys.all, 'day'] as const,
  day: (date?: string) => [...technicianKeys.days(), date || 'today'] as const,
}

export const technicianQueries = {
  all: () => technicianKeys.all,
  day: (date?: string) =>
    queryOptions({
      queryKey: technicianKeys.day(date),
      queryFn: () =>
        getTechnicianDayScheduleFn({
          data: {
            date,
          },
        }),
      staleTime: 1000 * 30, // 30 seconds
    }),
}
