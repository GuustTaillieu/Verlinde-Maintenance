import { Badge } from '#/features/shared/components/ui/badge'
import { Mail, CheckCircle } from 'lucide-react'
import type { FireTodoItem } from '../../types'

interface AppointmentMailPreviewProps {
  item: FireTodoItem
  proposedDate: string
  startTime: string
  endTime: string
}

function formatDateFormatted(isoStr: string): string {
  if (!isoStr) return ''
  const [y, m, d] = isoStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function AppointmentMailPreview({
  item,
  proposedDate,
  startTime,
  endTime,
}: AppointmentMailPreviewProps) {
  const formattedDate = formatDateFormatted(proposedDate)

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Mail className="size-3.5 text-primary" />
          <span>E-mail Bevestigingsvoorstel</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
          Live Preview
        </Badge>
      </div>

      <div className="p-4 flex-1 space-y-3 text-xs overflow-y-auto">
        <div className="space-y-1 font-mono text-[11px] pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16">Aan:</span>
            <span className="font-semibold text-foreground">dispatch@brandtec.be</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16">CC:</span>
            <span className="text-foreground">{item.customerEmail || 'klant@mail.be'} ({item.customerName})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16">Onderwerp:</span>
            <span className="text-foreground font-semibold">
              Afspraakvoorstel jaarlijks nazicht branddetectie #{item.sheetNumber} — {item.siteName}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-foreground text-xs leading-relaxed font-sans pt-1">
          <p>Beste planningsteam en {item.customerName},</p>
          <p>
            In het kader van het wettelijk verplichte jaarlijkse onderhoud van de branddetectie-installatie stelt Verlinde Beveiliging voor om de keuring voor de installatie <strong>{item.siteName}</strong> in te plannen op:
          </p>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1 font-mono">
            <div className="text-xs font-semibold text-primary capitalize">
              {formattedDate}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Tijdvenster: <strong>{startTime} – {endTime}</strong>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Locatie: {item.siteAddress}, {item.siteCity}
            </div>
          </div>

          <p>
            Onderaannemer <strong>Brandtec BV</strong> zal deze keuring ter plaatse uitvoeren conform de geldende NBN S21-normen. Na afronding wordt het officiële keuringsattest direct opgeladen in het beheerportaal.
          </p>

          <p className="text-muted-foreground pt-1">
            Gelieve op dit bericht te antwoorden ter bevestiging van het voorgestelde tijdstip.
          </p>

          <div className="pt-3 text-[11px] text-muted-foreground">
            Met vriendelijke groeten,<br />
            <strong>Dirk Verlinde</strong><br />
            Verlinde Beveiliging BV • Zwevegem
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-muted/20 border-t border-border flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
        <CheckCircle className="size-3 text-emerald-500" />
        <span>Na verzenden wordt de status in het cockpitoverzicht direct bijgewerkt naar &quot;In afwachting van bevestiging&quot;.</span>
      </div>
    </div>
  )
}

