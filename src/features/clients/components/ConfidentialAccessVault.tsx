import { useState } from 'react'
import { Shield, Eye, EyeOff, Copy, Check, KeyRound, Lock } from 'lucide-react'
import { Button } from '#/features/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/features/shared/components/ui/dialog'

interface ConfidentialAccessVaultProps {
  accessNotes: string | null | undefined
  siteName: string
}

export function ConfidentialAccessVault({ accessNotes, siteName }: ConfidentialAccessVaultProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)

  const hasNotes = Boolean(accessNotes && accessNotes.trim() !== '')

  if (!hasNotes) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="h-8 gap-1.5 text-xs text-muted-foreground/50 cursor-not-allowed"
        title="Geen alarm- of toegangscodes geregistreerd voor deze installatie"
      >
        <Lock className="size-3.5" />
        <span>Geen toegangscodes</span>
      </Button>
    )
  }

  const handleCopy = async () => {
    if (!accessNotes) return
    try {
      await navigator.clipboard.writeText(accessNotes)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setIsOpen(true)
          setIsRevealed(false)
        }}
        className="h-8 gap-1.5 text-xs border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 font-medium"
      >
        <KeyRound className="size-3.5" />
        <span>Toegangscodes & Notities</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Shield className="size-4 text-amber-500" />
              <span>Vertrouwelijke Toegangscodes & Sleutelinfo</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Toegangscodes, klaviercode & sleutellocatie geregistreerd voor <strong>{siteName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Geregistreerde Toegangsinstructie:
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRevealed(!isRevealed)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
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

              {isRevealed ? (
                <div className="rounded-md bg-background/80 p-3 font-mono text-xs text-foreground select-all break-words border border-border">
                  {accessNotes}
                </div>
              ) : (
                <div
                  onClick={() => setIsRevealed(true)}
                  className="flex cursor-pointer items-center justify-between rounded-md bg-muted/60 p-3 text-xs text-muted-foreground transition-colors hover:bg-muted"
                  title="Klik om te ontgrendelen"
                >
                  <span className="tracking-widest font-mono text-sm text-foreground/70 select-none">
                    •••• •••• •••• ••••
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium underline underline-offset-2">
                    Klik om te ontmaskeren
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Let op: Deze codes zijn uitsluitend bestemd voor geautoriseerde technici ter plaatse. Deel deze gegevens nooit onversleuteld met derden.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
