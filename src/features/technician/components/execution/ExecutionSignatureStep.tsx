import { useState } from 'react'
import { Input } from '#/features/shared/components/ui/input'
import { Button } from '#/features/shared/components/ui/button'
import { SignaturePad } from '../SignaturePad'
import {
  CheckCircle2,
  FileCheck2,
  Download,
  UserCheck,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import type { TechnicianWorkOrder } from '../../types'

interface ExecutionSignatureStepProps {
  workOrder: TechnicianWorkOrder
  onComplete: (signedByName: string, signatureDataUrl?: string) => Promise<void>
  isCompleting: boolean
  isAllChecklistDone: boolean
}

export function ExecutionSignatureStep({
  workOrder,
  onComplete,
  isCompleting,
  isAllChecklistDone,
}: ExecutionSignatureStepProps) {
  const isCompleted = workOrder.status === 'COMPLETED'
  const [signerName, setSignerName] = useState(
    workOrder.signedByName || workOrder.customerName || ''
  )
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFinish = async () => {
    if (!signerName.trim()) {
      setErrorMsg('Vul a.u.b. de naam van de klant of contactpersoon in.')
      return
    }
    setErrorMsg(null)
    try {
      await onComplete(signerName.trim(), signatureData || undefined)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het afronden.'
      setErrorMsg(msg)
    }
  }

  const certificateName =
    workOrder.certificateDocument || `Keuringsattest_${workOrder.woNumber}_NBN-S21-100.pdf`

  const handleDownloadCertificate = () => {
    const dummyContent = `Verlinde Beveiliging - Keuringsattest NBN S21-100\nWerkorder: ${workOrder.woNumber}\nKlant: ${workOrder.customerName}\nLocatie: ${workOrder.siteAddress}, ${workOrder.siteCity}\nDatum: ${workOrder.date}\nStatus: Conform goedgekeurd\nOndertekend door: ${workOrder.signedByName || signerName}`
    const blob = new Blob([dummyContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = certificateName
    a.click()
    URL.revokeObjectURL(url)
  }

  // If already completed in past/earlier:
  if (isCompleted) {
    return (
      <div className="space-y-4 pt-1">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Werkorder Succesvol Voltooid & Afgetekend</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20 text-[11px]">
            <div>
              <span className="opacity-75 block">Ondertekend door:</span>
              <span className="font-semibold">{workOrder.signedByName || 'Klant ter plaatse'}</span>
            </div>
            <div>
              <span className="opacity-75 block">Tijdstip:</span>
              <span className="font-semibold">
                {workOrder.signedAt || workOrder.completedAt || workOrder.date}
              </span>
            </div>
          </div>
        </div>

        {/* Certificate Download */}
        <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <FileCheck2 className="size-5 text-emerald-500 shrink-0" />
            <div className="truncate">
              <div className="font-semibold text-foreground truncate">
                Keuringsattest NBN S21-100
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">
                {certificateName}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadCertificate}
            className="text-xs h-8 gap-1.5 shrink-0 border-border"
          >
            <Download className="size-3.5" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Name of Signer */}
      <div className="space-y-1.5">
        <label
          htmlFor="signer-name-input"
          className="text-xs font-semibold text-foreground flex items-center gap-1.5"
        >
          <UserCheck className="size-3.5 text-primary" />
          Naam klant / contactpersoon ter plaatse:
        </label>
        <Input
          id="signer-name-input"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="bv. Jan Peeters (Zaakvoerder)"
          className="text-xs h-9 bg-background"
        />
      </div>

      {/* Signature Pad */}
      <SignaturePad onSignatureChange={setSignatureData} disabled={isCompleting} />

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
          {errorMsg}
        </div>
      )}

      {/* Complete Button */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleFinish}
          disabled={isCompleting || !isAllChecklistDone}
          className="w-full h-10 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          {isCompleting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Verwerken & Attest genereren...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="size-4" />
              <span>Werkorder Officieel Voltooien</span>
            </>
          )}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Hiermee wordt de keuringsdatum geregistreerd en de jaarlijkse onderhoudscyclus (+12m) automatisch bijgewerkt.
        </p>
      </div>
    </div>
  )
}
