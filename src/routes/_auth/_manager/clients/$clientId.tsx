import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { clientQueries } from '#/features/clients/query'
import { groupSitesByLocation } from '#/features/clients/types'
import { ConfidentialAccessVault } from '#/features/clients/components/ConfidentialAccessVault'
import { SiteEquipmentTable } from '#/features/clients/components/SiteEquipmentTable'
import { SiteInspectionHistory } from '#/features/clients/components/SiteInspectionHistory'
import { AddSiteDialog } from '#/features/clients/components/AddSiteDialog'
import { EditClientDialog } from '#/features/clients/components/EditClientDialog'
import { DeleteClientDialog } from '#/features/clients/components/DeleteClientDialog'
import { StatusBadge } from '#/features/clients/components/StatusBadge'
import { DashboardInsights } from '#/features/maintenance/components/DashboardInsights'
import { Button } from '#/features/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/features/shared/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/features/shared/components/ui/tabs'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Flame,
  Shield,
  Video,
  KeyRound,
  Layers,
  History,
  ArrowLeft,
  Clock,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Plus,
  Edit3,
  CalendarCheck,
  Repeat,
  MoreVertical,
  Trash2,
} from 'lucide-react'

export const Route = createFileRoute('/_auth/_manager/clients/$clientId')({
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await queryClient.query({
      ...clientQueries.detail(clientId),
      staleTime: 1000 * 60,
    })
  },
  component: ClientDetailPage,
})

const DISCIPLINE_CONFIG: Record<string, { label: string; icon: typeof Flame }> = {
  FIRE: { label: 'Branddetectie', icon: Flame },
  INTRUSION: { label: 'Inbraakbeveiliging', icon: Shield },
  CCTV: { label: 'Camerabewaking', icon: Video },
  ACCESS: { label: 'Toegangscontrole', icon: KeyRound },
}

