import { useState } from 'react'
import { Shield, ShieldAlert, Eye, EyeOff, Copy, Check, Lock } from 'lucide-react'
import { Button } from '#/features/shared/components/ui/button'

interface ConfidentialAccessVaultProps {
  accessNotes: string | null | undefined
  siteName: string
}

export function ConfidentialAccessVault({ accessNotes, siteName }: ConfidentialAccessVaultProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)

  if (!accessNotes || accessNotes.trim() === '') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground">
        <Lock className="size-4 shrink-0 text-muted-foreground/60" />
        <span>Geen vertrouwelijke alarm- of sleutelcodes geregistreerd voor {siteName}.</span>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accessNotes)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-background to-amber-500/5 p-3.5">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Shield className="size-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
              <span>Zero-Trust Alarmcode Vault</span>
              <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                VERTROUWELIJK
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Toegangscodes, klaviercode & sleutellocatie
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsRevealed(!isRevealed)}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            title={isRevealed ? 'Code verbergen' : 'Toon alarmcode'}
          >
            {isRevealed ? (
              <>
                <EyeOff className="mr-1.5 size-3.5" />
                <span>Verberg</span>
              </>
            ) : (
              <>
                <Eye className="mr-1.5 size-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-700 dark:text-amber-300 font-medium">Toon code</span>
              </>
            )}
          </Button>

          {isRevealed && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs"
              title="Kopieer code"
            >
              {hasCopied ? (
                <>
                  <Check className="mr-1 size-3 text-emerald-600" />
                  <span className="text-[11px] text-emerald-600">Gekopieerd</span>
                </>
              ) : (
                <>
                  <Copy className="mr-1 size-3" />
                  <span className="text-[11px]">Kopieer</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2.5">
        {isRevealed ? (
          <div className="rounded-md bg-muted/60 p-2.5 font-mono text-xs text-foreground select-all break-words border border-border/50">
            {accessNotes}
          </div>
        ) : (
          <div
            onClick={() => setIsRevealed(true)}
            className="flex cursor-pointer items-center justify-between rounded-md bg-muted/30 p-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60"
            title="Klik om code te ontgrendelen"
          >
            <span className="tracking-widest font-mono text-sm text-foreground/70 select-none">
              •••• •••• ••••
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 underline underline-offset-2">
              Klik om te ontmaskeren
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
        <ShieldAlert className="size-3 shrink-0 text-muted-foreground/60" />
        <span>Geregistreerd voor Dirk Verlinde (Zaakvoerder). Alleen tonen in veilige omgeving.</span>
      </div>
    </div>
  )
}
