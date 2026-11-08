import { useState, useId } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { clientKeys } from '#/features/clients/query'
import { deleteCustomerFn } from '#/features/clients/server/deleteCustomer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#/features/shared/components/ui/dialog'
import { Input } from '#/features/shared/components/ui/input'
import { Button } from '#/features/shared/components/ui/button'
import { toast } from 'sonner'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'

interface DeleteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  clientCode: string
  sitesCount: number
  workOrdersCount: number
}

export function DeleteClientDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  clientCode,
  sitesCount,
  workOrdersCount,
}: DeleteClientDialogProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const formId = useId()

  const [confirmInput, setConfirmInput] = useState('')

  const isConfirmed = confirmInput.trim().toLowerCase() === clientName.trim().toLowerCase()

  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteCustomerFn({
        data: {
          customerId: clientId,
          confirmName: confirmInput.trim(),
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
      toast.success(`Klant "${clientName}" is definitief verwijderd`, {
        description: 'Alle gekoppelde installaties, fiches en werkbonnen zijn gewist.',
      })
      onOpenChange(false)
      setConfirmInput('')
      void navigate({ to: '/clients' })
    },
    onError: (err: Error) => {
      toast.error('Fout bij verwijderen van klant', {
        description: err.message || 'Controleer de ingevoerde naam.',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConfirmed) return
    deleteMutation.mutate()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmInput('')
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg max-w-md p-6">
        <DialogHeader className="space-y-2 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 text-destructive">
            <div className="flex size-8 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Klantendossier Verwijderen
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-normal">
            Deze actie is definitief en kan niet ongedaan worden gemaakt.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 space-y-2 text-xs">
            <p className="font-semibold text-destructive">
              U staat op het punt om het volgende dossier permanent te wissen:
            </p>
            <div className="space-y-1 text-muted-foreground text-[11px] leading-relaxed">
              <p>
                • Klant: <strong className="text-foreground">{clientName}</strong> (<span className="font-mono">{clientCode}</span>)
              </p>
              <p>
                • Gekoppelde data: <strong className="text-foreground">{sitesCount} installaties/fiches</strong> en <strong className="text-foreground">{workOrdersCount} keuringen/werkbonnen</strong>.
              </p>
              <p className="text-destructive/90 font-medium pt-1">
                Alle apparatuur, geplande onderhoudsintervallen en inspectiehistoriek worden onherroepelijk verwijderd.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Typ <strong className="font-mono text-primary">&ldquo;{clientName}&rdquo;</strong> ter bevestiging:
            </label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={clientName}
              className="text-xs h-9.5 font-medium"
              autoComplete="off"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              autoFocus
              onClick={() => {
                setConfirmInput('')
                onOpenChange(false)
              }}
              className="text-xs h-9 px-4"
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={!isConfirmed || deleteMutation.isPending}
              className="text-xs h-9 px-4 gap-1.5 shadow-xs font-medium"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Verwijderen...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Klant Definitief Verwijderen</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
