import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '#/features/shared/components/ui/sheet'
import { Button } from '#/features/shared/components/ui/button'
import { Mail, Send, Loader2, MapPin, Building2, Phone } from 'lucide-react'
import { DateTimePicker } from './propose/DateTimePicker'
import { AppointmentMailPreview } from './propose/AppointmentMailPreview'
import type { FireTodoItem } from '../types'

interface ProposeAppointmentSheetProps {
  item: FireTodoItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: {
    siteId: string
    customerId: string
    proposedDate: string
    startTime?: string
    endTime?: string
  }) => Promise<void>
}

function getRecommendedFutureDate(): string {
  const now = new Date()
  const target = new Date(now)
  target.setDate(target.getDate() + 5)
  if (target.getDay() === 6) target.setDate(target.getDate() + 2)
  if (target.getDay() === 0) target.setDate(target.getDate() + 1)
  const y = target.getFullYear()
  const m = String(target.getMonth() + 1).padStart(2, '0')
  const d = String(target.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function ProposeAppointmentSheet({
  item,
  open,
  onOpenChange,
  onConfirm,
}: ProposeAppointmentSheetProps) {
  const [proposedDate, setProposedDate] = useState(() => getRecommendedFutureDate())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setProposedDate(getRecommendedFutureDate())
      setStartTime('09:00')
      setEndTime('11:00')
    }
  }, [open, item])

  if (!item) return null

  const handleSend = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm({
        siteId: item.siteId,
        customerId: item.customerId,
        proposedDate,
        startTime,
        endTime,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectTimeSlot = (newStart: string, newEnd: string) => {
    setStartTime(newStart)
    setEndTime(newEnd)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-4xl! w-full flex flex-col p-0 overflow-hidden bg-background"
      >
        <SheetHeader className="px-6 py-4 border-b border-border bg-muted/20 shrink-0">
          <SheetTitle className="text-base font-semibold flex items-center gap-2">
            <Mail className="size-4 text-foreground" />
            Afspraakvoorstel Branddetectie (Brandtec BV)
          </SheetTitle>
          <SheetDescription className="text-xs">
            Kies een datum in de nabije toekomst en een tijdvenster voor de wettelijke keuring.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary" />
                    {item.siteName}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    #{item.sheetNumber}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3 text-muted-foreground shrink-0" />
                  <span>{item.siteAddress}, {item.siteCity}</span>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{item.customerName}</span>
                  {item.customerPhone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="size-3 text-muted-foreground" />
                      {item.customerPhone}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2">
                  Voorgestelde Keuringsdatum & Uur
                </h4>
                <DateTimePicker
                  selectedDate={proposedDate}
                  onSelectDate={setProposedDate}
                  startTime={startTime}
                  endTime={endTime}
                  onSelectTimeSlot={handleSelectTimeSlot}
                />
              </div>
            </div>

            <div className="h-full">
              <AppointmentMailPreview
                item={item}
                proposedDate={proposedDate}
                startTime={startTime}
                endTime={endTime}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <div className="text-xs text-muted-foreground">
            Voorgesteld voor <strong>{proposedDate}</strong> ({startTime} - {endTime}).
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs h-8"
            >
              Annuleren
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={isSubmitting || !proposedDate}
              className="text-xs h-8 gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Voorstel Verzenden naar Brandtec
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
