import { useState, useMemo } from 'react'
import { Button } from '#/features/shared/components/ui/button'
import { Badge } from '#/features/shared/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/features/shared/components/ui/popover'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatDateIso, formatDateDutch } from '#/features/maintenance/utils/dateUtils'

interface TechnicianDayNavigatorProps {
  currentDate: string // YYYY-MM-DD
  onSelectDate: (dateIso: string) => void
}

/**
 * Calculates adjacent workday, skipping Saturdays and Sundays.
 */
export function getAdjacentWorkday(dateIso: string, direction: 'prev' | 'next'): string {
  const [y, m, d] = dateIso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const day = dt.getDay() // 0 = sun, 1 = mon, ..., 5 = fri, 6 = sat

  if (direction === 'next') {
    if (day === 5) {
      // Friday -> skip Saturday and Sunday -> Monday (+3)
      dt.setDate(dt.getDate() + 3)
    } else if (day === 6) {
      // Saturday -> Monday (+2)
      dt.setDate(dt.getDate() + 2)
    } else if (day === 0) {
      // Sunday -> Monday (+1)
      dt.setDate(dt.getDate() + 1)
    } else {
      dt.setDate(dt.getDate() + 1)
    }
  } else {
    if (day === 1) {
      // Monday -> skip Sunday and Saturday -> Friday (-3)
      dt.setDate(dt.getDate() - 3)
    } else if (day === 0) {
      // Sunday -> Friday (-2)
      dt.setDate(dt.getDate() - 2)
    } else if (day === 6) {
      // Saturday -> Friday (-1)
      dt.setDate(dt.getDate() - 1)
    } else {
      dt.setDate(dt.getDate() - 1)
    }
  }

  return formatDateIso(dt)
}

export function TechnicianDayNavigator({
  currentDate,
  onSelectDate,
}: TechnicianDayNavigatorProps) {
  const todayIso = useMemo(() => formatDateIso(new Date()), [])
  const isToday = currentDate === todayIso

  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState<Date>(() => {
    const [y, m] = currentDate.split('-').map(Number)
    return new Date(y, m - 1, 1)
  })

  const handlePrevDay = () => {
    onSelectDate(getAdjacentWorkday(currentDate, 'prev'))
  }

  const handleNextDay = () => {
    onSelectDate(getAdjacentWorkday(currentDate, 'next'))
  }

  const handleToday = () => {
    const today = new Date()
    const day = today.getDay()
    if (day === 0) {
      today.setDate(today.getDate() + 1)
    } else if (day === 6) {
      today.setDate(today.getDate() + 2)
    }
    onSelectDate(formatDateIso(today))
  }

  const handleSelectDateFromPicker = (date: Date) => {
    onSelectDate(formatDateIso(date))
    setIsCalendarOpen(false)
  }

  // Month grid for datepicker popover
  const calendarDays = useMemo(() => {
    const y = pickerMonth.getFullYear()
    const m = pickerMonth.getMonth()
    const firstDay = new Date(y, m, 1)
    const lastDay = new Date(y, m + 1, 0)

    const days: Array<{ date: Date; isCurrentMonth: boolean; isSelected: boolean; isWeekend: boolean }> = []
    const startOffset = (firstDay.getDay() + 6) % 7
    for (let i = startOffset; i > 0; i--) {
      const d = new Date(y, m, 1 - i)
      const isWeekend = d.getDay() === 0 || d.getDay() === 6
      days.push({ date: d, isCurrentMonth: false, isSelected: formatDateIso(d) === currentDate, isWeekend })
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(y, m, day)
      const isWeekend = d.getDay() === 0 || d.getDay() === 6
      days.push({ date: d, isCurrentMonth: true, isSelected: formatDateIso(d) === currentDate, isWeekend })
    }

    const totalDays = days.length
    const endDays = (7 - (totalDays % 7)) % 7
    for (let i = 1; i <= endDays; i++) {
      const d = new Date(y, m + 1, i)
      const isWeekend = d.getDay() === 0 || d.getDay() === 6
      days.push({ date: d, isCurrentMonth: false, isSelected: formatDateIso(d) === currentDate, isWeekend })
    }

    return days
  }, [pickerMonth, currentDate])

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-2xs space-y-2">
      {/* 1. Date Selector Button (Full-width, opens calendar popup) */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-10 px-3 text-xs sm:text-sm font-semibold justify-between border-border bg-background hover:bg-muted"
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="size-4 text-primary shrink-0" />
              <span className="capitalize truncate">{formatDateDutch(currentDate)}</span>
            </div>
            {isToday && (
              <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4 font-bold bg-primary text-primary-foreground shrink-0">
                Vandaag
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-64 p-3 bg-popover shadow-md border-border" align="center">
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => {
                  const prev = new Date(pickerMonth)
                  prev.setMonth(prev.getMonth() - 1)
                  setPickerMonth(prev)
                }}
              >
                <ChevronLeft className="size-3" />
              </Button>
              <span className="text-xs font-semibold capitalize">
                {pickerMonth.toLocaleString('nl-BE', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => {
                  const next = new Date(pickerMonth)
                  next.setMonth(next.getMonth() + 1)
                  setPickerMonth(next)
                }}
              >
                <ChevronRight className="size-3" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
              <span>Ma</span>
              <span>Di</span>
              <span>Wo</span>
              <span>Do</span>
              <span>Vr</span>
              <span className="text-muted-foreground/50">Za</span>
              <span className="text-muted-foreground/50">Zo</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDateFromPicker(item.date)}
                  className={`size-7 text-[11px] rounded flex items-center justify-center transition-colors cursor-pointer ${
                    item.isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : item.isWeekend
                      ? 'text-muted-foreground/40 hover:bg-muted/30'
                      : item.isCurrentMonth
                      ? 'text-foreground hover:bg-muted font-medium'
                      : 'text-muted-foreground/30 hover:bg-muted/40'
                  }`}
                >
                  {item.date.getDate()}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* 2. Navigation Buttons (Positioned underneath in a clean 3-button grid) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePrevDay}
          className="h-9 text-xs gap-1 border-border w-full justify-center px-1"
          title="Vorige werkdag (weekend overslaan)"
        >
          <ChevronLeft className="size-3.5 shrink-0" />
          <span>Vorige</span>
        </Button>

        <Button
          size="sm"
          variant={isToday ? 'default' : 'outline'}
          onClick={handleToday}
          className="h-9 text-xs font-semibold w-full justify-center px-1"
        >
          Vandaag
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleNextDay}
          className="h-9 text-xs gap-1 border-border w-full justify-center px-1"
          title="Volgende werkdag (weekend overslaan)"
        >
          <span>Volgende</span>
          <ChevronRight className="size-3.5 shrink-0" />
        </Button>
      </div>
    </div>
  )
}
