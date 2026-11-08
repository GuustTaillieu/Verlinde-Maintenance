import { Clock, CalendarOff } from 'lucide-react'
import { Badge } from '#/features/shared/components/ui/badge'

interface TechnicianPartTimeBannerProps {
  isDayOff: boolean
  isHalfDay: boolean
  scheduledDailyHours: number
}

export function TechnicianPartTimeBanner({
  isDayOff,
  isHalfDay,
  scheduledDailyHours,
}: TechnicianPartTimeBannerProps) {
  if (isDayOff) {
    return (
      <div className="p-3.5 rounded-xl border border-border bg-muted/40 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <CalendarOff className="size-4 shrink-0 text-muted-foreground" />
          <div>
            <span className="font-semibold text-foreground block">
              Vrije dag volgens weekrooster
            </span>
            <span className="text-[11px] text-muted-foreground">
              U heeft vandaag geen ingeroosterde werkuren (0u).
            </span>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-medium shrink-0">
          Niet ingeroosterd
        </Badge>
      </div>
    )
  }

  if (isHalfDay) {
    return (
      <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
          <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-semibold block">
              Deeltijd werkrooster ({scheduledDailyHours}u ingeroosterd)
            </span>
            <span className="text-[11px] opacity-80">
              Voormiddag ingeroosterd voor interventies, namiddag vrij.
            </span>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 shrink-0 font-medium"
        >
          {scheduledDailyHours}u Dienst
        </Badge>
      </div>
    )
  }

  return null
}
