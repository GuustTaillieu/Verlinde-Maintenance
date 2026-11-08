import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clientQueries } from '#/features/clients/query'
import { ConfidentialAccessVault } from '#/features/clients/components/ConfidentialAccessVault'
import { SiteEquipmentTable } from '#/features/clients/components/SiteEquipmentTable'
import { SiteInspectionHistory } from '#/features/clients/components/SiteInspectionHistory'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '#/features/shared/components/ui/sheet'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/features/shared/components/ui/tabs'
import { Skeleton } from '#/features/shared/components/ui/skeleton'
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
} from 'lucide-react'

interface ClientDetailDrawerProps {
  clientId: string | null
  onClose: () => void
}

export function ClientDetailDrawer({ clientId, onClose }: ClientDetailDrawerProps) {
  const isOpen = Boolean(clientId)

  const { data: client, isLoading, isError } = useQuery({
    ...clientQueries.detail(clientId ?? ''),
    enabled: Boolean(clientId),
  })

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)

  // Keep selected site in sync or default to first site
  const currentSite =
    client?.sites.find((s) => s.id === selectedSiteId) ?? client?.sites[0] ?? null

  const getDisciplineIcon = (disc: string) => {
    switch (disc) {
      case 'FIRE':
        return <Flame className="size-3 text-red-500" />
      case 'INTRUSION':
        return <Shield className="size-3 text-blue-500" />
      case 'CCTV':
        return <Video className="size-3 text-purple-500" />
      case 'ACCESS':
        return <KeyRound className="size-3 text-amber-500" />
      default:
        return <ShieldCheck className="size-3" />
    }
  }

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'COMPLIANT':
        return (
          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1 font-semibold text-xs">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            In orde
          </Badge>
        )
      case 'DUE_SOON':
        return (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 gap-1 font-semibold text-xs">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Naderend (30-60d)
          </Badge>
        )
      case 'OVERDUE':
        return (
          <Badge variant="destructive" className="gap-1 font-semibold text-xs">
            <AlertTriangle className="size-3" />
            Vervallen / Urgent
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl overflow-y-auto p-0 flex flex-col gap-0"
      >
        {isLoading ? (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : isError || !client ? (
          <div className="p-6 text-center text-muted-foreground">
            <AlertTriangle className="size-8 mx-auto text-red-500 mb-2" />
            <p className="font-medium text-foreground">Klant niet gevonden</p>
            <p className="text-xs mt-1">Kon de details van deze klant niet laden.</p>
          </div>
        ) : (
          <>
            {/* Header / Profile section */}
            <div className="border-b border-border bg-muted/20 p-6 space-y-4">
              <SheetHeader className="text-left space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      {client.code}
                    </span>
                    <Badge variant={client.type === 'B2B' ? 'secondary' : 'outline'} className="text-[11px]">
                      {client.type === 'B2B' ? 'B2B (Onderneming)' : 'Particulier'}
                    </Badge>
                  </div>
                  {getHealthBadge(client.healthStatus)}
                </div>

                <SheetTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Building2 className="size-5 text-primary shrink-0" />
                  <span>{client.name}</span>
                </SheetTitle>

                <SheetDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                  {client.vatNumber && <span>Btw: {client.vatNumber}</span>}
                  {client.invoiceCity && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {client.invoiceAddress}, {client.invoiceZip} {client.invoiceCity}
                    </span>
                  )}
                </SheetDescription>
              </SheetHeader>

              {/* Quick Contact & Info Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
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

                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Systemen:</span>
                  <div className="flex items-center gap-1">
                    {client.disciplines.map((disc) => (
                      <span
                        key={disc}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-background border border-border"
                      >
                        {getDisciplineIcon(disc)}
                        {disc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sites / Properties Section */}
            <div className="p-6 space-y-6 flex-1">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-primary" />
                    <span>Installatielocaties ({client.sites.length})</span>
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Selecteer een site voor apparatuur & alarmcode
                  </span>
                </div>

                {/* Site selector pills */}
                {client.sites.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-3">
                    {client.sites.map((site) => {
                      const isSelected = (currentSite?.id ?? client.sites[0].id) === site.id
                      return (
                        <button
                          type="button"
                          key={site.id}
                          onClick={() => setSelectedSiteId(site.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <span>{site.name}</span>
                          <span className="text-[10px] opacity-75 font-mono">
                            {site.sheetNumber}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Current Active Site Detail Card */}
                {currentSite && (
                  <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-foreground">
                            {currentSite.name}
                          </h4>
                          <span className="font-mono text-[11px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            Fiche {currentSite.sheetNumber}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted/60 border border-border">
                            {getDisciplineIcon(currentSite.primaryDiscipline)}
                            {currentSite.primaryDiscipline}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <MapPin className="size-3 shrink-0" />
                          <span>
                            {currentSite.siteAddress}, {currentSite.siteZip} {currentSite.siteCity}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-7 text-xs gap-1"
                        >
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${currentSite.siteAddress}, ${currentSite.siteCity}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-3" />
                            <span>Navigeer (GPS)</span>
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Zero-Trust Confidential Access Vault */}
                    <ConfidentialAccessVault
                      accessNotes={currentSite.accessNotesConfidential}
                      siteName={currentSite.name}
                    />

                    {/* Site Maintenance Specs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-muted/30 p-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Frequentie</span>
                        <span className="font-medium text-foreground">
                          {currentSite.frequency || 'Jaarlijks (12m)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Laatste Keuring</span>
                        <span className="font-medium text-foreground">
                          {currentSite.lastServiceDate || 'Geen record'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Volgende Keuring</span>
                        <span className="font-medium text-foreground">
                          {currentSite.nextDueDate || 'Niet ingepland'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Status</span>
                        <div>{getHealthBadge(currentSite.healthStatus)}</div>
                      </div>
                    </div>

                    {/* Tabbed view: Equipment vs Inspection Audit Trail */}
                    <Tabs defaultValue="equipment" className="w-full pt-2">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="equipment" className="gap-1.5 text-xs">
                          <Layers className="size-3.5" />
                          <span>Apparatuur & Batterijen ({currentSite.equipment.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="inspections" className="gap-1.5 text-xs">
                          <History className="size-3.5" />
                          <span>Keuringshistoriek ({currentSite.workOrders.length})</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="equipment" className="pt-3">
                        <SiteEquipmentTable equipment={currentSite.equipment} />
                      </TabsContent>

                      <TabsContent value="inspections" className="pt-3">
                        <SiteInspectionHistory workOrders={currentSite.workOrders} />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
