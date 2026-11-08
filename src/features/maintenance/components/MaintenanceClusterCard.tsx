import * as React from 'react'
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  AccordionDefaultArrow,
} from '#/features/shared/components/ui/accordion'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import { TodoStepper, type StepItem } from './TodoStepper'
import { ShieldAlert, CalendarPlus, User, Clock } from 'lucide-react'
import type { MaintenanceCluster, ClusterSiteItem } from '../types'
import { cn } from '#/features/shared/lib/utils'

interface MaintenanceClusterCardContextValue {
  cluster: MaintenanceCluster
  onOpenPlan?: (cluster: MaintenanceCluster) => void
}

const MaintenanceClusterCardContext =
  React.createContext<MaintenanceClusterCardContextValue | null>(null)

export function useMaintenanceClusterCard() {
  const context = React.useContext(MaintenanceClusterCardContext)
  if (!context) {
    throw new Error(
      'MaintenanceClusterCard compound subcomponents must be used within MaintenanceClusterCard'
    )
  }
  return context
}

// 1. Icon Component
export function MaintenanceClusterCardIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400',
        className
      )}
    >
      <ShieldAlert className="size-4" />
    </div>
  )
}

// 2. Info / Meta Component
export function MaintenanceClusterCardInfo() {
  const { cluster } = useMaintenanceClusterCard()
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-xs text-foreground">Regio {cluster.city}</span>
        <span className="text-[11px] text-muted-foreground">
          ({cluster.siteCount} werven, {cluster.totalSheetsCount} installaties)
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="size-3 text-muted-foreground" />
          {cluster.recommendedTechName}
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Clock className="size-3 text-muted-foreground" />
          ~{cluster.estimatedHours}u
        </span>
      </div>
    </div>
  )
}

// 3. Badge Component
export function MaintenanceClusterCardBadge() {
  const { cluster } = useMaintenanceClusterCard()
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-amber-500 text-[10px] font-mono">
        {cluster.siteCount} werven
      </Badge>
      <AccordionDefaultArrow />
    </div>
  )
}

// 4. Header Sub-Component
export function MaintenanceClusterCardHeader({ children }: { children?: React.ReactNode }) {
  if (children) {
    return (
      <AccordionTrigger className="hover:no-underline py-3 flex justify-between">
        {children}
      </AccordionTrigger>
    )
  }

  return (
    <AccordionTrigger className="hover:no-underline py-3 flex justify-between">
      <div className="flex items-center gap-3 text-left">
        <MaintenanceClusterCardIcon />
        <MaintenanceClusterCardInfo />
      </div>
      <MaintenanceClusterCardBadge />
    </AccordionTrigger>
  )
}

// 5. Site Item Sub-Component
export function MaintenanceClusterSiteItem({ site }: { site: ClusterSiteItem }) {
  return (
    <div className="p-1.5 flex items-center justify-between text-xs">
      <div className="min-w-0 pr-2">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{site.name}</span>
          {site.sheetNumbers.length > 1 && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0">
              {site.sheetNumbers.length} installaties
            </Badge>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground block truncate">
          {site.customerName} • {site.address}
        </span>
      </div>
      <span className="text-[10px] font-mono text-destructive shrink-0">
        {site.daysOverdue > 0 ? `${site.daysOverdue}d te laat` : 'Binnenkort'}
      </span>
    </div>
  )
}

// 6. Sites List Sub-Component
export function MaintenanceClusterSitesList() {
  const { cluster } = useMaintenanceClusterCard()
  return (
    <div className="rounded-lg border border-border p-2 space-y-1 bg-muted/20">
      <div className="text-[11px] font-medium text-muted-foreground px-1">
        Werven in cluster {cluster.city}:
      </div>
      <div className="divide-y divide-border/40">
        {cluster.sites.map((site) => (
          <MaintenanceClusterSiteItem key={site.id} site={site} />
        ))}
      </div>
    </div>
  )
}

// 7. Content Sub-Component
export function MaintenanceClusterCardContent() {
  const { cluster, onOpenPlan } = useMaintenanceClusterCard()

  const steps: StepItem[] = [
    {
      id: 'cluster-step-1',
      title: `Technicus en uitvoerdatum vastleggen (${cluster.recommendedTechName})`,
      status: 'active',
      action: (
        <div className="space-y-3">
          {onOpenPlan && (
            <Button
              size="sm"
              onClick={() => onOpenPlan(cluster)}
              className="h-7 text-xs gap-1.5"
            >
              <CalendarPlus className="size-3" />
              Cluster Inplannen ({cluster.siteCount} werven)
            </Button>
          )}
          <MaintenanceClusterSitesList />
        </div>
      ),
    },
    {
      id: 'cluster-step-2',
      title: 'Afspraakvoorstellen verzenden naar klanten',
      status: 'upcoming',
    },
    {
      id: 'cluster-step-3',
      title: 'Opname in dagschema van technicus',
      status: 'upcoming',
    },
  ]

  return (
    <AccordionContent className="pb-4 pt-1">
      <TodoStepper steps={steps} />
    </AccordionContent>
  )
}

// 8. Root Component
export interface MaintenanceClusterCardProps {
  cluster: MaintenanceCluster
  onOpenPlan?: (cluster: MaintenanceCluster) => void
  children?: React.ReactNode
  className?: string
}

export function MaintenanceClusterCard({
  cluster,
  onOpenPlan,
  children,
  className,
}: MaintenanceClusterCardProps) {
  return (
    <MaintenanceClusterCardContext.Provider value={{ cluster, onOpenPlan }}>
      <AccordionItem
        value={`cluster-${cluster.city}`}
        className={cn(
          'border border-border rounded-lg bg-card px-4 py-1 shadow-xs transition-colors',
          className
        )}
      >
        {children || (
          <>
            <MaintenanceClusterCardHeader />
            <MaintenanceClusterCardContent />
          </>
        )}
      </AccordionItem>
    </MaintenanceClusterCardContext.Provider>
  )
}

// Compound component attachments
MaintenanceClusterCard.Header = MaintenanceClusterCardHeader
MaintenanceClusterCard.Icon = MaintenanceClusterCardIcon
MaintenanceClusterCard.Info = MaintenanceClusterCardInfo
MaintenanceClusterCard.Badge = MaintenanceClusterCardBadge
MaintenanceClusterCard.Content = MaintenanceClusterCardContent
MaintenanceClusterCard.SitesList = MaintenanceClusterSitesList
MaintenanceClusterCard.SiteItem = MaintenanceClusterSiteItem

