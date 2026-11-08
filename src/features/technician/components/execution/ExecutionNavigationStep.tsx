import { useState } from 'react'
import { Button } from '#/features/shared/components/ui/button'
import {
  Navigation,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  FileText,
  Clock,
  MapPin,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'
import type { TechnicianWorkOrder } from '../../types'

interface ExecutionNavigationStepProps {
  workOrder: TechnicianWorkOrder
  onNextStep: () => void
}

export function ExecutionNavigationStep({
  workOrder,
  onNextStep,
}: ExecutionNavigationStepProps) {
  const [isAlarmRevealed, setIsAlarmRevealed] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${workOrder.siteAddress}, ${workOrder.siteCity}`
  )}`

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-4 pt-1">
      {/* 1. Quick Navigation & Contact Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          asChild
          variant="default"
          className="h-10 text-xs font-semibold gap-2 justify-start shadow-2xs"
        >
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <Navigation className="size-4 shrink-0" />
            <div className="text-left truncate">
              <div>Navigeer via Google Maps</div>
              <div className="text-[10px] font-normal opacity-85 truncate">
                {workOrder.siteAddress}, {workOrder.siteCity}
              </div>
            </div>
          </a>
        </Button>

        {workOrder.customerPhone ? (
          <Button
            asChild
            variant="outline"
            className="h-10 text-xs font-semibold gap-2 justify-start border-border bg-background"
          >
            <a href={`tel:${workOrder.customerPhone}`}>
              <Phone className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-left truncate">
                <div>Klant Bellen</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {workOrder.customerPhone} ({workOrder.customerName})
                </div>
              </div>
            </a>
          </Button>
        ) : workOrder.customerEmail ? (
          <Button
            asChild
            variant="outline"
            className="h-10 text-xs font-semibold gap-2 justify-start border-border bg-background"
          >
            <a href={`mailto:${workOrder.customerEmail}`}>
              <Mail className="size-4 text-blue-500 shrink-0" />
              <div className="text-left truncate">
                <div>E-mail Sturen</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {workOrder.customerEmail}
                </div>
              </div>
            </a>
          </Button>
        ) : (
          <div className="h-10 px-3 rounded-lg border border-border bg-muted/20 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="size-4 shrink-0 text-muted-foreground" />
            <span>Geen rechtstreeks telefoonnummer</span>
          </div>
        )}
      </div>

      {/* 2. Site Address & Time Window */}
      <div className="p-3 rounded-xl bg-muted/25 border border-border space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-foreground">{workOrder.siteName}</div>
            <div className="text-muted-foreground">
              {workOrder.siteAddress}, {workOrder.siteCity}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-muted-foreground">
          <Clock className="size-3.5 text-primary shrink-0" />
          <span>
            Gepland venster: <strong className="text-foreground">{workOrder.startTime} – {workOrder.endTime}</strong> (~{workOrder.durationHours}u)
          </span>
        </div>
      </div>

      {/* 3. Zero-Trust Confidential Access Code (Keypad / Gate) */}
      {workOrder.accessNotesConfidential && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Lock className="size-3.5 text-amber-600 dark:text-amber-400" />
              Vertrouwelijke Toegangscode (Zero-Trust)
            </span>
            <div className="flex items-center gap-1">
              {isAlarmRevealed && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyCode(workOrder.accessNotesConfidential || '')}
                  className="h-6 px-2 text-[11px] gap-1"
                >
                  {copiedCode ? (
                    <>
                      <Check className="size-3 text-emerald-500" />
                      Gekopieerd
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      Kopieer
                    </>
                  )}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsAlarmRevealed(!isAlarmRevealed)}
                className="h-6 px-2 text-[11px]"
              >
                {isAlarmRevealed ? (
                  <>
                    <EyeOff className="size-3 mr-1" />
                    Verberg
                  </>
                ) : (
                  <>
                    <Eye className="size-3 mr-1" />
                    Toon code
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="font-mono text-xs text-foreground bg-background p-2.5 rounded-lg border border-border select-all flex items-center justify-between">
            <span>
              {isAlarmRevealed
                ? workOrder.accessNotesConfidential
                : '••••••••••••••••'}
            </span>
            {!isAlarmRevealed && (
              <span className="text-[10px] text-muted-foreground font-sans">
                (Klik op Toon code)
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. Office Dispatch Notes */}
      {workOrder.officeNotes && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1">
            <FileText className="size-3.5 text-muted-foreground" />
            Kantoorinstructies & Opmerkingen Dispatch:
          </span>
          <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border">
            {workOrder.officeNotes}
          </p>
        </div>
      )}

      {/* Advance Button to Step 2 */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={onNextStep}
          className="w-full text-xs h-9 gap-1.5"
        >
          <span>Aangekomen op werf → Start Uitvoering</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
