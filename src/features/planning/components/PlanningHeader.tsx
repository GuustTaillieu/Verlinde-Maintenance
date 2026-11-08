import { useState, useMemo } from 'react'
import { usePlanningContext } from './PlanningContext'
import { TechnicianCombobox } from '#/features/shared/components/TechnicianCombobox'
import { Button } from '#/features/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/features/shared/components/ui/popover'
import { Header } from '#/features/shared/components/header'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { getMonday, formatDateIso } from '#/features/maintenance/utils/dateUtils'

export function PlanningHeader() {
  const {
    weekStartDate,
    weekEndDate,
    year,
    activeTechId,
    technicians,
    capacities,
    onSelectTech,
    onSelectWeek,
  } = usePlanningContext()

  const technicianOptions = useMemo(() => {
    return technicians.map((t) => {
      const cap = capacities.find((c) => c.techId === t.id)
      const availableHours = cap
        ? Math.max(0, Math.round((cap.weeklyMaxHours - cap.totalHoursScheduled) * 10) / 10)
        : undefined
      return {
        ...t,
        availableHours,
      }
    })
  }, [technicians, capacities])

  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState<Date>(() => {
    const monday = new Date(weekStartDate)
    return new Date(monday.getFullYear(), monday.getMonth(), 1)
  })

  const handlePrevWeek = () => {
    const d = new Date(weekStartDate)
    d.setDate(d.getDate() - 7)
    onSelectWeek(formatDateIso(getMonday(d)))
  }

  const handleNextWeek = () => {
    const d = new Date(weekStartDate)
    d.setDate(d.getDate() + 7)
    onSelectWeek(formatDateIso(getMonday(d)))
  }

  const handleToday = () => {
    onSelectWeek(formatDateIso(getMonday(new Date())))
  }

  const handleSelectDateFromPicker = (date: Date) => {
    const monday = getMonday(date)
    onSelectWeek(formatDateIso(monday))
    setIsCalendarOpen(false)
  }

  const formatShortDate = (iso: string) => {
    if (!iso) return ''
    const parts = iso.split('-').map(Number)
    const dt = new Date(parts[0], parts[1] - 1, parts[2])
    return dt.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
  }

  // Month grid for calendar popover
  const calendarDays = useMemo(() => {
    const y = pickerMonth.getFullYear()
    const m = pickerMonth.getMonth()
    const firstDay = new Date(y, m, 1)
    const lastDay = new Date(y, m + 1, 0)

    const days: Array<{ date: Date; isCurrentMonth: boolean; isCurrentWeek: boolean }> = []
    const startOffset = (firstDay.getDay() + 6) % 7
    for (let i = startOffset; i > 0; i--) {
      const d = new Date(y, m, 1 - i)
      days.push({ date: d, isCurrentMonth: false, isCurrentWeek: false })
    }

    const currentMondayTime = new Date(weekStartDate).getTime()
    const currentFridayTime = currentMondayTime + 4 * 86400000

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(y, m, day)
      const dTime = d.getTime()
      const isCurrentWeek = dTime >= currentMondayTime && dTime <= currentFridayTime
      days.push({ date: d, isCurrentMonth: true, isCurrentWeek })
    }

    const totalDays = days.length
    const endDays = (7 - (totalDays % 7)) % 7
    for (let i = 1; i <= endDays; i++) {
      const d = new Date(y, m + 1, i)
      days.push({ date: d, isCurrentMonth: false, isCurrentWeek: false })
    }

    return days
  }, [pickerMonth, weekStartDate])

  return (
    <div className="space-y-4">
      <Header
        title="Planning & Agenda"
        subtitle="Tactisch weekoverzicht, urenregistratie en capaciteitsbezetting per technicus."
        rightComponent={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Searchable Technician Selector - supports 100+ technicians */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                Technicus:
              </span>
              <TechnicianCombobox
                technicians={technicianOptions}
                value={activeTechId}
                onValueChange={onSelectTech}
                className="w-56"
                align="end"
              />
            </div>

            {/* Week Navigator with interactive Calendar Popover */}
            <div className="flex items-center gap-1 border border-border rounded-lg bg-background p-1 shadow-2xs">
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={handlePrevWeek}
                className="size-7"
                title="Vorige week"
              >
                <ChevronLeft className="size-3.5" />
              </Button>

              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-medium px-2 whitespace-nowrap gap-1.5 text-foreground hover:bg-muted"
                  >
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    <span>
                      {formatShortDate(weekStartDate)} – {formatShortDate(weekEndDate)} {year}
                    </span>
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
                      <span>Za</span>
                      <span>Zo</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectDateFromPicker(item.date)}
                          className={`size-7 text-[11px] rounded flex items-center justify-center transition-colors cursor-pointer ${
                            item.isCurrentWeek
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : item.isCurrentMonth
                              ? 'text-foreground hover:bg-muted'
                              : 'text-muted-foreground/40 hover:bg-muted/50'
                          }`}
                        >
                          {item.date.getDate()}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                size="icon-xs"
                variant="ghost"
                onClick={handleNextWeek}
                className="size-7"
                title="Volgende week"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

            {/* Quick Today Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleToday}
              className="h-9 px-3 text-xs font-medium border-border"
            >
              Vandaag
            </Button>
          </div>
        }
      />
    </div>
  )
}
