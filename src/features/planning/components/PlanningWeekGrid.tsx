import { useMemo } from 'react'
import { usePlanningContext } from './PlanningContext'
import { Badge } from '#/features/shared/components/ui/badge'
import { DisciplineBadge } from '#/features/shared/components/DisciplineBadge'
import { useIsMobile } from '#/features/shared/hooks/use-mobile'
import {
  Coffee,
  Ban,
  CheckCircle2,
  MapPin,
  CalendarCheck,
} from 'lucide-react'
import { formatDateIso } from '#/features/maintenance/utils/dateUtils'
import type { PlanningSlot } from '../types'
import { cn } from '#/features/shared/lib/utils'

function timeStringToMinutes(timeStr: string): number {
  const [h, m] = (timeStr || '08:30').split(':').map(Number)
  return (h || 8) * 60 + (m || 0)
}

interface PositionedSlot {
  slot: PlanningSlot
  topPct: number
  heightPct: number
  leftPct: number
  widthPct: number
}

function layoutDaySlots(daySlots: PlanningSlot[]): PositionedSlot[] {
  if (daySlots.length === 0) return []

  const mapped = daySlots.map((s) => {
    const startMin = timeStringToMinutes(s.startTime)
    let endMin = timeStringToMinutes(s.endTime)
    if (endMin <= startMin) endMin = startMin + 120
    return { slot: s, startMin, endMin }
  })

  // Sort chronologically, longer events first on tie
  mapped.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin))

  // Group into connected clusters of overlapping intervals
  const clusters: (typeof mapped)[] = []
  let currentCluster: typeof mapped = []
  let clusterEnd = -1

  for (const item of mapped) {
    if (currentCluster.length === 0) {
      currentCluster.push(item)
      clusterEnd = item.endMin
    } else if (item.startMin < clusterEnd) {
      currentCluster.push(item)
      clusterEnd = Math.max(clusterEnd, item.endMin)
    } else {
      clusters.push(currentCluster)
      currentCluster = [item]
      clusterEnd = item.endMin
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster)
  }

  const result: PositionedSlot[] = []

  for (const cluster of clusters) {
    // Greedy column allocation within this cluster
    const columnEndTimes: number[] = []
    const itemCols = new Map<string, number>()

    for (const item of cluster) {
      let placedCol = -1
      for (let c = 0; c < columnEndTimes.length; c++) {
        if (columnEndTimes[c] <= item.startMin) {
          placedCol = c
          columnEndTimes[c] = item.endMin
          break
        }
      }
      if (placedCol === -1) {
        placedCol = columnEndTimes.length
        columnEndTimes.push(item.endMin)
      }
      itemCols.set(item.slot.id, placedCol)
    }

    const totalColumns = columnEndTimes.length
    for (const item of cluster) {
      const colIndex = itemCols.get(item.slot.id) ?? 0
      const topPct = Math.max(0, ((item.startMin - 480) / 540) * 100)
      const heightPct = Math.max(8, Math.min(100 - topPct, ((item.endMin - item.startMin) / 540) * 100))
      const widthPct = 100 / totalColumns
      const leftPct = colIndex * widthPct

      result.push({
        slot: item.slot,
        topPct,
        heightPct,
        leftPct,
        widthPct,
      })
    }
  }

  return result
}

