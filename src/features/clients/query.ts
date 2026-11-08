import { queryOptions } from '@tanstack/react-query'
import { getClientsFn } from './server/getClients'
import { getClientDetailFn } from './server/getClientDetail'
import { checkCustomerNameFn } from './server/checkCustomerName'
import type { GetClientsFilter } from './types'

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filter?: Partial<GetClientsFilter>) =>
    [
      ...clientKeys.lists(),
      {
        search: filter?.search || '',
        type: filter?.type || 'ALL',
        status: filter?.status || 'ALL',
        city: filter?.city || 'ALL',
      },
    ] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (customerId: string) => [...clientKeys.details(), customerId] as const,
  checkName: (name: string) => [...clientKeys.all, 'check-name', name.trim().toLowerCase()] as const,
}

export const clientQueries = {
  all: () => clientKeys.all,
  list: (filter?: Partial<GetClientsFilter>) =>
    queryOptions({
      queryKey: clientKeys.list(filter),
      queryFn: () =>
        getClientsFn({
          data: {
            search: filter?.search || '',
            type: filter?.type || 'ALL',
            status: filter?.status || 'ALL',
            city: filter?.city || 'ALL',
          },
        }),
      staleTime: 1000 * 30, // 30 seconds
    }),
  detail: (customerId: string) =>
    queryOptions({
      queryKey: clientKeys.detail(customerId),
      queryFn: () => getClientDetailFn({ data: { customerId } }),
      enabled: Boolean(customerId),
      staleTime: 1000 * 60, // 1 minute
    }),
  checkName: (name: string) =>
    queryOptions({
      queryKey: clientKeys.checkName(name),
      queryFn: () => checkCustomerNameFn({ data: { name } }),
      enabled: name.trim().length >= 2,
      staleTime: 1000 * 10,
    }),
}
