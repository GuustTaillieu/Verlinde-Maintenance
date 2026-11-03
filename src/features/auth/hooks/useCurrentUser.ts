import { authClient } from '#/features/shared/lib/auth-client'
import type { AuthUser } from '../types'

export function useCurrentUser() {
  const { data: session, isPending, error } = authClient.useSession()
  const user = session?.user as unknown as AuthUser | undefined

  return {
    user,
    session,
    isAuthenticated: Boolean(session?.user),
    isLoading: isPending,
    error,
    isManager: user?.role === 'MANAGER',
    isTechnician: user?.role === 'TECHNICIAN',
    isContractor: Boolean(user?.isContractor),
    signOut: () => authClient.signOut(),
  }
}

