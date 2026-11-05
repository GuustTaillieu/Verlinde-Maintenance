import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from '@tanstack/react-router'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/features/shared/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '#/features/shared/components/ui/avatar'
import {
  CalendarCheck,
  ShieldCheck,
  LogOut,
  ChevronsUpDown,
  User,
  Bell,
} from 'lucide-react'
import { useCurrentUser } from '#/features/auth/hooks/useCurrentUser'

export const Route = createFileRoute('/_auth/_technician')({
  component: RouteComponent,
  beforeLoad: ({ context: { user } }) => {
    if (user.role !== 'TECHNICIAN') {
      throw redirect({ to: '/dashboard' })
    }
  },
})

function RouteComponent() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useCurrentUser()

  const navItems = [
    {
      title: 'Mijn Dagschema',
      url: '/week-schedule',
      icon: CalendarCheck,
    },
  ]

  const handleSignOut = async () => {
    await signOut()
    await navigate({ to: '/' })
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar className="border-r border-border">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link to="/week-schedule">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold text-sm">Verlinde Beveiliging</span>
                      <span className="text-xs text-muted-foreground">Veldwerk</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Veldwerk</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.url
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={item.url}>
                            <item.icon className="size-4" />
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

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground">
                          {user.initials || user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-xs leading-tight">
                        <span className="truncate font-semibold">{user.name}</span>
                        <span className="truncate text-[10px] text-muted-foreground">{user.email}</span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="size-8 rounded-lg">
                          <AvatarFallback className="rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground">
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
                    <DropdownMenuGroup>
                      <DropdownMenuItem className="text-xs gap-2">
                        <User className="size-3.5" />
                        Profiel
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2">
                        <Bell className="size-3.5" />
                        Meldingen
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-xs gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="size-3.5" />
                      Afmelden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-10 h-12 border-b border-border bg-background/95 backdrop-blur px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-xs font-medium text-muted-foreground">
                Veldwerk Agenda
              </span>
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
