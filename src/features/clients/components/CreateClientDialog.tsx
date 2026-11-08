import { useState, useId } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { clientQueries, clientKeys } from '#/features/clients/query'
import { createCustomerFn } from '#/features/clients/server/createCustomer'
import { type CustomerType } from '#/features/clients/types'
import { useDebounce } from '#/features/shared/hooks/useDebounce'
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
import { Checkbox } from '#/features/shared/components/ui/checkbox'
import { AddressField } from '#/features/shared/components/AddressField'
import { toast } from 'sonner'
import {
  Building2,
  User,
  AlertTriangle,
  Plus,
  Loader2,
} from 'lucide-react'

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const formId = useId()

  const [name, setName] = useState('')
  const [type, setType] = useState<CustomerType>('B2B')
  const [vatNumber, setVatNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [invoiceAddress, setInvoiceAddress] = useState('')
  const [invoiceZip, setInvoiceZip] = useState('')
  const [invoiceCity, setInvoiceCity] = useState('Zwevegem')

  const [sameAsInvoice, setSameAsInvoice] = useState(true)
  const [siteAddress, setSiteAddress] = useState('')
  const [siteZip, setSiteZip] = useState('')
  const [siteCity, setSiteCity] = useState('')
  const [primaryDiscipline, setPrimaryDiscipline] = useState<'FIRE' | 'INTRUSION' | 'CCTV' | 'ACCESS'>('INTRUSION')

  const [allowDuplicate, setAllowDuplicate] = useState(false)

  // Real-time debounced check for duplicate customer names (case-insensitive)
  const debouncedName = useDebounce(name.trim(), 300)
  const { data: duplicateCheck } = useQuery(clientQueries.checkName(debouncedName))

  const isDuplicate = Boolean(duplicateCheck?.isDuplicate)
  const duplicateInfo = duplicateCheck?.existingCustomer

  const resetForm = () => {
    setName('')
    setType('B2B')
    setVatNumber('')
    setEmail('')
    setPhone('')
    setMobile('')
    setInvoiceAddress('')
    setInvoiceZip('')
    setInvoiceCity('Zwevegem')
    setSameAsInvoice(true)
    setSiteAddress('')
    setSiteZip('')
    setSiteCity('')
    setPrimaryDiscipline('INTRUSION')
    setAllowDuplicate(false)
  }

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createCustomerFn>[0]['data']) =>
      createCustomerFn({ data }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
      toast.success(`Klant "${name.trim()}" succesvol aangemaakt`, {
        description: `Klantcode: ${result.code} • Installatiefiche #${result.sheetNumber}`,
      })
      onOpenChange(false)
      resetForm()
      void navigate({
        to: '/clients/$clientId',
        params: { clientId: result.customerId },
      })
    },
    onError: (err: Error) => {
      toast.error('Fout bij aanmaken van klant', {
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
    if (isDuplicate && !allowDuplicate) {
      toast.error('Dubbele klantnaam gedetecteerd', {
        description: 'Vink het vakje aan om toch door te gaan met deze naam.',
      })
      return
    }

    createMutation.mutate({
      name: name.trim(),
      type,
      vatNumber: type === 'B2B' ? vatNumber.trim() || null : null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      mobile: mobile.trim() || null,
      invoiceAddress: invoiceAddress.trim(),
      invoiceZip: invoiceZip.trim() || null,
      invoiceCity: invoiceCity.trim(),
      siteAddress: sameAsInvoice ? invoiceAddress.trim() : (siteAddress.trim() || invoiceAddress.trim()),
      siteZip: sameAsInvoice ? invoiceZip.trim() || null : (siteZip.trim() || invoiceZip.trim() || null),
      siteCity: sameAsInvoice ? invoiceCity.trim() : (siteCity.trim() || invoiceCity.trim()),
      primaryDiscipline,
      allowDuplicate,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Building2 className="size-5 text-primary shrink-0" />
            <span>Nieuwe Klant Toevoegen</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-normal">
            Voer de klant- en facturatiegegevens in. Er wordt automatisch een unieke klantcode en eerste installatiefiche toegekend.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Section 1: Customer Type & Identity */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Type Klant
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-1">
                <button
                  type="button"
                  onClick={() => setType('B2B')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    type === 'B2B'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="size-3.5" />
                  <span>B2B Onderneming</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('RESIDENTIAL')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    type === 'RESIDENTIAL'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="size-3.5" />
                  <span>Particulier</span>
                </button>
              </div>
            </div>

            {/* Name input & real-time duplicate check alert */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                {type === 'B2B' ? 'Bedrijfsnaam / Firmanaam' : 'Volledige Naam Klant'} *
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setAllowDuplicate(false)
                }}
                placeholder={type === 'B2B' ? 'bv. Schrijnwerkerij Desmet BV' : 'bv. Jan & Els Verbeke'}
                required
                className="text-xs h-9.5"
              />

              {/* In-app warning for duplicate client name (case-insensitive) */}
              {isDuplicate && duplicateInfo && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-2.5 animate-in fade-in-50 duration-150">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Let op: Klant bestaat al in het systeem</span>
                      <p className="mt-0.5 text-[11px] leading-relaxed">
                        Er is reeds een actieve klant geregistreerd met de naam <strong>&ldquo;{duplicateInfo.name}&rdquo;</strong> (Klantcode: <span className="font-mono">{duplicateInfo.code}</span>, Gemeente: {duplicateInfo.invoiceCity || 'Onbekend'}).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-amber-500/20">
                    <Checkbox
                      id="allow-dup"
                      checked={allowDuplicate}
                      onCheckedChange={(chk) => setAllowDuplicate(Boolean(chk))}
                    />
                    <label htmlFor="allow-dup" className="text-xs font-medium cursor-pointer select-none">
                      Toch aanmaken met dezelfde naam (bv. ander filiaal of zusterbedrijf)
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* VAT number if B2B */}
            {type === 'B2B' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Btw-nummer (optioneel)
                </label>
                <Input
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="bv. BE 0123.456.789"
                  className="text-xs h-9.5 font-mono"
                />
              </div>
            )}
          </div>

          {/* Section 2: Contact Details */}
          <div className="space-y-3 pt-3 border-t border-border/60">
            <span className="text-xs font-semibold text-foreground block">
              Contactgegevens
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground block">
                  E-mailadres
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="facturatie@bedrijf.be"
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground block">
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
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Billing Address (with real-time Belgian geocoding autocomplete) */}
          <div className="space-y-3 pt-3 border-t border-border/60">
            <span className="text-xs font-semibold text-foreground block">
              Facturatieadres *
            </span>
            <AddressField.Root
              street={invoiceAddress}
              onStreetChange={setInvoiceAddress}
              postalCode={invoiceZip}
              onPostalCodeChange={setInvoiceZip}
              city={invoiceCity}
              onCityChange={setInvoiceCity}
            >
              <AddressField.Street
                required
                placeholder="bv. Kerkstraat 12 (begin met typen voor suggesties)"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-1">
                  <AddressField.PostalCode />
                </div>
                <div className="sm:col-span-2">
                  <AddressField.City required />
                </div>
              </div>
            </AddressField.Root>
          </div>

          {/* Section 4: Initial Site & Discipline */}
          <div className="space-y-3 pt-3 border-t border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-foreground">
                Eerste Installatie (Site) & Beveiligingssysteem
              </span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="same-addr"
                  checked={sameAsInvoice}
                  onCheckedChange={(chk) => setSameAsInvoice(Boolean(chk))}
                />
                <label htmlFor="same-addr" className="text-xs text-muted-foreground cursor-pointer select-none">
                  Zelfde adres als facturatie
                </label>
              </div>
            </div>

            {!sameAsInvoice && (
              <div className="pt-1 animate-in fade-in-50 duration-150">
                <AddressField.Root
                  street={siteAddress}
                  onStreetChange={setSiteAddress}
                  postalCode={siteZip}
                  onPostalCodeChange={setSiteZip}
                  city={siteCity}
                  onCityChange={setSiteCity}
                >
                  <AddressField.Street
                    label="Installatieadres (werfadres)"
                    placeholder="bv. Industrielaan 4 (begin met typen voor suggesties)"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-1">
                      <AddressField.PostalCode />
                    </div>
                    <div className="sm:col-span-2">
                      <AddressField.City placeholder="Gemeente werf" />
                    </div>
                  </div>
                </AddressField.Root>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] text-muted-foreground block">
                Geïnstalleerd beveiligingssysteem (Eerste installatiefiche):
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
                    Branddetectie (NBN S21-100 normering)
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
          </div>

          <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 px-4"
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending || (isDuplicate && !allowDuplicate)}
              className="text-xs h-9 px-5 gap-1.5 shadow-xs"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Klant aanmaken...</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>Klant Opslaan</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
