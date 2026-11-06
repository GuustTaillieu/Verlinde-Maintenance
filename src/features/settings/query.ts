import { queryOptions } from '@tanstack/react-query'
import { getTeamMembersFn } from './server/settingsMutations'

export const teamMemberKeys = {
  all: ['settings', 'team-members'] as const,
  list: () => [...teamMemberKeys.all, 'list'] as const,
}

export const teamMemberQueries = {
  list: () =>
    queryOptions({
      queryKey: teamMemberKeys.list(),
      queryFn: () => getTeamMembersFn(),
      staleTime: 1000 * 60,
    }),
}

