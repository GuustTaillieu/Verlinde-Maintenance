import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#/features/shared/components/ui/dialog'
import { Button } from '#/features/shared/components/ui/button'
import { Mail, Send, Loader2, MapPin, Building2, Phone } from 'lucide-react'
import { DateTimePicker } from './propose/DateTimePicker'
import { AppointmentMailPreview } from './propose/AppointmentMailPreview'
import type { FireInspectionItem, ProposeFireAppointmentInput } from '../types'

interface ProposeAppointmentContextValue {
  item: FireInspectionItem
  proposedDate: string
  setProposedDate: (date: string) => void
  startTime: string
  endTime: string
  handleSelectTimeSlot: (start: string, end: string) => void
  isSubmitting: boolean
  onSend: () => Promise<void>
  onClose: () => void
}

const ProposeAppointmentContext = React.createContext<ProposeAppointmentContextValue | null>(null)

export function useProposeAppointment() {
  const context = React.useContext(ProposeAppointmentContext)
  if (!context) {
    throw new Error('useProposeAppointment must be used within ProposeAppointmentDialog')
  }
  return context
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

export function ProposeSiteSummary() {
  const { item } = useProposeAppointment()

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between font-medium">
        <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
          <Building2 className="size-3.5 text-primary" />
          {item.siteName}
        </span>
        <span className="text-[11px] font-mono text-muted-foreground">
          {item.sheetNumber}
        </span>
      </div>

      <div className="text-muted-foreground flex items-center gap-1.5">
        <MapPin className="size-3 text-muted-foreground shrink-0" />
        <span>
          {item.siteAddress}, {item.siteCity}
        </span>
      </div>

      <div className="border-t border-border/60 pt-2 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        <div>
          Klant: <strong className="text-foreground">{item.customerName}</strong>
        </div>
        {item.customerPhone && (
          <div className="flex items-center gap-1">
            <Phone className="size-3 text-muted-foreground" />
            <span>{item.customerPhone}</span>
          </div>
        )}
        {item.customerEmail && (
          <div className="flex items-center gap-1">
            <Mail className="size-3 text-muted-foreground" />
            <span>{item.customerEmail}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function ProposeDialogHeader() {
  return (
    <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
      <DialogTitle className="text-base font-semibold flex items-center gap-2">
        <Mail className="size-4 text-primary" />
        Afspraakvoorstel Branddetectie (Brandtec BV)
      </DialogTitle>
      <DialogDescription className="text-xs">
        Kies een datum in de nabije toekomst en een tijdvenster voor de wettelijke keuring.
      </DialogDescription>
    </DialogHeader>
  )
}

export function ProposeDialogFooter() {
  const { proposedDate, startTime, endTime, isSubmitting, onSend, onClose } =
    useProposeAppointment()

  return (
    <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 flex sm:flex-row items-center justify-between shrink-0">
      <div className="text-xs text-muted-foreground">
        Voorgesteld voor <strong>{proposedDate}</strong> ({startTime} - {endTime}).
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
          className="text-xs h-8"
        >
          Annuleren
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSend}
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
    </DialogFooter>
  )
}

export function ProposeDialogBody() {
  const { item, proposedDate, setProposedDate, startTime, endTime, handleSelectTimeSlot } =
    useProposeAppointment()

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <ProposeSiteSummary />

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

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Mail className="size-3.5 text-muted-foreground" />
            E-mail Preview (Automatische notificatie naar Brandtec)
          </h4>
          <AppointmentMailPreview
            item={item}
            proposedDate={proposedDate}
            startTime={startTime}
            endTime={endTime}
          />
        </div>
      </div>
    </div>
  )
}

export interface ProposeAppointmentDialogProps {
  item: FireInspectionItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: ProposeFireAppointmentInput) => Promise<void>
  children?: React.ReactNode
}

export function ProposeAppointmentDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
  children,
}: ProposeAppointmentDialogProps) {
  const [proposedDate, setProposedDate] = React.useState<string>(() =>
    getRecommendedFutureDate()
  )
  const [startTime, setStartTime] = React.useState('09:00')
  const [endTime, setEndTime] = React.useState('11:00')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open && item) {
      if (item.proposedDate) {
        setProposedDate(item.proposedDate)
      } else {
        setProposedDate(getRecommendedFutureDate())
      }
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

  const contextValue: ProposeAppointmentContextValue = {
    item,
    proposedDate,
    setProposedDate,
    startTime,
    endTime,
    handleSelectTimeSlot,
    isSubmitting,
    onSend: handleSend,
    onClose: () => onOpenChange(false),
  }

  return (
    <ProposeAppointmentContext.Provider value={contextValue}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl! w-full max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
          {children || (
            <>
              <ProposeDialogHeader />
              <ProposeDialogBody />
              <ProposeDialogFooter />
            </>
          )}
        </DialogContent>
      </Dialog>
    </ProposeAppointmentContext.Provider>
  )
}

// Compound component attachments
ProposeAppointmentDialog.Header = ProposeDialogHeader
ProposeAppointmentDialog.Body = ProposeDialogBody
ProposeAppointmentDialog.SiteSummary = ProposeSiteSummary
ProposeAppointmentDialog.Footer = ProposeDialogFooter

