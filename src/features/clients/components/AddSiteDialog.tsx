import { useState, useId } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientKeys } from '#/features/clients/query'
import { createSiteFn } from '#/features/clients/server/createSite'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/features/shared/components/ui/select'
import { toast } from 'sonner'
import { Plus, Loader2, MapPin } from 'lucide-react'
import { AddressField } from '#/features/shared/components/AddressField'

interface AddSiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  customerName: string
  defaultAddress?: string | null
  defaultCity?: string | null
  defaultZip?: string | null
  onSiteCreated?: (newSiteId: string) => void
}

export function AddSiteDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  defaultAddress,
  defaultCity,
  defaultZip,
  onSiteCreated,
}: AddSiteDialogProps) {
  const queryClient = useQueryClient()
  const formId = useId()

  const [name, setName] = useState('')
  const [siteAddress, setSiteAddress] = useState(defaultAddress || '')
  const [siteZip, setSiteZip] = useState(defaultZip || '')
  const [siteCity, setSiteCity] = useState(defaultCity || 'Zwevegem')
  const [primaryDiscipline, setPrimaryDiscipline] = useState<'FIRE' | 'INTRUSION' | 'CCTV' | 'ACCESS'>('INTRUSION')
  const [accessNotes, setAccessNotes] = useState('')

  const handleCopyDefault = () => {
    if (defaultAddress) setSiteAddress(defaultAddress)
    if (defaultZip) setSiteZip(defaultZip)
    if (defaultCity) setSiteCity(defaultCity)
  }

  const resetForm = () => {
    setName('')
    setSiteAddress(defaultAddress || '')
    setSiteZip(defaultZip || '')
    setSiteCity(defaultCity || 'Zwevegem')
    setPrimaryDiscipline('INTRUSION')
    setAccessNotes('')
  }

  const addSiteMutation = useMutation({
    mutationFn: (data: Parameters<typeof createSiteFn>[0]['data']) =>
      createSiteFn({ data }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
      toast.success(`Locatie "${name.trim()}" succesvol toegevoegd`, {
        description: `Installatiefiche #${result.sheetNumber} aangemaakt`,
      })
      onOpenChange(false)
      resetForm()
      if (onSiteCreated) {
        onSiteCreated(result.siteId)
      }
    },
    onError: (err: Error) => {
      toast.error('Fout bij toevoegen van locatie', {
        description: err.message || 'Controleer de invoergegevens.',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Locatienaam is verplicht')
      return
    }
    if (!siteAddress.trim() || !siteCity.trim()) {
      toast.error('Adres en gemeente zijn verplicht')
      return
    }

    addSiteMutation.mutate({
      customerId,
      name: name.trim(),
      siteAddress: siteAddress.trim(),
      siteZip: siteZip.trim() || null,
      siteCity: siteCity.trim(),
      primaryDiscipline,
      accessNotesConfidential: accessNotes.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-w-lg p-6">
        <DialogHeader className="pb-2 border-b border-border/60">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <MapPin className="size-5 text-primary shrink-0" />
            <span>Nieuwe Installatielocatie Toevoegen</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Voeg een fysieke vestiging, werf of installatiefiche toe aan het dossier van <strong>{customerName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Benaming van deze locatie / installatie *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bv. Magazijn Menen, Woning Ann, Toonzaal, Filiaal Kortrijk"
              required
              className="text-xs h-9.5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Beveiligingssysteem (Discipline) *
            </label>
            <Select
              value={primaryDiscipline}
              onValueChange={(val) =>
                setPrimaryDiscipline(val as 'FIRE' | 'INTRUSION' | 'CCTV' | 'ACCESS')
              }
            >
              <SelectTrigger className="text-xs h-9.5">
                <SelectValue placeholder="Kies discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INTRUSION" className="text-xs">
                  Inbraakbeveiliging (Inbraakalarm)
                </SelectItem>
                <SelectItem value="FIRE" className="text-xs">
                  Branddetectie (NBN S21-100)
                </SelectItem>
                <SelectItem value="CCTV" className="text-xs">
                  Camerabewaking (CCTV)
                </SelectItem>
                <SelectItem value="ACCESS" className="text-xs">
                  Toegangscontrole (Badges / Klavieren)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Fysiek Installatieadres *
              </span>
              {defaultAddress && (
                <button
                  type="button"
                  onClick={handleCopyDefault}
                  className="text-[11px] text-primary hover:underline"
                >
                  Gebruik facturatieadres
                </button>
              )}
            </div>

            <AddressField.Root
              street={siteAddress}
              onStreetChange={setSiteAddress}
              postalCode={siteZip}
              onPostalCodeChange={setSiteZip}
              city={siteCity}
              onCityChange={setSiteCity}
            >
              <AddressField.Street
                required
                placeholder="Straat en nummer (bv. Industrielaan 4)"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <AddressField.PostalCode />
                </div>
                <div className="sm:col-span-2">
                  <AddressField.City required placeholder="Gemeente (bv. Menen)" />
                </div>
              </div>
            </AddressField.Root>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <label className="text-xs font-semibold text-foreground block">
              Vertrouwelijke Toegangscodes (optioneel)
            </label>
            <Input
              value={accessNotes}
              onChange={(e) => setAccessNotes(e.target.value)}
              placeholder="bv. Klaviercode alarm: 4821 • Sleutelbuis links van hoofdpoort"
              className="text-xs h-9.5 font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Wordt versleuteld bewaard en is enkel zichtbaar voor geautoriseerde technici.
            </p>
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
              disabled={addSiteMutation.isPending}
              className="text-xs h-9 px-4 gap-1.5 shadow-xs"
            >
              {addSiteMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Locatie toevoegen...</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>Locatie Opslaan</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
