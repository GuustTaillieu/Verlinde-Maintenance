import { Badge } from '#/features/shared/components/ui/badge'
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  Loader2,
  Coffee,
  Ban,
  History,
} from 'lucide-react'
import { useClusterDispatch } from './ClusterDispatchContext'

function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function DispatchWeekGrid() {
  const { planner } = useClusterDispatch()
  const {
    activeTech,
    weekDays,
    existingSlots,
    proposedSlots,
    dayLoads,
    dayRegionConflicts,
    isLoadingSlots,
    isOverCapacity,
    isPastWeek,
  } = planner

  const hoursList = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background/50 p-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className="text-base font-semibold">
            Weekoverzicht: {activeTech.name}
          </span>
          {isLoadingSlots && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        </div>

        {isPastWeek ? (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-medium bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg shadow-2xs">
            <History className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Deze week ligt in het verleden. U kunt het rooster bekijken, maar er kunnen geen afspraken in het verleden worden ingepland.
            </span>
          </div>
        ) : isOverCapacity ? (
          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium bg-destructive/10 px-2.5 py-1 rounded-md">
            <AlertTriangle className="size-3.5" />
            Daglimiet of beschikbare tijd overschreden. Selecteer minder werven of wissel van technicus.
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 min-h-[560px] border border-border rounded-xl bg-card overflow-hidden shadow-2xs">
        <div className="w-12 border-r border-border/80 flex flex-col bg-muted/10 shrink-0 pt-10">
          <div className="relative flex-1">
            {hoursList.map((hour, idx) => {
              const topPct = (idx / 9) * 100
              return (
                <div
                  key={hour}
                  style={{ top: `${topPct}%` }}
                  className="absolute right-2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground select-none"
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-5 flex-1 divide-x divide-border/80 min-w-0">
          {weekDays.map((day) => {
            const scheduledDailyHours = activeTech.weeklySchedule[day.dayKey] ?? 8
            const isDayOff = scheduledDailyHours === 0
            const isHalfDay = scheduledDailyHours <= 4
            const totalHours = Math.round((dayLoads[day.date] || 0) * 10) / 10
            const regionConflictCity = dayRegionConflicts?.[day.date]
            const isDayOverloaded = !regionConflictCity && totalHours > scheduledDailyHours
            const dayExisting = existingSlots.filter((s) => s.date === day.date)
            const dayProposed = proposedSlots.filter((s) => s.date === day.date)

            return (
              <div key={day.date} className={`flex flex-col min-w-0 ${day.isPastOrToday ? 'bg-muted/15 opacity-90' : regionConflictCity ? 'bg-muted/10' : 'bg-background/30'}`}>
                <div className="h-10 px-2 border-b border-border/80 flex items-center justify-between bg-muted/20 shrink-0">
                  <div className="truncate">
                    <span className="text-xs font-semibold block text-foreground truncate">
                      {day.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {day.dayLabel}
                      {day.isPastOrToday ? ' • Verleden' : regionConflictCity ? ` • ${regionConflictCity}` : ''}
                    </span>
                  </div>
                  <Badge
                    variant={isDayOverloaded ? 'destructive' : regionConflictCity ? 'outline' : totalHours > 0 ? 'secondary' : 'outline'}
                    className={`text-[9px] font-mono px-1 py-0 shrink-0 ${regionConflictCity ? 'border-amber-500/40 text-amber-600 dark:text-amber-400' : ''}`}
                    title={regionConflictCity ? `Al ingeroosterd in regio ${regionConflictCity}` : undefined}
                  >
                    {regionConflictCity ? `${totalHours}u (${regionConflictCity})` : `${totalHours}u / ${scheduledDailyHours}u`}
                  </Badge>
                </div>

                <div className="relative flex-1 min-h-[500px] overflow-hidden">
                  {hoursList.map((_, idx) => {
                    const topPct = (idx / 9) * 100
                    return (
                      <div
                        key={idx}
                        style={{ top: `${topPct}%` }}
                        className="absolute inset-x-0 border-t border-border/40 pointer-events-none"
                      />
                    )
                  })}

                  {!isDayOff && (
                    <div
                      style={{
                        top: `${(240 / 540) * 100}%`,
                        height: `${(60 / 540) * 100}%`,
                      }}
                      className="absolute inset-x-0 bg-amber-500/10 border-y border-amber-500/20 flex items-center justify-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 select-none z-35 pointer-events-none"
                    >
                      <Coffee className="size-3" />
                      <span>Middagpauze (12:00 - 13:00)</span>
                    </div>
                  )}

                  {isDayOff && (
                    <div className="absolute inset-0 bg-muted/60 flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground p-3 text-center z-20">
                      <Ban className="size-4 opacity-50" />
                      <span>Vrije dag</span>
                      <span className="text-[9px] opacity-70">Niet ingeroosterd</span>
                    </div>
                  )}

                  {!isDayOff && isHalfDay && (
                    <div
                      style={{
                        top: `${((750 - 480) / 540) * 100}%`,
                        height: `${((1020 - 750) / 540) * 100}%`,
                      }}
                      className="absolute inset-x-0 bg-muted/60 border-t border-border flex items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground select-none z-10"
                    >
                      <Ban className="size-3 opacity-50" />
                      <span>Namiddag niet beschikbaar (deeltijds)</span>
                    </div>
                  )}

                  {dayExisting.map((slot) => {
                    const startMin = timeStringToMinutes(slot.startTime)
                    const endMin = timeStringToMinutes(slot.endTime)
                    const topPct = Math.max(0, ((startMin - 480) / 540) * 100)
                    const heightPct = Math.min(100 - topPct, (((endMin - startMin) / 540) * 100))
                    const isReserved = slot.status === 'PROPOSED'

                    return (
                      <div
                        key={slot.id}
                        style={{
                          top: `calc(${topPct}% + 1.5px)`,
                          height: `calc(${heightPct}% - 3px)`,
                        }}
                        className={`absolute inset-x-1 rounded-md p-1.5 text-xs flex flex-col justify-between overflow-hidden shadow-2xs z-20 ${
                          isReserved
                            ? 'border-2 border-dashed border-primary/50 bg-primary/5'
                            : 'border border-border bg-muted/90'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground">
                            <span>{slot.startTime} - {slot.endTime}</span>
                            {isReserved ? (
                              <span className="text-[9px] font-sans font-medium text-primary">Gereserveerd</span>
                            ) : (
                              <span className="font-semibold">{slot.durationHours}u</span>
                            )}
                          </div>
                          <div className="font-medium text-foreground text-[11px] leading-tight truncate">
                            {slot.siteName}
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {slot.siteCity}
                        </div>
                      </div>
                    )
                  })}

                  {dayProposed.map((slot) => {
                    const startMin = timeStringToMinutes(slot.startTime)
                    const endMin = timeStringToMinutes(slot.endTime)
                    const topPct = Math.max(0, ((startMin - 480) / 540) * 100)
                    const heightPct = Math.min(100 - topPct, (((endMin - startMin) / 540) * 100))

                    return (
                      <div
                        key={slot.siteId}
                        style={{
                          top: `calc(${topPct}% + 1.5px)`,
                          height: `calc(${heightPct}% - 3px)`,
                        }}
                        className="absolute inset-x-1 rounded-md border-2 border-dashed border-primary/70 bg-primary/10 p-1.5 text-xs flex flex-col justify-between overflow-hidden shadow-xs z-30 transition-all animate-in fade-in-50"
                      >
                        <div>
                          <div className="flex items-center justify-between font-mono text-[9px] text-primary font-semibold">
                            <span>{slot.startTime} - {slot.endTime}</span>
                            <span className="text-[9px] font-sans font-medium bg-primary/15 px-1 rounded text-primary">
                              Voorstel
                            </span>
                          </div>
                          <div className="font-semibold text-foreground text-[11px] line-clamp-2 mt-0.5">
                            {slot.siteName}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                          <span className="truncate">{slot.customerName}</span>
                          <span className="font-mono text-[9px] text-primary shrink-0">
                            {slot.durationHours}u
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
