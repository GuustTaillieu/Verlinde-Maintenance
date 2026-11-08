import { usePlanningContext } from './PlanningContext'
import { Badge } from '#/features/shared/components/ui/badge'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { cn } from '#/features/shared/lib/utils'

export function PlanningCapacityGauge() {
  const {
    activeTechId,
    technicians,
    capacities,
    teamCapacity,
  } = usePlanningContext()

  const selectedTech = technicians.find((t) => t.id === activeTechId) || technicians[0]
  const selectedCapacity = capacities.find((c) => c.techId === selectedTech?.id)

  const techScheduled = selectedCapacity?.totalHoursScheduled ?? 0
  const techMax = selectedCapacity?.weeklyMaxHours ?? 38
  const techUtilization = selectedCapacity?.utilizationPercent ?? 0
  const isOverloaded = selectedCapacity?.isOverloaded ?? false
  const remainingHours = Math.max(0, Math.round((techMax - techScheduled) * 10) / 10)

  const getStatusVariant = () => {
    if (isOverloaded) return 'destructive'
    if (techUtilization >= 85) return 'secondary'
    return 'outline'
  }

  const getProgressColor = () => {
    if (isOverloaded) return 'bg-destructive'
    if (techUtilization >= 85) return 'bg-amber-500'
    return 'bg-primary'
  }

  const teamRemainingHours = Math.max(
    0,
    Math.round((teamCapacity.weeklyMaxHours - teamCapacity.totalHoursScheduled) * 10) / 10
  )

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-4">
      {/* Top Section: Active Technician Capacity */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  Capaciteit & Rooster — {selectedTech?.name}
                </span>
                {selectedTech?.techCode && (
                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                    {selectedTech.techCode}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedTech?.title || 'Veldtechnicus'} • Weekrooster: {techMax}u / week
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant={getStatusVariant()}
              className={cn(
                'text-xs font-semibold px-2.5 py-0.5',
                !isOverloaded && techUtilization >= 85 && 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                !isOverloaded && techUtilization < 85 && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              )}
            >
              {isOverloaded ? (
                <>
                  <AlertTriangle className="size-3 mr-1 shrink-0" />
                  Overbelast ({techUtilization}%)
                </>
              ) : techUtilization >= 85 ? (
                <>
                  <AlertTriangle className="size-3 mr-1 shrink-0" />
                  Volgeboekt ({techUtilization}%)
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3 mr-1 shrink-0" />
                  Beschikbaar ({techUtilization}%)
                </>
              )}
            </Badge>

            <span className="text-xs font-semibold text-foreground">
              {techScheduled}u <span className="font-normal text-muted-foreground">/ {techMax}u</span>
            </span>
          </div>
        </div>

        {/* Technician Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-300 rounded-full', getProgressColor())}
              style={{ width: `${Math.min(100, techUtilization)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {remainingHours > 0
                ? `${remainingHours}u beschikbaar voor nieuwe interventies deze week`
                : 'Geen vrije capaciteit meer resterend in het weekrooster'}
            </span>
            <span className="font-mono font-medium">{techUtilization}% benutting</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Total Team Capacity Progress (Always Visible) */}
      <div className="pt-3 border-t border-border/60 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
            <Users className="size-3.5 text-primary" />
            <span>Totale Teamcapaciteit ({technicians.length} technici):</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-[11px]">
              {teamCapacity.totalHoursScheduled}u{' '}
              <span className="font-normal text-muted-foreground">/ {teamCapacity.weeklyMaxHours}u</span>
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-mono px-1.5 py-0',
                teamCapacity.utilizationPercent >= 85
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              )}
            >
              {teamCapacity.utilizationPercent}%
            </Badge>
          </div>
        </div>

        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/70 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, teamCapacity.utilizationPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{teamRemainingHours}u totale vrije teamcapaciteit over alle technici</span>
          <span>{teamCapacity.utilizationPercent}% bezetting</span>
        </div>
      </div>
    </div>
  )
}
