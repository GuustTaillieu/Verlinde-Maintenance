import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/features/shared/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '#/features/shared/components/ui/avatar'
import { Button } from '#/features/shared/components/ui/button'
import { Badge } from '#/features/shared/components/ui/badge'
import { ShieldCheck, LogOut, ChevronsUpDown, UserCheck } from 'lucide-react'
import { useCurrentUser } from '#/features/auth/hooks/useCurrentUser'

export const Route = createFileRoute('/_auth/_technician')({
  component: TechnicianLayoutComponent,
  beforeLoad: ({ context: { user } }) => {
    if (user.role !== 'TECHNICIAN') {
      throw redirect({ to: '/dashboard' })
    }
  },
})

function TechnicianLayoutComponent() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const { signOut } = useCurrentUser()

  const handleSignOut = async () => {
    await signOut()
    await navigate({ to: '/' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Sleek Mobile-First Top Navigation Bar (No clumsy hamburger sidebar needed for single page) */}
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur px-3 sm:px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs">
            <ShieldCheck className="size-4.5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm text-foreground">Verlinde Beveiliging</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground">Veldwerk Agenda</span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-mono">
                {user.techCode || 'TECH'}
              </Badge>
            </div>
          </div>
        </div>

        {/* User Profile & Sign Out dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 gap-2 text-xs font-medium hover:bg-muted"
            >
              <Avatar className="size-6 rounded text-[10px]">
                <AvatarFallback className="rounded bg-primary/10 text-primary font-bold text-[10px]">
                  {user.initials || user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground hidden xs:inline">{user.name}</span>
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 rounded-xl" side="bottom" align="end" sideOffset={6}>
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex items-center gap-2">
                <Avatar className="size-7 rounded">
                  <AvatarFallback className="rounded bg-primary/10 text-primary font-bold text-xs">
                    {user.initials || user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-[10px] text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2">
              <UserCheck className="size-3.5" />
              <span>{user.title || 'Veldtechnicus'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Afmelden</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Schedule Container */}
      <main className="flex-1 p-3 sm:p-6 w-full">
        <Outlet />
      </main>
    </div>
  )
}
