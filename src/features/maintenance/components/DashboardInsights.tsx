import * as React from 'react'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/features/shared/components/ui/card'
import { AlertTriangle, Clock, CalendarCheck, ShieldAlert, type LucideIcon } from 'lucide-react'
import type { MaintenanceKPIs } from '../types'
import { useQuery } from '@tanstack/react-query'
import { maintenanceQueries } from '../query'
import { cn } from 'cn'

type InsightVariant = 'destructive' | 'warning' | 'info' | 'default'

interface InsightCardProps extends React.ComponentProps<'div'> {
  title: string
  value: number | string
  icon: LucideIcon
  subtitle: string
  subtext: string
  variant?: InsightVariant
}

const variantIconStyles: Record<InsightVariant, string> = {
  destructive: 'bg-destructive/10 text-destructive',
  warning: 'bg-amber-500/10 text-amber-500',
  info: 'bg-blue-500/10 text-blue-500',
  default: 'bg-muted text-muted-foreground',
}

export function InsightCard({
  title,
  value,
  icon: Icon,
  subtitle,
  subtext,
  variant = 'default',
  className,
  ...props
}: InsightCardProps) {
  return (
    <Card className={cn('@container/card', className)} {...props}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono">
          {value}
        </CardTitle>
        <CardAction>
          <div
            className={cn(
              'flex size-7 items-center justify-center rounded-md',
              variantIconStyles[variant]
            )}
          >
            <Icon className="size-4" />
          </div>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-xs">
        <div className="line-clamp-1 flex gap-1.5 font-medium">{subtitle}</div>
        <div className="text-muted-foreground">{subtext}</div>
      </CardFooter>
    </Card>
  )
}

interface DashboardInsightsProps extends React.ComponentProps<'div'> {
  kpis?: MaintenanceKPIs
}

export function DashboardInsightsRoot({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DashboardInsights({ kpis: propKpis, className, ...props }: DashboardInsightsProps) {
  const query = useQuery({
    ...maintenanceQueries.kpis(),
    enabled: !propKpis,
  })

  const kpis = propKpis ?? query.data

  if (!kpis) return null

  return (
    <DashboardInsightsRoot className={className} {...props}>
      <InsightCard
        title="Kritiek (Brand)"
        value={kpis.urgentFireCount}
        icon={AlertTriangle}
        variant="destructive"
        subtitle="Jaarlijkse NBN S 21-100 termijn"
        subtext="Wettelijk verplichte keuringen"
      />
      <InsightCard
        title="Dringend (Nazicht)"
        value={kpis.overdueCount}
        icon={ShieldAlert}
        variant="warning"
        subtitle="Achterstallig nazicht"
        subtext="Inbraak, CCTV & toegang nazicht"
      />
      <InsightCard
        title="In Afwachting"
        value={kpis.pendingApprovalCount}
        icon={Clock}
        variant="info"
        subtitle="Voorstel verzonden"
        subtext="Wacht op klant of Brandtec"
      />
      <InsightCard
        title="Preventief (3 mnd)"
        value={kpis.upcomingCount}
        icon={CalendarCheck}
        variant="default"
        subtitle="Binnenkort vervallend"
        subtext="Vervalt binnen 3 maanden"
      />
    </DashboardInsightsRoot>
  )
}

// Compound component attachments
DashboardInsights.Root = DashboardInsightsRoot
DashboardInsights.Card = InsightCard
