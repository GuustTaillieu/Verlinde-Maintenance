import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/features/shared/components/ui/dialog'
import { TechnicianCombobox } from '#/features/shared/components/TechnicianCombobox'
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
import { useClusterDispatch } from './ClusterDispatchContext'

export function DispatchHeader({
  sheetContentRef: _sheetContentRef,
}: {
  sheetContentRef?: React.RefObject<HTMLDivElement | null>
} = {}) {
  const { cluster, planner, step } = useClusterDispatch()
  const { city } = cluster
  const {
    selectedTechId,
    setSelectedTechId,
    recommendedTech,
    weekDays,
    currentMonday,
    handleNavigateWeek,
    isCalendarPickerOpen,
    setIsCalendarPickerOpen,
    pickerMonth,
    setPickerMonth,
    calendarDays,
    handleSelectCalendarDate,
  } = planner

  const currentYear = currentMonday.getFullYear()

  return (
    <DialogHeader className="-mx-4 -mt-4 bg-muted/20 border-b border-border/80 px-6 py-3 flex flex-row items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="hidden xl:flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          <CalendarCheck className="size-4.5" />
        </div>
        <div>
          <DialogTitle className="text-base font-semibold tracking-tight">
            {step === 'EMAILS'
              ? `Voorstel E-mails Nakijken: Regio ${city}`
              : `Batch Dispatching: Regio ${city}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            {step === 'EMAILS'
              ? 'Controleer of bewerk de gegenereerde e-mails per klant alvorens de voorstellen te verzenden.'
              : 'Bekijk direct de bezetting van de technicus en zie hoe de geselecteerde werven in het dagschema passen.'}
          </DialogDescription>
        </div>
      </div>

      {step === 'EMAILS' ? (
        <div className="flex items-center gap-3 text-xs bg-background/80 border border-border px-3 py-1.5 rounded-lg shadow-2xs">
          <div>
            Technicus: <strong className="text-foreground">{planner.activeTech.name}</strong>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="text-muted-foreground">
            Week van {weekDays[0]?.dayLabel}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-end xl:flex-row xl:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Technicus:
            </span>
            <TechnicianCombobox
              technicians={planner.technicians}
              value={selectedTechId}
              onValueChange={setSelectedTechId}
              recommendedTechId={recommendedTech?.id}
              className="w-56"
              align="end"
            />
          </div>

          <div className="flex items-center gap-1 border border-border rounded-lg bg-background p-1">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => handleNavigateWeek(-1)}
              className="size-7"
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            <Popover open={isCalendarPickerOpen} onOpenChange={setIsCalendarPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-xs font-medium px-2 whitespace-nowrap gap-1.5 ${planner.isPastWeek ? 'text-amber-600 dark:text-amber-400' : ''}`}
                >
                  <CalendarIcon className="size-3.5 text-muted-foreground" />
                  Week {weekDays[0]?.dayLabel} - {weekDays[4]?.dayLabel} {currentYear}
                  {planner.isPastWeek && ' (Verleden)'}
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
                        setPickerMonth(prev)
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
                        onClick={() => handleSelectCalendarDate(item.date)}
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
              onClick={() => handleNavigateWeek(1)}
              className="size-7"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </DialogHeader>
  )
}
