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
import { Mail, Send, Loader2, MapPin, Building2, Phone, Clock } from 'lucide-react'
import { DateTimePicker } from './propose/DateTimePicker'
import { AppointmentMailPreview } from './propose/AppointmentMailPreview'
import { TimePicker } from './propose/TimePicker'
import { DISCIPLINE, type FireInspectionItem, type ProposeFireAppointmentInput } from '../types'
import { getRecommendedFutureDate } from '../utils/dateUtils'
import { generateFireInspectionEmailHtml, type EmailTemplateType } from '../utils/emailTemplateUtils'
import { VERLINDE_COMPANY, BRANDTEC_PARTNER } from '../utils/constants'



export interface ProposeAppointmentContextValue {
  item: FireInspectionItem
  proposedDate: string
  setProposedDate: (date: string) => void
  startTime: string
  endTime: string
  handleSelectTimeSlot: (start: string, end: string) => void
  toEmail: string
  setToEmail: (val: string) => void
  ccEmail: string
  setCcEmail: (val: string) => void
  subject: string
  setSubject: (val: string) => void
  body: string
  setBody: (val: string) => void
  activeTemplate: EmailTemplateType
  setActiveTemplate: (t: EmailTemplateType) => void
  applyTemplate: (t: EmailTemplateType) => void
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

export function ProposeSiteSummary() {
  const { item } = useProposeAppointment()
  const isFire = item.primaryDiscipline === DISCIPLINE.FIRE

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3 text-xs shadow-2xs">
      <div className="flex items-center justify-between font-medium">
        <span className="font-semibold text-foreground text-sm flex items-center gap-1.5 truncate">
          <Building2 className="size-3.5 text-primary shrink-0" />
          <span className="truncate">{item.siteName}</span>
        </span>
        <span className="text-[11px] font-mono text-muted-foreground shrink-0">
          Fiche #{item.sheetNumber}
        </span>
      </div>

      <div className="text-muted-foreground flex items-center gap-1.5 truncate">
        <MapPin className="size-3 text-muted-foreground shrink-0" />
        <span className="truncate">
          {item.siteAddress}, {item.siteCity}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/60">
        {/* Customer Contact */}
        <div className="space-y-1 bg-muted/40 rounded-lg p-2.5 border border-border/40">
          <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
            <span>Klant: {item.customerName}</span>
            <span className="text-[10px] font-normal text-muted-foreground">Klantcontact</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            {item.customerPhone ? (
              <a
                href={`tel:${item.customerPhone}`}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline"
              >
                <Phone className="size-3 text-primary shrink-0" />
                <span>{item.customerPhone}</span>
              </a>
            ) : (
              <span className="text-[11px] text-muted-foreground">Geen telefoon</span>
            )}
            {item.customerEmail ? (
              <a
                href={`mailto:${item.customerEmail}`}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline truncate"
              >
                <Mail className="size-3 text-primary shrink-0" />
                <span className="truncate">{item.customerEmail}</span>
              </a>
            ) : (
              <span className="text-[11px] text-muted-foreground">Geen e-mail</span>
            )}
          </div>
        </div>

        {/* Subcontractor or Technician Contact */}
        <div className="space-y-1 bg-muted/40 rounded-lg p-2.5 border border-border/40">
          <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
            <span>{isFire ? BRANDTEC_PARTNER.name : VERLINDE_COMPANY.name}</span>
            <span className="text-[10px] font-normal text-muted-foreground">
              {isFire ? 'Onderaannemer Branddetectie' : 'Planning'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            <a
              href={isFire ? `tel:${BRANDTEC_PARTNER.phone}` : `tel:${VERLINDE_COMPANY.dispatchPhone}`}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline"
            >
              <Phone className="size-3 text-primary shrink-0" />
              <span>{isFire ? `${BRANDTEC_PARTNER.phone} (Planning)` : VERLINDE_COMPANY.dispatchPhone}</span>
            </a>
            <a
              href={isFire ? `mailto:${BRANDTEC_PARTNER.dispatchEmail}` : `mailto:${VERLINDE_COMPANY.dispatchEmail}`}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline truncate"
            >
              <Mail className="size-3 text-primary shrink-0" />
              <span className="truncate">{isFire ? BRANDTEC_PARTNER.dispatchEmail : VERLINDE_COMPANY.dispatchEmail}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProposeDialogHeader() {
  const { item } = useProposeAppointment()
  const isFire = item.primaryDiscipline === 'FIRE'

  return (
    <DialogHeader className="-mx-4 -mt-4 bg-muted/20 border-b border-border/80 px-6 py-3 flex flex-row items-center justify-between gap-4 shrink-0">
      <div>
        <DialogTitle className="text-base font-semibold flex items-center gap-2">
          <Mail className="size-4 text-primary" />
          {isFire ? 'Afspraakvoorstel Branddetectie' : 'Afspraakvoorstel Periodiek Onderhoud'}
        </DialogTitle>
        <DialogDescription className="text-xs">
          {isFire
            ? 'Kies een datum en tijdvenster voor de keuring door Brandtec BV en pas indien gewenst het e-mailbericht aan.'
            : 'Kies een datum en tijdvenster om voor te stellen aan de klant.'}
        </DialogDescription>
      </div>
    </DialogHeader>
  )
}



export function ProposeDialogFooter() {
  const { proposedDate, isSubmitting, onSend, onClose } = useProposeAppointment()

  return (
    <DialogFooter className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
      <div className="text-xs text-muted-foreground hidden md:block">
        Na verzending worden de afspraken verplaatst naar{' '}
        <strong className="text-foreground">In Afwachting</strong> en blijven ze{' '}
        <strong className="text-foreground">gereserveerd</strong> tot de klant bevestigt.
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
  const { proposedDate, setProposedDate, startTime, endTime, handleSelectTimeSlot } =
    useProposeAppointment()

  return (
    <div className="-mx-4 flex flex-1 min-h-0 divide-x divide-border overflow-hidden">
      {/* Left Column: Location, Contact & Date/Time pickers */}
      <div className="w-[380px] lg:w-[420px] flex flex-col h-full min-h-0 bg-muted/10 shrink-0 overflow-y-auto p-4 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2">Locatie & Contact</h4>
          <ProposeSiteSummary />
        </div>

        <div className="border-t border-border/60 pt-4 space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Voorgestelde Keuringsdatum</h4>
          <DateTimePicker selectedDate={proposedDate} onSelectDate={setProposedDate} />
        </div>

        <div className="border-t border-border/60 pt-4 space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
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

      {/* Right Column: Editable Email Composer */}
      <AppointmentMailPreview />
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

function ProposeAppointmentFormContent({
  item,
  onConfirm,
  onOpenChange,
  children,
}: {
  item: FireInspectionItem
  onConfirm: (payload: ProposeFireAppointmentInput) => Promise<void>
  onOpenChange: (open: boolean) => void
  children?: React.ReactNode
}) {
  const [proposedDate, setProposedDate] = React.useState<string>(
    () => item.proposedDate || getRecommendedFutureDate()
  )
  const [startTime, setStartTime] = React.useState(() => item.plannedStartTime || '09:00')
  const [endTime, setEndTime] = React.useState(() => item.plannedEndTime || '11:00')
  const [toEmail, setToEmail] = React.useState(() =>
    item.primaryDiscipline === 'FIRE'
      ? BRANDTEC_PARTNER.dispatchEmail
      : item.customerEmail || VERLINDE_COMPANY.dispatchEmail
  )

  const [ccEmail, setCcEmail] = React.useState('')
  const [subject, setSubject] = React.useState(
    () => `Afspraakvoorstel jaarlijks nazicht branddetectie #${item.sheetNumber} — ${item.siteName}`
  )
  const [activeTemplate, setActiveTemplate] = React.useState<EmailTemplateType>('concise')
  const [customBody, setCustomBody] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Derived body: if user hasn't typed custom HTML, compute dynamically without any useEffect!
  const body =
    customBody ??
    generateFireInspectionEmailHtml(
      item.customerName,
      item.siteName,
      item.siteAddress,
      item.sheetNumber,
      proposedDate,
      startTime,
      endTime,
      activeTemplate
    )

  const handleApplyTemplate = (template: EmailTemplateType) => {
    setActiveTemplate(template)
    setCustomBody(null)
  }

  const handleUpdateBody = (newBody: string) => {
    setCustomBody(newBody)
  }

  const handleSend = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm({
        siteId: item.siteId,
        customerId: item.customerId,
        proposedDate,
        startTime,
        endTime,
        toEmail,
        ccEmail,
        subject,
        emailBody: body,
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
    toEmail,
    setToEmail,
    ccEmail,
    setCcEmail,
    subject,
    setSubject,
    body,
    setBody: handleUpdateBody,
    activeTemplate,
    setActiveTemplate,
    applyTemplate: handleApplyTemplate,
    isSubmitting,
    onSend: handleSend,
    onClose: () => onOpenChange(false),
  }

  return (
    <ProposeAppointmentContext.Provider value={contextValue}>
      {children || (
        <>
          <ProposeDialogHeader />
          <ProposeDialogBody />
          <ProposeDialogFooter />
        </>
      )}
    </ProposeAppointmentContext.Provider>
  )
}

export function ProposeAppointmentDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
  children,
}: ProposeAppointmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw]! max-h-[96vh]! h-full w-full flex flex-col gap-0 p-4 overflow-hidden bg-background">
        {open && item ? (
          <ProposeAppointmentFormContent
            key={`${item.siteId}_${item.workOrderId || 'new'}`}
            item={item}
            onConfirm={onConfirm}
            onOpenChange={onOpenChange}
          >
            {children}
          </ProposeAppointmentFormContent>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}


// Compound component attachments
ProposeAppointmentDialog.Header = ProposeDialogHeader
ProposeAppointmentDialog.Body = ProposeDialogBody
ProposeAppointmentDialog.SiteSummary = ProposeSiteSummary
ProposeAppointmentDialog.MailPreview = AppointmentMailPreview
ProposeAppointmentDialog.Footer = ProposeDialogFooter