export function PlanningWeekGrid() {
  const isMobile = useIsMobile()
  const {
    weekStartDate,
    slots,
    activeTechId,
    technicians,
    setSelectedSlot,
    selectedDate,
    setSelectedDate,
  } = usePlanningContext()

  const todayIso = useMemo(() => formatDateIso(new Date()), [])

  const selectedTech = useMemo(
    () => technicians.find((t) => t.id === activeTechId) || technicians[0],
    [technicians, activeTechId]
  )

  // 5 Working days: Monday through Friday
  const weekDays = useMemo(() => {
    const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']
    const dayKeys: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri'> = [
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
    ]
    const monday = new Date(weekStartDate)

    return dayNames.map((name, index) => {
      const dt = new Date(monday)
      dt.setDate(dt.getDate() + index)
      const dateIso = formatDateIso(dt)
      const dayKey = dayKeys[index]
      const scheduledDailyHours = selectedTech?.weeklySchedule[dayKey] ?? 8

      return {
        name,
        shortName: name.slice(0, 2),
        dayKey,
        dateIso,
        dayNumber: dt.getDate(),
        monthLabel: dt.toLocaleDateString('nl-BE', { month: 'short' }),
        isToday: dateIso === todayIso,
        scheduledDailyHours,
        isDayOff: scheduledDailyHours === 0,
        isHalfDay: scheduledDailyHours <= 4,
      }
    })
  }, [weekStartDate, todayIso, selectedTech])

  // Filter slots for active technician
  const filteredSlots = useMemo(() => {
    const techId = activeTechId || selectedTech?.id
    return slots.filter((s) => s.assignedTechnicianId === techId)
  }, [slots, activeTechId, selectedTech])

  // Group and compute side-by-side layout for each day's slots
  const positionedSlotsByDay = useMemo(() => {
    const map = new Map<string, PositionedSlot[]>()
    for (const day of weekDays) {
      const daySlots = filteredSlots.filter((s) => s.date === day.dateIso)
      map.set(day.dateIso, layoutDaySlots(daySlots))
    }
    return map
  }, [weekDays, filteredSlots])

  // 08:00 (480 min) to 17:00 (1020 min) = 540 minutes range
  const hoursList = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

  const renderPositionedCard = (pos: PositionedSlot) => {
    const { slot, topPct, heightPct, leftPct, widthPct } = pos
    const isCompleted = slot.status === 'COMPLETED'
    const isInProgress = slot.status === 'IN_PROGRESS'

    return (
      <div
        key={slot.id}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedSlot(slot)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setSelectedSlot(slot)
          }
        }}
        style={{
          top: `calc(${topPct}% + 1px)`,
          height: `calc(${heightPct}% - 2px)`,
          left: `calc(${leftPct}% + 1.5px)`,
          width: `calc(${widthPct}% - 3px)`,
        }}
        className={cn(
          'absolute rounded-lg p-2 text-xs flex flex-col justify-between overflow-hidden shadow-2xs z-20 cursor-pointer select-none transition-all',
          'hover:shadow-md hover:ring-1 hover:ring-primary/40 hover:z-30 text-left',
          isCompleted
            ? 'border-l-4 border-l-emerald-500 bg-card hover:bg-emerald-500/5 border-t border-r border-b border-border'
            : isInProgress
            ? 'border-l-4 border-l-amber-500 bg-card hover:bg-amber-500/5 border-t border-r border-b border-border'
            : 'border-l-4 border-l-primary bg-card hover:bg-primary/5 border-t border-r border-b border-border'
        )}
      >
        <div className="space-y-0.5 truncate">
          {/* Time & Discipline */}
          <div className="flex items-center justify-between text-[10px] gap-1">
            <span className="font-semibold text-foreground font-mono truncate">
              {slot.startTime} – {slot.endTime}
            </span>
            <DisciplineBadge discipline={slot.primaryDiscipline} className="shrink-0" />
          </div>

          {/* Client & Site Name */}
          <div className="font-semibold text-foreground text-[11px] leading-tight truncate mt-1">
            {slot.customerName}
          </div>
          <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
            <MapPin className="size-2.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{slot.siteName}</span>
          </div>
        </div>

        {/* Footer: Municipality & Status */}
        <div className="flex items-center justify-between text-[9px] pt-1 border-t border-border/40 mt-1 gap-1">
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal text-muted-foreground truncate">
            {slot.siteCity}
          </Badge>

          {isCompleted ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
              <CheckCircle2 className="size-2.5" />
              <span>Voltooid</span>
            </span>
          ) : isInProgress ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium shrink-0">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Bezig</span>
            </span>
          ) : (
            <span className="text-muted-foreground font-mono truncate">{slot.woNumber}</span>
          )}
        </div>
      </div>
    )
  }

  // 1. MOBILE VIEW: Day Tabs Switcher + Single Day Grid
  if (isMobile) {
    const activeDay = weekDays.find((d) => d.dateIso === selectedDate) || weekDays[0]
    const dayPositionedSlots = positionedSlotsByDay.get(activeDay.dateIso) || []
    const totalDayHours = dayPositionedSlots.reduce((sum, p) => sum + p.slot.durationHours, 0)

    return (
      <div className="space-y-3">
        {/* Day Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border overflow-x-auto">
          {weekDays.map((day) => {
            const isSelected = day.dateIso === activeDay.dateIso
            const count = (positionedSlotsByDay.get(day.dateIso) || []).length

            return (
              <button
                key={day.dateIso}
                type="button"
                onClick={() => setSelectedDate(day.dateIso)}
                className={cn(
                  'flex-1 min-w-[62px] py-2 px-1.5 rounded-lg text-center transition-all cursor-pointer select-none',
                  isSelected
                    ? 'bg-background text-foreground shadow-xs border border-border font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                <div className="text-[11px] uppercase tracking-wider">{day.shortName}</div>
                <div className="text-sm font-semibold">{day.dayNumber}</div>
                {count > 0 && (
                  <Badge
                    variant={isSelected ? 'default' : 'secondary'}
                    className="text-[9px] px-1 py-0 h-3.5 mx-auto mt-0.5 rounded-full"
                  >
                    {count}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        {/* Mobile Single Day Grid */}
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs">
          <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-4 text-primary" />
              <span className="font-bold text-sm text-foreground">
                {activeDay.name} {activeDay.dayNumber} {activeDay.monthLabel}
              </span>
              {activeDay.isToday && (
                <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4 font-bold">
                  Vandaag
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              {totalDayHours}u ingepland
            </Badge>
          </div>

          <div className="flex min-h-[560px]">
            {/* Time labels column */}
            <div className="w-12 border-r border-border/80 flex flex-col bg-muted/10 shrink-0 pt-2">
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

            {/* Day grid column */}
            <div className="relative flex-1 min-h-[560px] bg-background/40">
              {/* Hour horizontal grid lines */}
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

              {/* Lunch Pause (12:00 – 13:00) */}
              <div
                style={{
                  top: `${(240 / 540) * 100}%`,
                  height: `${(60 / 540) * 100}%`,
                }}
                className="absolute inset-x-0 bg-amber-500/10 border-y border-amber-500/20 flex items-center justify-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 select-none z-10 pointer-events-none"
              >
                <Coffee className="size-3 shrink-0" />
                <span>Middagpauze (12:00 – 13:00)</span>
              </div>

              {/* Positioned Event Cards */}
              {dayPositionedSlots.map(renderPositionedCard)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. DESKTOP / TABLET VIEW: Full 5-Day Grid with grid lines & side-by-side positioning
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs">
      <div className="flex min-h-[600px]">
        {/* Left Y-axis Time column */}
        <div className="w-14 border-r border-border/80 flex flex-col bg-muted/10 shrink-0 pt-11">
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

        {/* 5-Day Columns */}
        <div className="grid grid-cols-5 flex-1 divide-x divide-border/80 min-w-0">
          {weekDays.map((day) => {
            const dayPositionedSlots = positionedSlotsByDay.get(day.dateIso) || []
            const dayTotalHours = Math.round(dayPositionedSlots.reduce((sum, p) => sum + p.slot.durationHours, 0) * 10) / 10
            const isOverloaded = dayTotalHours > day.scheduledDailyHours

            return (
              <div
                key={day.dateIso}
                className={cn(
                  'flex flex-col min-w-0',
                  day.isToday ? 'bg-primary/[0.02]' : 'bg-background/40'
                )}
              >
                {/* Column Day Header */}
                <div
                  className={cn(
                    'h-11 px-2.5 border-b border-border/80 flex items-center justify-between shrink-0',
                    day.isToday ? 'bg-primary/10' : 'bg-muted/20'
                  )}
                >
                  <div className="truncate pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground truncate">
                        {day.name}
                      </span>
                      {day.isToday && (
                        <Badge
                          variant="default"
                          className="text-[9px] px-1 py-0 h-3.5 font-bold bg-primary text-primary-foreground"
                        >
                          Vandaag
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {day.dayNumber} {day.monthLabel}
                    </span>
                  </div>

                  <Badge
                    variant={isOverloaded ? 'destructive' : dayTotalHours > 0 ? 'secondary' : 'outline'}
                    className="text-[9px] font-mono px-1 py-0 shrink-0"
                  >
                    {dayTotalHours}u / {day.scheduledDailyHours}u
                  </Badge>
                </div>

                {/* Day Schedule Grid Column */}
                <div className="relative flex-1 min-h-[550px] overflow-hidden">
                  {/* Horizontal Hour Grid Lines */}
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

                  {/* Lunch Pause (12:00 – 13:00) */}
                  {!day.isDayOff && (
                    <div
                      style={{
                        top: `${(240 / 540) * 100}%`,
                        height: `${(60 / 540) * 100}%`,
                      }}
                      className="absolute inset-x-0 bg-amber-500/10 border-y border-amber-500/20 flex items-center justify-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 select-none z-10 pointer-events-none"
                    >
                      <Coffee className="size-3 shrink-0" />
                      <span>Middagpauze (12:00 – 13:00)</span>
                    </div>
                  )}

                  {/* Full Day Off */}
                  {day.isDayOff && (
                    <div className="absolute inset-0 bg-muted/60 flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground p-3 text-center z-15">
                      <Ban className="size-4 opacity-50" />
                      <span>Vrije dag</span>
                      <span className="text-[9px] opacity-70">Niet ingeroosterd</span>
                    </div>
                  )}

                  {/* Part-time afternoon non-scheduled block */}
                  {!day.isDayOff && day.isHalfDay && (
                    <div
                      style={{
                        top: `${((750 - 480) / 540) * 100}%`,
                        height: `${((1020 - 750) / 540) * 100}%`,
                      }}
                      className="absolute inset-x-0 bg-muted/60 border-t border-border flex items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground select-none z-10"
                    >
                      <Ban className="size-3 opacity-50" />
                      <span>Namiddag niet ingeroosterd</span>
                    </div>
                  )}

                  {/* Render Positioned Work Order Cards (side-by-side on overlap) */}
                  {dayPositionedSlots.map(renderPositionedCard)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
