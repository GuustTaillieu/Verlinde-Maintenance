import { useState, useId } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientKeys } from '#/features/clients/query'
import { updateCustomerFn } from '#/features/clients/server/updateCustomer'
import type { ClientDetail } from '#/features/clients/types'
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
import { Edit3, Loader2, Save } from 'lucide-react'

interface EditClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: ClientDetail
}

export function EditClientDialog({ open, onOpenChange, client }: EditClientDialogProps) {
  const queryClient = useQueryClient()
  const formId = useId()

  const [name, setName] = useState(client.name)
  const [vatNumber, setVatNumber] = useState(client.vatNumber || '')
  const [email, setEmail] = useState(client.email || '')
  const [phone, setPhone] = useState(client.phone || '')
  const [mobile, setMobile] = useState(client.mobile || '')
  const [invoiceAddress, setInvoiceAddress] = useState(client.invoiceAddress || '')
  const [invoiceZip, setInvoiceZip] = useState(client.invoiceZip || '')
  const [invoiceCity, setInvoiceCity] = useState(client.invoiceCity || 'Zwevegem')

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateCustomerFn>[0]['data']) =>
      updateCustomerFn({ data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
      toast.success('Klantgegevens succesvol bijgewerkt')
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast.error('Fout bij bijwerken van klant', {
        description: err.message || 'Controleer de invoergegevens.',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Klantnaam is verplicht')
      return
    }
    if (!invoiceAddress.trim() || !invoiceCity.trim()) {
      toast.error('Facturatieadres en gemeente zijn verplicht')
      return
    }

    updateMutation.mutate({
      customerId: client.id,
      name: name.trim(),
      vatNumber: vatNumber.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      mobile: mobile.trim() || null,
      invoiceAddress: invoiceAddress.trim(),
      invoiceZip: invoiceZip.trim() || null,
      invoiceCity: invoiceCity.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-w-lg p-6">
        <DialogHeader className="pb-2 border-b border-border/60">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Edit3 className="size-5 text-primary shrink-0" />
            <span>Klantgegevens Bewerken</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pas de algemene dossier- en facturatiegegevens aan voor <span className="font-mono text-foreground">{client.code}</span> ({client.name}).
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Klantnaam / Firmanaam *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="text-xs h-9.5"
            />
          </div>

          {client.type === 'B2B' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Btw-nummer
              </label>
              <Input
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="bv. BE 0123.456.789"
                className="text-xs h-9.5 font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                E-mailadres
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="facturatie@bedrijf.be"
                className="text-xs h-9.5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Telefoon of Gsm
              </label>
              <Input
                type="tel"
                value={phone || mobile}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setMobile(e.target.value)
                }}
                placeholder="+32 56 00 11 22"
                className="text-xs h-9.5"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-border/60">
            <label className="text-xs font-semibold text-foreground block">
              Facturatieadres *
            </label>
            <Input
              value={invoiceAddress}
              onChange={(e) => setInvoiceAddress(e.target.value)}
              placeholder="Straat en nummer"
              required
              className="text-xs h-9.5"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={invoiceZip}
                onChange={(e) => setInvoiceZip(e.target.value)}
                placeholder="Postcode"
                className="text-xs h-9.5"
              />
              <div className="col-span-2">
                <Input
                  value={invoiceCity}
                  onChange={(e) => setInvoiceCity(e.target.value)}
                  placeholder="Gemeente"
                  required
                  className="text-xs h-9.5"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="text-xs h-9 px-4 gap-1.5 shadow-xs"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Opslaan...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Wijzigingen Opslaan</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
