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
import { Mail, Send, Loader2, MapPin, Building2, Phone, Contact, Clock } from 'lucide-react'
import { DateTimePicker } from './propose/DateTimePicker'
import { AppointmentMailPreview } from './propose/AppointmentMailPreview'
import { DISCIPLINE, type FireInspectionItem, type ProposeFireAppointmentInput } from '../types'
import { TimePicker } from './propose/TimePicker'

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
  const target = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  if (target.getDay() === 6) target.setDate(target.getDate() + 2)
  if (target.getDay() === 0) target.setDate(target.getDate() + 1)
  const y = target.getFullYear()
  const m = String(target.getMonth() + 1).padStart(2, '0')
  const d = String(target.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function ProposeSiteSummary() {
  const { item } = useProposeAppointment()
  const isFire = item.primaryDiscipline === DISCIPLINE.FIRE

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3 text-xs">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
        {/* Customer Contact */}
        <div className="space-y-1 bg-background/50 rounded-lg p-2 border border-border/40">
          <div className="text-[11px] font-semibold text-foreground">
            Klantcontact: {item.customerName}
          </div>
          {item.customerPhone ? (
            <a
              href={`tel:${item.customerPhone}`}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 hover:underline"
            >
              <Phone className="size-3 text-primary shrink-0" />
              <span>{item.customerPhone} (Bellen)</span>
            </a>
          ) : (
            <div className="text-[11px] text-muted-foreground">Geen telefoonnummer</div>
          )}
          {item.customerEmail ? (
            <a
              href={`mailto:${item.customerEmail}`}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 hover:underline truncate"
            >
              <Mail className="size-3 text-primary shrink-0" />
              <span className="truncate">{item.customerEmail}</span>
            </a>
          ) : (
            <div className="text-[11px] text-muted-foreground">Geen e-mailadres</div>
          )}
        </div>

        {/* Subcontractor or Technician Contact */}
        <div className="space-y-1 bg-background/50 rounded-lg p-2 border border-border/40">
          <div className="text-[11px] font-semibold text-foreground">
            {isFire ? 'Keuringsinstantie: Brandtec BV' : 'Uitvoerder: Verlinde Beveiliging'}
          </div>
          <a
            href={isFire ? 'tel:056224488' : 'tel:056778899'}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 hover:underline"
          >
            <Phone className="size-3 text-primary shrink-0" />
            <span>{isFire ? '056 22 44 88 (Brandtec Planning)' : '056 77 88 99 (Dispatch)'}</span>
          </a>
          <a
            href={isFire ? 'mailto:planning@brandtec.be' : 'mailto:planning@verlinde-beveiliging.be'}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 hover:underline truncate"
          >
            <Mail className="size-3 text-primary shrink-0" />
            <span className="truncate">{isFire ? 'planning@brandtec.be' : 'planning@verlinde-beveiliging.be'}</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export function ProposeDialogHeader() {
  const { item } = useProposeAppointment()
  const isFire = item.primaryDiscipline === 'FIRE'

  return (
    <DialogHeader className="-mx-4 -mt-4 px-8 py-3 bg-muted/20 border-b border-border/80 shrink-0">
      <DialogTitle className="text-base font-semibold flex items-center gap-2">
        <Mail className="size-4 text-primary" />
        {isFire
          ? 'Afspraakvoorstel Branddetectie'
          : 'Afspraakvoorstel Periodiek Onderhoud'}
      </DialogTitle>
      <DialogDescription className="text-xs">
        {isFire
          ? 'Kies een datum in de nabije toekomst en een tijdvenster voor de wettelijke keuring.'
          : 'Kies een datum en tijdvenster om te reserveren in de planning en voor te stellen aan de klant.'}
      </DialogDescription>
    </DialogHeader>
  )
}

export function ProposeDialogFooter() {
  const { proposedDate, isSubmitting, onSend, onClose } = useProposeAppointment()

  return (
    <DialogFooter className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
      <div className="text-xs text-muted-foreground hidden md:block">
        Na verzending wordt de afspraak verplaatst naar{' '}
        <strong className="text-foreground">In Afwachting</strong> totdat de klant of partner bevestigt.
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
          Voorstel Verzenden
        </Button>
      </div>
    </DialogFooter>
  )
}

export function ProposeDialogBody() {
  const { item, proposedDate, setProposedDate, startTime, endTime, handleSelectTimeSlot } =
    useProposeAppointment()

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row gap-8">
      <div className="flex flex-col md:flex-row xl:flex-col gap-8">
        <div className="space-y-4 max-w-xl">
          <h4 className="text-xs font-semibold text-foreground mb-2">
            Voorgestelde Keuringsdatum & Uur
          </h4>
          <DateTimePicker
            selectedDate={proposedDate}
            onSelectDate={setProposedDate}
          />
        </div>

        <div className="space-y-4 flex-1">
          <h4 className="text-xs font-medium flex items-center gap-1.5 text-foreground">
            <Clock className="size-3.5 text-muted-foreground" />
            Kies Tijdvenster
          </h4>
          <TimePicker
            startTime={startTime}
            endTime={endTime}
            onSelectTimeSlot={handleSelectTimeSlot}
          />
        </div>
      </div>

      <div className='space-y-4'>
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2">Locatie & Contact</h4>
          <ProposeSiteSummary />
        </div>

        <h4 className="text-xs font-semibold text-foreground mb-2">E-mail Preview</h4>
        <AppointmentMailPreview
          item={item}
          proposedDate={proposedDate}
          startTime={startTime}
          endTime={endTime}
        />
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
        <DialogContent className="max-w-[96vw]! max-h-[96vh]! h-full w-max flex flex-col max-sm:p-2 max-sm:max-w-screen! max-sm:h-screen! gap-0">
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

