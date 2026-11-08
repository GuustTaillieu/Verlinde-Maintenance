import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/features/shared/components/ui/card'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import { maintenanceQueries } from '#/features/maintenance/query'
import { getMonday, formatDateIso } from '#/features/maintenance/utils/dateUtils'
import {
  CalendarCheck,
  MapPin,
  Navigation,
  KeyRound,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'

export const Route = createFileRoute('/_auth/_technician/week-schedule')({
  component: TechnicianSchedulePage,
})

function TechnicianSchedulePage() {
  const { user } = Route.useRouteContext()

  // Track the currently displayed week (Monday as reference)
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()))

  const weekDays = useMemo(() => {
    const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']
    return dayNames.map((name, i) => {
      const d = new Date(currentMonday)
      d.setDate(d.getDate() + i)
      const dateStr = formatDateIso(d)
      return {
        name,
        date: dateStr,
        dayNumber: d.getDate(),
        monthLabel: d.toLocaleString('nl-BE', { month: 'short' }),
        isToday: dateStr === formatDateIso(new Date()),
      }
    })
  }, [currentMonday])

  const todayIso = useMemo(() => formatDateIso(new Date()), [])
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = formatDateIso(new Date())
    const isInWeek = weekDays.some((w) => w.date === today)
    return isInWeek ? today : weekDays[0].date
  })

  const weekStartDate = weekDays[0].date
  const weekEndDate = weekDays[4].date

  const { data: slots = [], isLoading } = useQuery(
    maintenanceQueries.technicianSchedule(user.id, weekStartDate, weekEndDate)
  )

  const selectedDaySlots = useMemo(() => {
    return slots
      .filter((s) => s.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [slots, selectedDate])

  const handlePrevWeek = () => {
    const next = new Date(currentMonday)
    next.setDate(next.getDate() - 7)
    setCurrentMonday(next)
    setSelectedDate(formatDateIso(next))
  }

  const handleNextWeek = () => {
    const next = new Date(currentMonday)
    next.setDate(next.getDate() + 7)
    setCurrentMonday(next)
    setSelectedDate(formatDateIso(next))
  }

  const handleToday = () => {
    const mon = getMonday(new Date())
    setCurrentMonday(mon)
    setSelectedDate(todayIso)
  }

  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({})

  const toggleRevealCode = (slotId: string) => {
    setRevealedCodes((prev) => ({ ...prev, [slotId]: !prev[slotId] }))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheck className="size-5 text-primary" />
            Mijn Dagschema — {user.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user.title || 'Veldtechnicus'} • Code: {user.techCode || 'TECH'}
          </p>
        </div>

        {/* Week navigation buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToday}
            className="h-8 text-xs font-medium"
          >
            Vandaag
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevWeek}
            className="size-8 p-0"
            title="Vorige week"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNextWeek}
            className="size-8 p-0"
            title="Volgende week"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Week Day Switcher (Tabs) */}
      <div className="grid grid-cols-5 gap-2">
        {weekDays.map((day) => {
          const isSelected = selectedDate === day.date
          const countOnDay = slots.filter((s) => s.date === day.date).length

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs'
                  : 'border-border bg-card hover:bg-muted/40 text-foreground'
              }`}
            >
              <span className="text-[11px] font-medium opacity-80">{day.name.slice(0, 2)}</span>
              <span className="text-sm font-bold my-0.5">{day.dayNumber}</span>
              <div className="flex items-center gap-1">
                {countOnDay > 0 ? (
                  <span className="inline-block size-1.5 rounded-full bg-primary" />
                ) : (
                  <span className="text-[10px] text-muted-foreground opacity-60">Vrij</span>
                )}
                {day.isToday && (
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-primary">
                    Nu
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Day Agenda */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>
              Taken voor {new Date(selectedDate).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <Badge variant="secondary" className="text-[11px]">
              {selectedDaySlots.length} {selectedDaySlots.length === 1 ? 'werf' : 'werven'}
            </Badge>
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-28 rounded-xl border border-border bg-card animate-pulse" />
            <div className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          </div>
        ) : selectedDaySlots.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/10 p-8 text-center">
            <CheckCircle2 className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-medium">Geen opdrachten ingepland</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Er zijn momenteel geen werven aan u toegewezen voor deze werkdag.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {selectedDaySlots.map((slot) => {
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${slot.siteAddress}, ${slot.siteCity}`
              )}`
              const isRevealed = Boolean(revealedCodes[slot.id])

              return (
                <Card key={slot.id} className="border-border shadow-xs overflow-hidden">
                  <CardHeader className="p-4 pb-2 bg-muted/20 border-b border-border/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono font-semibold bg-background">
                          <Clock className="size-3 mr-1 text-primary" />
                          {slot.startTime} – {slot.endTime}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          {slot.woNumber}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] self-start sm:self-auto">
                        Duur: ~{slot.durationHours}u
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold mt-2">
                      {slot.siteName}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1.5 text-foreground/80">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span>{slot.siteAddress}, {slot.siteCity}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    {/* Zero-Trust Confidential Access Code Section */}
                    <div className="p-3 rounded-lg border border-border bg-card text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="size-4 text-primary shrink-0" />
                        <div>
                          <div className="font-semibold text-foreground text-[11px]">
                            Vertrouwelijke Toegangscodes (GDPR)
                          </div>
                          {slot.accessNotesConfidential ? (
                            <div className="font-mono text-xs text-foreground mt-0.5">
                              {isRevealed ? (
                                <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                  {slot.accessNotesConfidential}
                                </span>
                              ) : (
                                <span className="tracking-widest text-muted-foreground">••••••••</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Lock className="size-3 text-muted-foreground" />
                              <span>Enkel beschikbaar op uitvoeringsdatum voor toegewezen technicus</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {slot.accessNotesConfidential && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRevealCode(slot.id)}
                          className="h-7 text-xs gap-1.5 self-start sm:self-auto"
                        >
                          {isRevealed ? (
                            <>
                              <EyeOff className="size-3" />
                              Verberg code
                            </>
                          ) : (
                            <>
                              <Eye className="size-3" />
                              Toon alarmcode
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Action Buttons: Navigate GPS & Call */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        asChild
                        className="h-8 text-xs gap-1.5"
                      >
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                          <Navigation className="size-3.5" />
                          Navigeer (GPS)
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
