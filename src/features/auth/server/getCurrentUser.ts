import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '#/features/shared/lib/auth'
import type { AuthUser } from '../types'

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({
    headers: headers as any,
  })
  if (!session?.user) return null
  return session.user as unknown as AuthUser
})

