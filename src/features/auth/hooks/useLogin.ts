import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { authClient } from '#/features/shared/lib/auth-client'
import { getCurrentUserFn } from '../server/getCurrentUser'

export function useLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async () => {
    if (!email || !password) {
      setError('Vul alstublieft zowel uw e-mailadres als uw wachtwoord in.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      })

      if (res.error) {
        setError(res.error.message || 'Ongeldige inloggegevens. Controleer uw e-mail en wachtwoord.')
      } else {
        const currentUser = await getCurrentUserFn()
        if (currentUser?.role === 'TECHNICIAN') {
          await router.navigate({ to: '/week-schedule' })
        } else {
          await router.navigate({ to: '/dashboard' })
        }
      }
    } catch {
      setError('Er is een onverwachte fout opgetreden bij het verbinden met de authenticatieserver.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    login,
  }
}
