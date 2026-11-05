import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  AccordionDefaultArrow,
} from '#/features/shared/components/ui/accordion'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import { TodoStepper, type StepItem } from './TodoStepper'
import {
  ShieldAlert,
  CalendarPlus,
  User,
  Clock,
} from 'lucide-react'
import type { RegionalCluster } from '../types'

interface RegionalClusterCardProps {
  cluster: RegionalCluster
  onOpenPlan: (cluster: RegionalCluster) => void
}

export function RegionalClusterCard({
  cluster,
  onOpenPlan,
}: RegionalClusterCardProps) {
  const steps: StepItem[] = [
    {
      id: 'cluster-step-1',
      title: `Technicus en uitvoerdatum vastleggen (${cluster.recommendedTechName})`,
      status: 'active',
      action: (
        <div className="space-y-3">
          <Button
            size="sm"
            onClick={() => onOpenPlan(cluster)}
            className="h-7 text-xs gap-1.5"
          >
            <CalendarPlus className="size-3" />
            Cluster Inplannen ({cluster.siteCount} werven)
          </Button>

          <div className="rounded-lg border border-border p-2 space-y-1 bg-muted/20">
            <div className="text-[11px] font-medium text-muted-foreground px-1">
              Werven in cluster {cluster.city}:
            </div>
            <div className="divide-y divide-border/40">
              {cluster.sites.map((site) => (
                <div
                  key={site.id}
                  className="p-1.5 flex items-center justify-between text-xs"
                >
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
              ))}
            </div>
          </div>
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
    <AccordionItem
      value={`cluster-${cluster.city}`}
      className="border border-border rounded-lg bg-card px-4 py-1 shadow-xs transition-colors"
    >
      <AccordionTrigger className="hover:no-underline py-3 flex justify-between">
        <div className="flex items-center gap-3 text-left">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-foreground">
                Regio {cluster.city}
              </span>
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
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-amber-500 text-[10px] font-mono">
            {cluster.siteCount} werven
          </Badge>
          <AccordionDefaultArrow />
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-4 pt-1">
        <TodoStepper steps={steps} />
      </AccordionContent>
    </AccordionItem>
  )
}
