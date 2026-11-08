import type { ClientInspectionHistoryItem } from '#/features/clients/types'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import { CheckCircle2, FileCheck, FileText, UserCheck, Calendar, Wrench } from 'lucide-react'

interface SiteInspectionHistoryProps {
  workOrders: ClientInspectionHistoryItem[]
}

export function SiteInspectionHistory({ workOrders }: SiteInspectionHistoryProps) {
  if (workOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
        <FileText className="size-8 stroke-[1.5] text-muted-foreground/60 mb-2" />
        <p className="text-sm font-medium">Nog geen keuringshistoriek</p>
        <p className="text-xs text-muted-foreground">
          Er zijn nog geen geregistreerde werkbonnen of voltooide inspecties voor deze site.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {workOrders.map((wo) => {
        const isCompleted = wo.status === 'COMPLETED'
        const dateStr = wo.completedAt || wo.plannedDate || 'Onbekend'

        return (
          <div
            key={wo.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-border/80"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">
                  {wo.woNumber}
                </span>

                <span className="text-muted-foreground/40 text-xs">•</span>

                <span className="text-xs text-muted-foreground font-medium">
                  {wo.kind === 'MAINTENANCE' ? 'Periodiek Onderhoud' : 'Interventie / Herstelling'}
                </span>

                {isCompleted ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] flex items-center gap-1 font-medium"
                  >
                    <CheckCircle2 className="size-3" />
                    Voltooid
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-[10px]">
                    {wo.status}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground/70" />
                  <span>Uitgevoerd op: {dateStr}</span>
                </div>

                <span className="text-muted-foreground/40">•</span>

                <span>
                  Technicus: <strong className="font-medium text-foreground">{wo.technicianName || 'Tom De Coninck'}</strong>
                </span>

                {wo.isSigned && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <UserCheck className="size-3.5" />
                      <span>Ondertekend door: {wo.signedByName || 'Klant'}</span>
                    </div>
                  </>
                )}
              </div>

              {wo.description && (
                <p className="text-xs text-muted-foreground/90 line-clamp-2 italic">
                  &ldquo;{wo.description}&rdquo;
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {wo.certificateDocument ? (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                >
                  <a
                    href={wo.certificateDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileCheck className="size-3.5" />
                    <span>Attest NBN S21-100</span>
                  </a>
                </Button>
              ) : (
                <div className="text-[11px] text-muted-foreground/60 italic flex items-center gap-1">
                  <Wrench className="size-3" />
                  <span>Standaard werkbon</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
