import { Input } from '#/features/shared/components/ui/input'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import {
  Mail,
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
} from 'lucide-react'
import { useProposeAppointment } from '../ProposeAppointmentDialog'
import { formatDateDutch } from '../../utils/dateUtils'
import { RichEmailEditor } from '../../../shared/components/email-editor'
import type { FireInspectionItem } from '../../types'

interface AppointmentMailPreviewProps {
  item?: FireInspectionItem
  proposedDate?: string
  startTime?: string
  endTime?: string
}

export function AppointmentMailPreview({
  item: propItem,
  proposedDate: propProposedDate,
  startTime: propStartTime,
  endTime: propEndTime,
}: AppointmentMailPreviewProps = {}) {
  const context = useProposeAppointment()

  const item = propItem || context.item
  const proposedDate = propProposedDate || context.proposedDate
  const startTime = propStartTime || context.startTime
  const endTime = propEndTime || context.endTime

  const {
    toEmail,
    setToEmail,
    ccEmail,
    setCcEmail,
    subject,
    setSubject,
    body,
    setBody,
    activeTemplate,
    applyTemplate,
  } = context

  const formattedDate = formatDateDutch(proposedDate)

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden">
      {/* Email Header Fields */}
      <div className="p-4 border-b border-border space-y-3 bg-muted/15 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">
              Voorstel Branddetectie Keuring
            </span>
            <Badge variant="outline" className="text-[10px] font-normal">
              Fiche #{item.sheetNumber}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <ShieldCheck className="size-3.5 text-red-500" />
            <span>Brandtec BV (NBN S 21-100 Partner)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 shrink-0 font-medium">Aan:</span>
            <Input
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="dispatch@brandtec.be"
              className="h-8 text-xs bg-background"
            />
          </div>


          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 shrink-0 font-medium">CC:</span>
            <Input
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
              placeholder="klant@bedrijf.be"
              className="h-8 text-xs bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 shrink-0 font-medium">Onderwerp:</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-8 text-xs bg-background font-medium"
            />
          </div>
        </div>
      </div>

      {/* Quick Templates Toolbar */}
      <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center justify-between shrink-0 gap-2">
        <span className="text-[11px] text-muted-foreground font-medium">E-mailsjabloon:</span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={activeTemplate === 'standard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyTemplate('standard')}
            className="h-6.5 text-[10px] px-2 font-medium"
          >
            Standaard
          </Button>
          <Button
            type="button"
            variant={activeTemplate === 'concise' ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyTemplate('concise')}
            className="h-6.5 text-[10px] px-2 font-medium"
          >
            Kort
          </Button>
          <Button
            type="button"
            variant={activeTemplate === 'urgent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyTemplate('urgent')}
            className="h-6.5 text-[10px] px-2 font-medium text-amber-600 dark:text-amber-400"
          >
            Dringend
          </Button>
          <Button
            type="button"
            variant={activeTemplate === 'blank' ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyTemplate('blank')}
            className="h-6.5 text-[10px] px-2 font-medium text-muted-foreground hover:text-foreground"
          >
            Leeg
          </Button>
        </div>
      </div>

      {/* Visual Rich Text Editor & Slot Summary */}
      <div className="flex-1 min-h-0 flex flex-col p-4 gap-4 overflow-y-auto">
        <RichEmailEditor
          value={body}
          onChange={setBody}
          placeholder="Typ hier het bericht voor de klant..."
          className="flex-1 min-h-56"
        />

        {/* Bottom Card: Reserved Slot Summary */}
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3.5 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold text-primary">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              Gereserveerd tijdslot voor keuring
            </span>
            <span className="text-[11px] font-normal text-muted-foreground">
              Wordt als &apos;Gereserveerd&apos; vastgelegd bij Brandtec
            </span>

          </div>


          <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 text-xs space-y-1 shadow-2xs">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5 truncate">
                <Building2 className="size-3.5 text-primary shrink-0" />
                <span className="truncate">{item.siteName}</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                Fiche #{item.sheetNumber}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">
                {item.siteAddress}, {item.siteCity}
              </span>
            </div>
            <div className="text-[11px] font-mono font-medium text-foreground/90 pt-1 border-t border-border/50 flex items-center justify-between">
              <span>{formattedDate}</span>
              <span className="text-primary font-bold">
                {startTime} – {endTime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
