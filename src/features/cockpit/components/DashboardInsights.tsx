import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/features/shared/components/ui/card'
import { AlertTriangle, Clock, CalendarCheck, ShieldAlert } from 'lucide-react'
import type { CockpitKPIs } from '../types'

interface DashboardInsightsProps {
  kpis: CockpitKPIs
}

export function DashboardInsights({ kpis }: DashboardInsightsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Brand (Wettelijk)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono">
            {kpis.urgentFireCount}
          </CardTitle>
          <CardAction>
            <div className="flex size-7 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs">
          <div className="line-clamp-1 flex gap-1.5 font-medium">
            Jaarlijkse NBN S 21-100 termijn
          </div>
          <div className="text-muted-foreground">
            Wettelijke keuringsplicht verstreken
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Inbraak & Camera</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono">
            {kpis.overdueCount}
          </CardTitle>
          <CardAction>
            <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
              <ShieldAlert className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs">
          <div className="line-clamp-1 flex gap-1.5 font-medium">
            Nazicht vereist
          </div>
          <div className="text-muted-foreground">
            Achterstallig preventief onderhoud
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>In Afwachting</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono">
            {kpis.pendingApprovalCount}
          </CardTitle>
          <CardAction>
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
              <Clock className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs">
          <div className="line-clamp-1 flex gap-1.5 font-medium">
            Voorstel verzonden
          </div>
          <div className="text-muted-foreground">
            Wacht op akkoord klant of Brandtec
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Preventief (60d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono">
            {kpis.upcomingCount}
          </CardTitle>
          <CardAction>
            <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <CalendarCheck className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs">
          <div className="line-clamp-1 flex gap-1.5 font-medium text-foreground">
            Binnenkort vervallend
          </div>
          <div className="text-muted-foreground">
            Vroegtijdige planning mogelijk
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
