import { createMiddleware } from '@tanstack/react-start'
import { getCurrentUserFn } from './getCurrentUser'
import type { AuthUser } from '../types'

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

export async function requireAuthUser(
  allowedRoles?: Array<'MANAGER' | 'TECHNICIAN'>
): Promise<AuthUser> {
  const user = await getCurrentUserFn()
  if (!user) {
    throw new AuthError('Niet geauthenticeerd. Gelieve in te loggen.', 401)
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new AuthError('Toegang geweigerd. Onvoldoende rechten voor deze actie.', 403)
  }
  return user
}

/**
 * TanStack Start server function middleware for authenticated users.
 * Injects strongly-typed context.user into server functions.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const user = await requireAuthUser()
  return next({
    context: {
      user,
    },
  })
})

/**
 * TanStack Start server function middleware restricted to Managers (e.g. Dirk).
 */
export const managerMiddleware = createMiddleware().server(async ({ next }) => {
  const user = await requireAuthUser(['MANAGER'])
  return next({
    context: {
      user,
    },
  })
})

