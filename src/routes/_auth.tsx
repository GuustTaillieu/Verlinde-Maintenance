import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentUserFn } from '#/features/auth/server/getCurrentUser'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (!user) {
      throw redirect({
        to: '/',
      })
    }
    return {
      user,
    }
  },
  component: Outlet,
})