function ClientDetailPage() {
  const { clientId } = Route.useParams()
  const { data: client } = useSuspenseQuery(clientQueries.detail(clientId))

  // Group fiches by physical location/site
  const locationGroups = useMemo(
    () => (client ? groupSitesByLocation(client.sites) : []),
    [client]
  )

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [selectedFicheId, setSelectedFicheId] = useState<string | null>(null)
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [isDeleteClientOpen, setIsDeleteClientOpen] = useState(false)

  const totalWorkOrders = useMemo(
    () => (client ? client.sites.reduce((acc, s) => acc + s.workOrders.length, 0) : 0),
    [client]
  )

  // Active Location Group
  const activeLocation =
    locationGroups.find((loc) => loc.id === selectedLocationId) ??
    locationGroups[0] ??
    null

  // Active Fiche within the active Location
  const activeFiche =
    activeLocation?.fiches.find((f) => f.id === selectedFicheId) ??
    activeLocation?.fiches[0] ??
    null

  // Horizontal scroll tracking for location selector tabs
  const locationScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkLocationScroll = useCallback(() => {
    const el = locationScrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2)
  }, [])

  useEffect(() => {
    checkLocationScroll()
    const el = locationScrollRef.current
    if (!el) return
    window.addEventListener('resize', checkLocationScroll)
    return () => window.removeEventListener('resize', checkLocationScroll)
  }, [checkLocationScroll, locationGroups])

  const scrollLocations = (dir: 'left' | 'right') => {
    if (!locationScrollRef.current) return
    const delta = dir === 'left' ? -220 : 220
    locationScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' })
  }

  if (!client) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
          >
            <Link to="/clients">
              <ArrowLeft className="size-4" />
              <span>Terug naar Klanten</span>
            </Link>
          </Button>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-card p-12 max-w-md mx-auto space-y-3 mt-8">
          <Building2 className="size-10 mx-auto text-muted-foreground/40" />
          <h2 className="text-lg font-bold text-foreground">Klant niet gevonden</h2>
          <p className="text-xs text-muted-foreground">
            Het opgevraagde klantendossier kon niet worden teruggevonden in het systeem.
          </p>
          <Button asChild size="sm" className="mt-2 text-xs">
            <Link to="/clients">Naar klantenlijst</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Format clean address line without duplicate street repeating if title already has the street
  const getLocationSubline = (loc: typeof activeLocation) => {
    if (!loc) return ''
    const street = loc.address?.trim()
    const title = loc.name.trim().toLowerCase()
    const cityPart = `${loc.zip ? `${loc.zip} ` : ''}${loc.city}`

    if (!street || street.toLowerCase() === title || title.includes(street.toLowerCase())) {
      return cityPart
    }
    return `${street}, ${cityPart}`
  }

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 pb-16 w-full">
      {/* Top Navigation Bar: Back button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
        >
          <Link to="/clients">
            <ArrowLeft className="size-4" />
            <span>Terug naar Klanten & Installaties</span>
          </Link>
        </Button>
      </div>

      {/* Main Client Profile Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                {client.code}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {client.type === 'B2B' ? 'B2B Onderneming' : 'Particulier'}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <StatusBadge status={client.healthStatus} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 pt-0.5">
              <Building2 className="size-6 text-primary shrink-0" />
              <span>{client.name}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
              {client.vatNumber && (
                <span className="font-mono">Btw: {client.vatNumber}</span>
              )}
              {client.invoiceAddress && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" />
                  <span>
                    {client.invoiceAddress}, {client.invoiceZip} {client.invoiceCity}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {client.phone && (
              <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 text-xs">
                <a href={`tel:${client.phone}`}>
                  <Phone className="size-3.5 text-primary" />
                  <span>{client.phone}</span>
                </a>
              </Button>
            )}
            {client.mobile && client.mobile !== client.phone && (
              <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 text-xs">
                <a href={`tel:${client.mobile}`}>
                  <Phone className="size-3.5 text-primary" />
                  <span>{client.mobile}</span>
                </a>
              </Button>
            )}
            {client.email && (
              <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 text-xs">
                <a href={`mailto:${client.email}`}>
                  <Mail className="size-3.5 text-primary" />
                  <span>{client.email}</span>
                </a>
              </Button>
            )}
            {/* Dossier Actions (3-dots Dropdown Menu) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-xs"
                  className="size-8"
                  title="Dossierbeheer opties"
                >
                  <MoreVertical className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => setIsEditClientOpen(true)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Edit3 className="size-3.5 text-muted-foreground" />
                  <span>Gegevens Bewerken</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setIsAddSiteOpen(true)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Plus className="size-3.5 text-muted-foreground" />
                  <span>Locatie / Fiche Toevoegen</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setIsDeleteClientOpen(true)}
                  className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  <span>Klant Dossier Verwijderen</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Systems Summary (Clean, quiet tags) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3 border-t border-border/60 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Beveiligingssystemen:</span>
          <div className="flex flex-wrap items-center gap-2">
            {client.disciplines.map((disc) => {
              const config = DISCIPLINE_CONFIG[disc]
              const Icon = config?.icon ?? ShieldCheck
              return (
                <span
                  key={disc}
                  className="inline-flex items-center gap-1 text-xs text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/60"
                >
                  <Icon className="size-3 text-muted-foreground" />
                  <span>{config?.label || disc}</span>
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sites & Locations Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <FolderGit2 className="size-5 text-primary" />
              <span>Installatielocaties</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Overzicht van fysieke vestigingen, werven en bijhorende installatiefiches.
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Subtle Location & Fiches count next to arrows */}
            <span className="text-xs text-muted-foreground/80 font-mono hidden sm:inline-block">
              {locationGroups.length} {locationGroups.length === 1 ? 'locatie' : 'locaties'} • {client.sites.length} fiches
            </span>

            {/* Scroll navigation arrows for location tabs when many locations exist */}
            {(canScrollLeft || canScrollRight) && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => scrollLocations('left')}
                  disabled={!canScrollLeft}
                  className="size-7"
                  title="Scroll locaties naar links"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => scrollLocations('right')}
                  disabled={!canScrollRight}
                  className="size-7"
                  title="Scroll locaties naar rechts"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            )}

            {/* Manager button to add a new site */}
            <Button
              size="sm"
              onClick={() => setIsAddSiteOpen(true)}
              className="h-8 gap-1.5 text-xs shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Locatie Toevoegen</span>
            </Button>
          </div>
        </div>

        {/* Location selector tabs: Single-line horizontal scroll container (NEVER wraps into multiple lines) */}
        {locationGroups.length > 1 && (
          <div
            ref={locationScrollRef}
            onScroll={checkLocationScroll}
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth w-full border-b border-border/80"
          >
            {locationGroups.map((loc) => {
              const isSelected = activeLocation?.id === loc.id
              return (
                <button
                  type="button"
                  key={loc.id}
                  onClick={() => {
                    setSelectedLocationId(loc.id)
                    setSelectedFicheId(loc.fiches[0]?.id ?? null)
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                  }`}
                >
                  <MapPin className="size-3 shrink-0" />
                  <span>{loc.name}</span>
                  {loc.fiches.length > 1 && (
                    <span className="opacity-75 text-[10px] font-mono">
                      ({loc.fiches.length} fiches)
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Active Physical Location Card */}
        {activeLocation && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-xs">
            {/* Location Address Header & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">
                    {activeLocation.name}
                  </h3>
                  {activeLocation.fiches.length > 1 && (
                    <span className="text-xs text-muted-foreground font-normal">
                      • {activeLocation.fiches.length} geïnstalleerde systemen
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
                  <span>{getLocationSubline(activeLocation)}</span>
                </p>
              </div>

              {/* Action Buttons: Confidential Vault & GPS Navigation */}
              <div className="flex items-center gap-2 shrink-0">
                {activeFiche && (
                  <ConfidentialAccessVault
                    accessNotes={activeFiche.accessNotesConfidential}
                    siteName={activeLocation.name}
                  />
                )}

                {activeLocation.address && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-8 text-xs gap-1.5"
                  >
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${activeLocation.address}, ${activeLocation.city}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>GPS</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Fiches / Disciplines at this Location (Clean Segmented Selector, No Duplicate Badges) */}
            {activeLocation.fiches.length > 1 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground block">
                  Selecteer installatiefiche op deze locatie:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeLocation.fiches.map((fiche) => {
                    const isFicheSelected = (activeFiche?.id ?? activeLocation.fiches[0].id) === fiche.id
                    const config = DISCIPLINE_CONFIG[fiche.primaryDiscipline]
                    const Icon = config?.icon ?? ShieldCheck

                    return (
                      <button
                        type="button"
                        key={fiche.id}
                        onClick={() => setSelectedFicheId(fiche.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                          isFicheSelected
                            ? 'bg-foreground text-background border-foreground shadow-xs'
                            : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border/80'
                        }`}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span>{config?.label || fiche.primaryDiscipline}</span>
                        <span className="font-mono text-[11px] opacity-80">
                          (Fiche #{fiche.sheetNumber})
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* If location has only 1 fiche, show a simple clean header line without duplicate badges */}
            {activeLocation.fiches.length === 1 && activeFiche && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Installatie:</span>
                <span>
                  {DISCIPLINE_CONFIG[activeFiche.primaryDiscipline]?.label || activeFiche.primaryDiscipline}
                </span>
                <span>•</span>
                <span className="font-mono">Fiche #{activeFiche.sheetNumber}</span>
              </div>
            )}

            {/* Active Fiche Details */}
            {activeFiche && (
              <div className="space-y-5 pt-1">
                {/* 4 Insight Cards (reusing DashboardInsights compound component) */}
                <DashboardInsights.Root className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <DashboardInsights.Card
                    title="Onderhoudsinterval"
                    value={activeFiche.frequency || '1J'}
                    icon={Repeat}
                    subtitle="Contractuele periodiciteit"
                    subtext="Onderhoudscyclus"
                    variant="default"
                  />

                  <DashboardInsights.Card
                    title="Laatste Keuring"
                    value={activeFiche.lastServiceDate || 'Geen'}
                    icon={CalendarCheck}
                    subtitle="Recentste werkbon"
                    subtext="Inspectiedatum"
                    variant="info"
                  />

                  <DashboardInsights.Card
                    title="Volgende Keuring"
                    value={activeFiche.nextDueDate || 'Te plannen'}
                    icon={Clock}
                    subtitle="Vervaldatum inspectie"
                    subtext="Volgende cyclus"
                    variant="warning"
                  />

                  <DashboardInsights.Card
                    title="Status Dossier"
                    value={<StatusBadge status={activeFiche.healthStatus} />}
                    icon={ShieldCheck}
                    subtitle="Inspectieconformiteit"
                    subtext="Wettelijke normering"
                    variant={
                      activeFiche.healthStatus === 'COMPLIANT'
                        ? 'positive'
                        : activeFiche.healthStatus === 'DUE_SOON'
                        ? 'warning'
                        : 'destructive'
                    }
                  />
                </DashboardInsights.Root>

                {/* Tabbed deep dive: Installed Hardware vs Work Order History */}
                <Tabs defaultValue="equipment" className="w-full pt-1">
                  <TabsList className="grid w-full sm:w-auto grid-cols-2">
                    <TabsTrigger value="equipment" className="gap-2 text-xs">
                      <Layers className="size-3.5" />
                      <span>Geïnstalleerde Apparatuur ({activeFiche.equipment.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="inspections" className="gap-2 text-xs">
                      <History className="size-3.5" />
                      <span>Keuringshistoriek & Attesten ({activeFiche.workOrders.length})</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="equipment" className="pt-4">
                    <SiteEquipmentTable equipment={activeFiche.equipment} />
                  </TabsContent>

                  <TabsContent value="inspections" className="pt-4">
                    <SiteInspectionHistory workOrders={activeFiche.workOrders} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog to Add Site/Fiche */}
      <AddSiteDialog
        open={isAddSiteOpen}
        onOpenChange={setIsAddSiteOpen}
        customerId={client.id}
        customerName={client.name}
        defaultAddress={client.invoiceAddress}
        defaultCity={client.invoiceCity}
        defaultZip={client.invoiceZip}
      />

      {/* Dialog to Edit Client Dossier Details */}
      <EditClientDialog
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        client={client}
      />

      {/* High-Safety Dialog to Delete Client */}
      <DeleteClientDialog
        open={isDeleteClientOpen}
        onOpenChange={setIsDeleteClientOpen}
        clientId={client.id}
        clientName={client.name}
        clientCode={client.code}
        sitesCount={client.sites.length}
        workOrdersCount={totalWorkOrders}
      />
    </div>
  )
}
