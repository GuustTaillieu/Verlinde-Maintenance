import { LoginForm } from '#/features/auth/components/LoginForm'
import { getCurrentUserFn } from '#/features/auth/server/getCurrentUser'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/')({
  component: LoginPage,
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user) {
      if (user.role === 'TECHNICIAN') {
        throw redirect({
          to: '/week-schedule',
        })
      }
      throw redirect({
        to: '/dashboard',
      })
    }
  },
})

function LoginPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  )
}
