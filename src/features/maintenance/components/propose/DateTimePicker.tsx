import { useState, useMemo } from 'react'
import { Button } from '#/features/shared/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface DateTimePickerProps {
  selectedDate: string // YYYY-MM-DD
  onSelectDate: (date: string) => void
}


export function DateTimePicker({
  selectedDate,
  onSelectDate,
}: DateTimePickerProps) {
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = selectedDate.split('-').map(Number)
    return new Date(y, m - 1, 1)
  })

  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])

  const calendarDays = useMemo(() => {
    const y = viewDate.getFullYear()
    const m = viewDate.getMonth()
    const firstDay = new Date(y, m, 1)
    const lastDay = new Date(y, m + 1, 0)

    const days: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean; isPast: boolean }> = []
    const startOffset = (firstDay.getDay() + 6) % 7

    for (let i = startOffset; i > 0; i--) {
      const d = new Date(y, m, 1 - i)
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({ date: d, dateStr: dStr, isCurrentMonth: false, isPast: d < today })
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(y, m, day)
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({ date: d, dateStr: dStr, isCurrentMonth: true, isPast: d < today })
    }

    const totalDays = days.length
    const endDays = (7 - (totalDays % 7)) % 7
    for (let i = 1; i <= endDays; i++) {
      const d = new Date(y, m + 1, i)
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({ date: d, dateStr: dStr, isCurrentMonth: false, isPast: d < today })
    }

    return days
  }, [viewDate, today])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
            <CalendarIcon className="size-3.5 text-muted-foreground" />
            <span>{viewDate.toLocaleString('nl-BE', { month: 'long', year: 'numeric' })}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              type="button"
              onClick={() => {
                const prev = new Date(viewDate)
                prev.setMonth(prev.getMonth() - 1)
                setViewDate(prev)
              }}
            >
              <ChevronLeft className="size-3" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              type="button"
              onClick={() => {
                const next = new Date(viewDate)
                next.setMonth(next.getMonth() + 1)
                setViewDate(next)
              }}
            >
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 pt-2 text-center text-[10px] font-medium text-muted-foreground">
          <span>Ma</span>
          <span>Di</span>
          <span>Wo</span>
          <span>Do</span>
          <span>Vr</span>
          <span>Za</span>
          <span>Zo</span>
        </div>

        <div className="grid grid-cols-7 gap-1 pt-1">
          {calendarDays.map((item, idx) => {
            const isSelected = item.dateStr === selectedDate
            const isWeekend = item.date.getDay() === 0 || item.date.getDay() === 6
            const isDisabled = item.isPast || isWeekend

            return (
              <button
                key={idx}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectDate(item.dateStr)}
                className={`size-7 text-[11px] rounded-md flex items-center justify-center font-medium transition-colors ${isSelected
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : isDisabled
                    ? 'text-muted-foreground/30 cursor-not-allowed'
                    : item.isCurrentMonth
                      ? 'text-foreground hover:bg-muted'
                      : 'text-muted-foreground/50 hover:bg-muted/40'
                  }`}
              >
                {item.date.getDate()}
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}

