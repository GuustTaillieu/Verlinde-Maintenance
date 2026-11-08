import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { clientQueries } from '#/features/clients/query'
import { ConfidentialAccessVault } from '#/features/clients/components/ConfidentialAccessVault'
import { SiteEquipmentTable } from '#/features/clients/components/SiteEquipmentTable'
import { SiteInspectionHistory } from '#/features/clients/components/SiteInspectionHistory'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/features/shared/components/ui/tabs'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Shield,
  Video,
  KeyRound,
  FileSpreadsheet,
  Layers,
  History,
  ArrowLeft,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import type { MaintenanceHealthStatus } from '#/features/clients/types'

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
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)

  if (!client) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
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

  const currentSite =
    client.sites.find((s) => s.id === selectedSiteId) ?? client.sites[0] ?? null

  const getHealthBadge = (health: MaintenanceHealthStatus) => {
    switch (health) {
      case 'COMPLIANT':
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1.5 font-medium text-xs px-2.5 py-0.5"
          >
            <CheckCircle2 className="size-3.5" />
            In orde
          </Badge>
        )
      case 'DUE_SOON':
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 gap-1.5 font-medium text-xs px-2.5 py-0.5"
          >
            <Clock className="size-3.5" />
            Naderend (30-60d)
          </Badge>
        )
      case 'OVERDUE':
        return (
          <Badge
            variant="destructive"
            className="gap-1.5 font-medium text-xs px-2.5 py-0.5"
          >
            <AlertTriangle className="size-3.5" />
            Vervallen / Urgent
          </Badge>
        )
    }
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

      {/* Main Client Profile Header Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                {client.code}
              </span>
              <Badge
                variant={client.type === 'B2B' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {client.type === 'B2B' ? 'B2B (Onderneming)' : 'Particulier'}
              </Badge>
              {getHealthBadge(client.healthStatus)}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 pt-1">
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

          {/* Quick Contact Action Buttons */}
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
          </div>
        </div>

        {/* Installed Disciplines Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-medium">
            Beveiligingssystemen:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {client.disciplines.map((disc) => {
              const config = DISCIPLINE_CONFIG[disc]
              const Icon = config?.icon ?? ShieldCheck
              return (
                <span
                  key={disc}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted/60 text-foreground border border-border"
                >
                  <Icon className="size-3 text-muted-foreground" />
                  <span>{config?.label || disc}</span>
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sites & Installations Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-primary" />
              <span>Installatielocaties ({client.sites.length})</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Beheer hardware componenten, alarmcodes en keuringsdossiers per vestiging.
            </p>
          </div>
        </div>

        {/* Multi-site selector pills if client has multiple properties */}
        {client.sites.length > 1 && (
          <div className="flex flex-wrap gap-2 border-b border-border/80 pb-3">
            {client.sites.map((site) => {
              const isSelected = (currentSite?.id ?? client.sites[0].id) === site.id
              return (
                <button
                  type="button"
                  key={site.id}
                  onClick={() => setSelectedSiteId(site.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                    }`}
                >
                  <span>{site.name}</span>
                  <span className="text-[10px] opacity-80 font-mono">
                    Fiche {site.sheetNumber}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Selected Site Detail Card */}
        {currentSite && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-xs">
            {/* Site Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">
                    {currentSite.name}
                  </h3>
                  <span className="font-mono text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border">
                    Fiche {currentSite.sheetNumber}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-muted/60 border border-border">
                    {DISCIPLINE_CONFIG[currentSite.primaryDiscipline]?.label || currentSite.primaryDiscipline}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  <span>
                    {currentSite.siteAddress}, {currentSite.siteZip} {currentSite.siteCity}
                  </span>
                </p>
              </div>

              {/* Direct GPS / Google Maps Link */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5"
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${currentSite.siteAddress}, ${currentSite.siteCity}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Navigeer via GPS</span>
                  </a>
                </Button>
              </div>
            </div>

            {/* Zero-Trust Confidential Access Vault */}
            <ConfidentialAccessVault
              accessNotes={currentSite.accessNotesConfidential}
              siteName={currentSite.name}
            />

            {/* Maintenance KPI Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-muted/30 p-3.5 text-xs border border-border/50">
              <div>
                <span className="text-muted-foreground block text-[11px]">Onderhoudsinterval</span>
                <span className="font-semibold text-foreground">
                  {currentSite.frequency || 'Jaarlijks (12 maanden)'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Laatste Keuring</span>
                <span className="font-semibold text-foreground">
                  {currentSite.lastServiceDate || 'Geen geregistreerd onderhoud'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Volgende Keuringsdatum</span>
                <span className="font-semibold text-foreground">
                  {currentSite.nextDueDate || 'Niet ingepland'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Status</span>
                <div className="mt-0.5">{getHealthBadge(currentSite.healthStatus)}</div>
              </div>
            </div>

            {/* Tabbed Site Deep Dive: Equipment vs Inspection Records */}
            <Tabs defaultValue="equipment" className="w-full pt-2">
              <TabsList className="grid w-full sm:w-auto grid-cols-2">
                <TabsTrigger value="equipment" className="gap-2 text-xs">
                  <Layers className="size-3.5" />
                  <span>Geïnstalleerde Apparatuur ({currentSite.equipment.length})</span>
                </TabsTrigger>
                <TabsTrigger value="inspections" className="gap-2 text-xs">
                  <History className="size-3.5" />
                  <span>Keuringshistoriek & Attesten ({currentSite.workOrders.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="equipment" className="pt-4">
                <SiteEquipmentTable equipment={currentSite.equipment} />
              </TabsContent>

              <TabsContent value="inspections" className="pt-4">
                <SiteInspectionHistory workOrders={currentSite.workOrders} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
