import * as React from 'react'
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '#/features/shared/components/ui/sheet'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
} from '#/features/shared/components/ui/combobox'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '#/features/shared/components/ui/popover'
import { Button } from '#/features/shared/components/ui/button'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
} from 'lucide-react'
import type { TechnicianUser } from '../../server/getTechnicians'
import type { DayColumn } from './useDispatchPlanner'

interface DispatchHeaderProps {
  city: string
  technicians: TechnicianUser[]
  selectedTechId: string
  onSelectTechId: (id: string) => void
  recommendedTech: TechnicianUser | null
  otherTechs: TechnicianUser[]
  weekDays: DayColumn[]
  currentYear: number
  onNavigateWeek: (delta: number) => void
  isCalendarPickerOpen: boolean
  onCalendarPickerOpenChange: (open: boolean) => void
  pickerMonth: Date
  onChangePickerMonth: (date: Date) => void
  calendarDays: Array<{ date: Date; isCurrentMonth: boolean; isCurrentWeek: boolean }>
  onSelectCalendarDate: (date: Date) => void
  sheetContentRef?: React.RefObject<HTMLDivElement | null>
}

export function DispatchHeader({
  city,
  technicians,
  selectedTechId,
  onSelectTechId,
  recommendedTech,
  otherTechs,
  weekDays,
  currentYear,
  onNavigateWeek,
  isCalendarPickerOpen,
  onCalendarPickerOpenChange,
  pickerMonth,
  onChangePickerMonth,
  calendarDays,
  onSelectCalendarDate,
  sheetContentRef,
}: DispatchHeaderProps) {
  return (
    <SheetHeader
      className="-mx-4 -mt-4 bg-muted/20 border-b border-border/80 px-8 py-3 flex flex-row items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="hidden xl:flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          <CalendarCheck className="size-4.5" />
        </div>
        <div>
          <SheetTitle className="text-lg font-semibold tracking-tight">
            Batch Dispatching: Regio {city}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground line-clamp-2">
            Bekijk direct de bezetting van de technicus en zie hoe de geselecteerde werven in het dagschema passen.
          </SheetDescription>
        </div>
      </div>

      <div className="flex flex-col items-end xl:flex-row xl:items-center gap-2 mr-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Technicus:
          </span>
          <Combobox
            value={selectedTechId}
            onValueChange={(val) => {
              if (typeof val === 'string' && val) onSelectTechId(val)
            }}
            itemToStringLabel={(techId) => {
              const tech = technicians.find((t) => t.id === techId)
              return tech ? tech.name : ''
            }}
          >
            <ComboboxInput
              className="w-65 h-8 text-xs bg-background"
              placeholder="Zoek technicus..."
            />
            <ComboboxContent
              className="w-65"
              container={sheetContentRef}
            >
              <ComboboxList>
                {recommendedTech && (
                  <ComboboxGroup>
                    <ComboboxLabel>Aanbevolen</ComboboxLabel>
                    <ComboboxItem value={recommendedTech.id} className="text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{recommendedTech.name}</span>
                        <span className="text-[10px] text-muted-foreground">{recommendedTech.title}</span>
                      </div>
                    </ComboboxItem>
                  </ComboboxGroup>
                )}
                {otherTechs.length > 0 && (
                  <ComboboxGroup>
                    <ComboboxLabel>Overige technici</ComboboxLabel>
                    {otherTechs.map((tech) => (
                      <ComboboxItem key={tech.id} value={tech.id} className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{tech.name}</span>
                          <span className="text-[10px] text-muted-foreground">{tech.title}</span>
                        </div>
                      </ComboboxItem>
                    ))}
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="flex items-center gap-1 border border-border rounded-lg bg-background p-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onNavigateWeek(-1)}
            className="size-7"
          >
            <ChevronLeft className="size-3.5" />
          </Button>

          <Popover open={isCalendarPickerOpen} onOpenChange={onCalendarPickerOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-medium px-2 whitespace-nowrap gap-1.5"
              >
                <CalendarIcon className="size-3.5 text-muted-foreground" />
                Week {weekDays[0]?.dayLabel} - {weekDays[4]?.dayLabel} {currentYear}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-popover" align="center">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-border">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => {
                      const prev = new Date(pickerMonth)
                      prev.setMonth(prev.getMonth() - 1)
                      onChangePickerMonth(prev)
                    }}
                  >
                    <ChevronLeft className="size-3" />
                  </Button>
                  <span className="text-xs font-semibold">
                    {pickerMonth.toLocaleString('nl-BE', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => {
                      const next = new Date(pickerMonth)
                      next.setMonth(next.getMonth() + 1)
                      onChangePickerMonth(next)
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
                      onClick={() => onSelectCalendarDate(item.date)}
                      className={`size-7 text-[11px] rounded flex items-center justify-center transition-colors ${item.isCurrentWeek
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
            size="icon-sm"
            variant="ghost"
            onClick={() => onNavigateWeek(1)}
            className="size-7"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </SheetHeader>
  )
}

