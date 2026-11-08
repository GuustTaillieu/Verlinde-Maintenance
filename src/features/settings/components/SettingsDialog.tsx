import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '#/features/shared/components/ui/dialog'
import { createContext, useContext, useState } from 'react'
import {
  Users,
  Sliders,
  Settings,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '#/features/shared/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '#/features/shared/components/ui/breadcrumb'
import { TeamManagementSection } from './TeamManagementSection'
import { PlatformPreferencesSection } from './PlatformPreferencesSection'
import { useTeamMembers } from '../hooks/useTeamMembers'

type SettingsTab = 'team' | 'preferences'

const navItems: Array<{ id: SettingsTab; name: string; icon: typeof Users }> = [
  { id: 'team', name: 'Team & Technici', icon: Users },
  { id: 'preferences', name: 'Bedrijf & Dispatch', icon: Sliders },
]

type SettingsDialogContextType = {
  open: boolean
  setSettingsOpen: (open: boolean) => void
}

const SettingsDialogContext = createContext<SettingsDialogContextType | null>(null)

function useSettingsDialogContext() {
  const context = useContext(SettingsDialogContext)
  if (!context) {
    throw new Error('useSettingsDialogContext must be used within a SettingsRoot')
  }
  return context
}

interface SettingsRootProps {
  children: React.ReactNode
  open?: boolean
}

function SettingsRoot({ children, open: controlledOpen }: SettingsRootProps) {
  const [open, setSettingsOpen] = useState(controlledOpen ?? false)

  return (
    <SettingsDialogContext.Provider value={{ open, setSettingsOpen }}>
      {children}
    </SettingsDialogContext.Provider>
  )
}

function SettingsDialog() {
  const { open, setSettingsOpen } = useSettingsDialogContext()
  const [activeTab, setActiveTab] = useState<SettingsTab>('team')
  const { data: members = [], createMember } = useTeamMembers()

  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0]

  return (
    <Dialog open={open} onOpenChange={setSettingsOpen}>
      <DialogContent className="overflow-hidden p-0 max-h-[85vh] md:max-h-[600px] md:max-w-[780px] lg:max-w-[900px]">
        <DialogTitle className="sr-only">Instellingen</DialogTitle>
        <DialogDescription className="sr-only">
          Beheer teamleden, dispatch parameters en platform voorkeuren.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden sm:flex border-r border-border">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={item.id === activeTab}
                          onClick={() => setActiveTab(item.id)}
                          className="cursor-pointer"
                        >
                          <item.icon className="size-4" />
                          <span className="text-xs">{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[560px] flex-1 flex-col overflow-hidden">
            <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 bg-muted/20">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Settings className="size-3.5" />
                      Instellingen
                    </span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="text-xs">
                    <BreadcrumbPage>{currentNav.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'team' && (
                <TeamManagementSection
                  members={members}
                  onAddMember={async (data) => {
                    await createMember.mutateAsync(data)
                  }}
                />
              )}
              {activeTab === 'preferences' && <PlatformPreferencesSection />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}

import { Slot } from 'radix-ui'

interface SettingsDialogTriggerProps extends React.ComponentProps<'button'> {
  asChild?: boolean
}

function SettingsDialogTrigger({
  asChild = false,
  children,
  onClick,
  ...props
}: SettingsDialogTriggerProps) {
  const { setSettingsOpen } = useSettingsDialogContext()
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        setSettingsOpen(true)
      }}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { SettingsRoot, SettingsDialog, SettingsDialogTrigger }