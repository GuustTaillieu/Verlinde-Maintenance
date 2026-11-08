import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type * as React from 'react'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30, // 30 seconds
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export function getContext() {
  const queryClient = createQueryClient()
  return {
    queryClient,
  }
}

export default function TanstackQueryProvider({
  children,
  client,
}: {
  children?: React.ReactNode
  client?: QueryClient
}) {
  const queryClient = client ?? createQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
