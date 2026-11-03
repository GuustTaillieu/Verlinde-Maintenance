import { createFileRoute, Outlet, useNavigate, Link, useLocation } from '@tanstack/react-router'
import { useCurrentUser } from '#/features/auth/hooks/useCurrentUser'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '#/features/shared/components/ui/sidebar'
import {
  LayoutDashboard,
  Building2,
  Calendar,
  CalendarCheck,
  ShieldCheck,
  LogOut,
  Loader2,
} from 'lucide-react'
import ThemeToggle from '#/features/shared/components/ThemeToggle'
import { useEffect } from 'react'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isLoading, isManager, signOut } = useCurrentUser()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: '/' })
    }
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const managerNav = [
    {
      title: 'Cockpit & Triage',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Klanten & Werven',
      url: '/customers',
      icon: Building2,
    },
    {
      title: 'Planning & Agenda',
      url: '/schedule',
      icon: Calendar,
    },
  ]

  const techNav = [
    {
      title: 'Mijn Dagschema',
      url: '/dashboard',
      icon: CalendarCheck,
    },
  ]

  const navItems = isManager ? managerNav : techNav

  const handleSignOut = async () => {
    await signOut()
    await navigate({ to: '/' })
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar className="border-r border-border">
          {/* Header Brand */}
          <SidebarHeader className="border-b border-border p-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-tight leading-tight">
                  Verlinde Beveiliging
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Zwevegem • Onderhoud
                </span>
              </div>
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-2 mb-1">
                {isManager ? 'Beheer & Dispatch' : 'Veldwerk'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.url
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="w-full text-xs font-medium"
                        >
                          <Link to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer Profile & Logout */}
          <SidebarFooter className="border-t border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs shrink-0 border border-border">
                  {user.initials || user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user.role === 'MANAGER'
                      ? 'Directie'
                      : user.isContractor
                      ? 'Onderaannemer'
                      : 'Technicus'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                title="Afmelden"
                className="h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center text-muted-foreground transition-colors shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-10 h-12 border-b border-border bg-background/95 backdrop-blur px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-xs font-semibold text-muted-foreground">
                {isManager ? 'Onderhoudscockpit' : 'Veldwerk Agenda'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
