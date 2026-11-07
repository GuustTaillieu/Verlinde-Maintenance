import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/features/shared/components/ui/dialog'
import {
  Combobox,
  ComboboxTrigger,
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
import { useClusterDispatch } from './ClusterDispatchContext'

export function DispatchHeader({
  sheetContentRef: _sheetContentRef,
}: {
  sheetContentRef?: React.RefObject<HTMLDivElement | null>
} = {}) {
  const { cluster, planner, step } = useClusterDispatch()
  const { city } = cluster
  const {
    technicians,
    selectedTechId,
    setSelectedTechId,
    recommendedTech,
    otherTechs,
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

  const selectedTech = technicians.find((t) => t.id === selectedTechId)

  return (
    <DialogHeader className="bg-muted/20 border-b border-border/80 px-6 py-3 flex flex-row items-center justify-between gap-4 shrink-0">
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
          <Combobox
            value={selectedTechId}
            onValueChange={(val) => {
              if (typeof val === 'string' && val) setSelectedTechId(val)
            }}
          >
            <ComboboxTrigger className="flex h-8 w-56 items-center justify-between gap-2 rounded-lg border border-input bg-background px-2.5 py-1 text-xs hover:bg-muted/50 cursor-pointer shadow-2xs">
              <span className="truncate font-medium text-foreground">
                {selectedTech ? `${selectedTech.name} (${selectedTech.title})` : 'Selecteer technicus...'}
              </span>
            </ComboboxTrigger>
            <ComboboxContent className="w-60" align="end">
              <ComboboxInput
                placeholder="Zoek technicus..."
                className="h-8 text-xs bg-background"
              />
              <ComboboxList>
                {recommendedTech && (
                  <ComboboxGroup>
                    <ComboboxLabel>Aanbevolen voor {city}</ComboboxLabel>
                    <ComboboxItem value={recommendedTech.id} className="text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {recommendedTech.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {recommendedTech.title}
                        </span>
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
                          <span className="font-semibold text-foreground">
                            {tech.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {tech.title}
                          </span>
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
                      className={`size-7 text-[11px] rounded flex items-center justify-center transition-colors ${
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
