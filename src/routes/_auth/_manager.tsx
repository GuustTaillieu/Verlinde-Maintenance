import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '#/features/shared/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '#/features/shared/components/ui/avatar'
import {
  ShieldCheck,
  LogOut,
  ChevronsUpDown,
  Bell,
  Layout,
  Building2,
  Settings2,
  Sun,
  Contrast,
  MonitorCog,
  MoonStar,
} from 'lucide-react'
import { useTheme } from '#/features/shared/hooks/use-theme'
import { useCurrentUser } from '#/features/auth/hooks/useCurrentUser'
import { TooltipProvider } from '#/features/shared/components/ui/tooltip'
import { SettingsDialog, SettingsDialogTrigger, SettingsRoot } from '#/features/settings/components/SettingsDialog'

export const Route = createFileRoute('/_auth/_manager')({
  component: RouteComponent,
  beforeLoad: ({ context: { user } }) => {
    if (user.role !== 'MANAGER') {
      throw redirect({ to: '/week-schedule' })
    }
  },
})

function RouteComponent() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const location = useLocation()
  const { mode, setTheme } = useTheme()
  const { signOut } = useCurrentUser()

  const navItems = [
    {
      title: 'Dashboard',
      url: '/dashboard' as const,
      search: { view: 'active' as const },
      icon: Layout,
    },
    {
      title: 'Klanten & Installaties',
      url: '/clients' as const,
      search: {},
      icon: Building2,
    },
  ]

  const handleSignOut = async () => {
    await signOut()
    await navigate({ to: '/' })
  }

  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <Sidebar className="border-r border-border">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" asChild>
                    <Link to="/dashboard">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <ShieldCheck className="size-4" />
                      </div>
                      <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-semibold text-sm">Verlinde Beveiliging</span>
                        <span className="text-xs text-muted-foreground">Zwevegem</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Beheer & Dispatch</SidebarGroupLabel>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.url)
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <Link to={item.url} search={item.search}>
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SettingsRoot>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          size="lg"
                          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                          <Avatar className="size-8 rounded-lg after:border-none">
                            <AvatarFallback className="rounded-lg text-xs font-semibold text-secondary-foreground border-none">
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
                          <SettingsDialogTrigger asChild>
                            <DropdownMenuItem>
                              <Settings2 className="size-3.5" />
                              Instellingen
                            </DropdownMenuItem>
                          </SettingsDialogTrigger>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Contrast className="size-3.5" />
                              Change Theme
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={mode}>
                                  <DropdownMenuRadioItem
                                    value="auto"
                                    onClick={() => setTheme('auto')}>
                                    <MonitorCog className='size-3.5' />
                                    Auto
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem
                                    value="light"
                                    onClick={() => setTheme('light')}>
                                    <Sun className='size-3.5' />
                                    Light
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem
                                    value="dark"
                                    onClick={() => setTheme('dark')}>
                                    <MoonStar className='size-3.5' />
                                    Dark
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuItem>
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

                    <SettingsDialog />
                  </SettingsRoot>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex flex-col flex-1 min-w-0">
            <header className="sticky top-0 z-10 h-12 border-b border-border bg-background/95 backdrop-blur px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <span className="text-xs font-medium text-muted-foreground">
                  {location.pathname.replace(/\//g, '').split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
            </header>

            <main className="@container/main flex-1 p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </TooltipProvider>
    </SidebarProvider >
  )
}
