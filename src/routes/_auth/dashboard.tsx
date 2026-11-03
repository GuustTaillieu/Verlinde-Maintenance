import { createFileRoute } from '@tanstack/react-router'
import { useCurrentUser } from '#/features/auth/hooks/useCurrentUser'
import { can } from '#/lib/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/features/shared/components/ui/card'
import { Badge } from '#/features/shared/components/ui/badge'
import { Shield, Key } from 'lucide-react'

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useCurrentUser()

  if (!user) return null

  // Test permission checks via the ABAC engine
  const canCreateCustomer = can(user, 'customers:create')
  const canBatchSchedule = can(user, 'dispatch:batch_schedule')

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Welkom, {user.name}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {user.role === 'MANAGER'
            ? 'Beheeroverzicht en dispatching voor Verlinde Beveiliging BV.'
            : 'Uw actieve opdrachten en inspecties.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Gebruikersprofiel
            </CardTitle>
            <CardDescription className="text-xs">
              Geauthenticeerd via Better Auth sessie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">E-mail:</span>
              <span className="font-mono">{user.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Rol:</span>
              <Badge variant={user.role === 'MANAGER' ? 'default' : 'secondary'} className="text-[10px]">
                {user.role}
              </Badge>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Type:</span>
              <span>{user.isContractor ? 'Onderaannemer (Brandtec)' : 'Intern personeel'}</span>
            </div>
            {user.techCode && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Initialen / Code:</span>
                <span className="font-mono font-semibold">{user.techCode}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Permissions Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              ABAC Toegangsrechten (can() engine)
            </CardTitle>
            <CardDescription className="text-xs">
              Actieve permissies volgens bedrijfsbeleid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border">
              <span>Nieuwe klanten aanmaken:</span>
              <Badge variant={canCreateCustomer ? 'outline' : 'destructive'} className="text-[10px]">
                {canCreateCustomer ? 'Toegestaan' : 'Geblokkeerd'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border">
              <span>Regionale batch planning:</span>
              <Badge variant={canBatchSchedule ? 'outline' : 'destructive'} className="text-[10px]">
                {canBatchSchedule ? 'Toegestaan' : 'Geblokkeerd'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Alarmcodes bekijken:</span>
              <Badge variant={user.role === 'MANAGER' ? 'outline' : 'secondary'} className="text-[10px]">
                {user.role === 'MANAGER' ? 'Altijd (Beheerder)' : 'Zero-Trust (Enkel op werfdag)'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
