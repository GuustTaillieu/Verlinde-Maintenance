import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { clientQueries } from '#/features/clients/query'
import { ClientFilters } from '#/features/clients/components/ClientFilters'
import { ClientTable } from '#/features/clients/components/ClientTable'
import { ClientDetailDrawer } from '#/features/clients/components/ClientDetailDrawer'
import { Header } from '#/features/shared/components/header'
import { Button } from '#/features/shared/components/ui/button'
import {
  DashboardInsightsRoot,
  InsightCard,
} from '#/features/maintenance/components/DashboardInsights'
import { getClientsFilterSchema, type GetClientsFilter } from '#/features/clients/types'
import { RefreshCw, Users, ShieldCheck, AlertTriangle, Clock } from 'lucide-react'
import { z } from 'zod'

const clientsSearchSchema = getClientsFilterSchema.extend({
  selectedId: z.string().optional(),
})

export const Route = createFileRoute('/_auth/_manager/clients')({
  validateSearch: clientsSearchSchema,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.query({
      ...clientQueries.list({ search: '', type: 'ALL', status: 'ALL', city: 'ALL' }),
      staleTime: 'static',
    })
  },
  component: ClientsPage,
})

function ClientsPage() {
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const activeFilters: GetClientsFilter = {
    search: searchParams.search ?? '',
    type: searchParams.type ?? 'ALL',
    status: searchParams.status ?? 'ALL',
    city: searchParams.city ?? 'ALL',
  }

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    ...clientQueries.list(activeFilters),
    placeholderData: keepPreviousData,
  })

  const clients = data?.items ?? []
  const availableCities = data?.cities ?? ['Zwevegem', 'Kortrijk', 'Harelbeke', 'Waregem', 'Menen']
  const counts = data?.counts ?? {
    total: clients.length,
    compliant: 0,
    dueSoon: 0,
    overdue: 0,
  }

  const handleFilterChange = (newFilters: Partial<GetClientsFilter>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...newFilters,
      }),
      replace: true,
    })
  }

  const handleResetFilters = () => {
    void navigate({
      search: (prev) => ({
        ...prev,
        search: '',
        type: 'ALL',
        status: 'ALL',
        city: 'ALL',
      }),
      replace: true,
    })
  }

  const handleSelectClient = (id: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        selectedId: id,
      }),
      replace: true,
    })
  }

  const handleCloseDrawer = () => {
    void navigate({
      search: (prev) => ({
        ...prev,
        selectedId: undefined,
      }),
      replace: true,
    })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 pb-12 w-full">
      <Header
        title="Klanten & Installaties"
        subtitle="Beheer van klantenbestand, vestigingen, beveiligingshardware en keuringsdossiers."
        rightComponent={
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="text-xs"
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Vernieuwen
          </Button>
        }
      />

      {/* KPI Cards matching Dashboard theme */}
      <DashboardInsightsRoot>
        <InsightCard
          title="Totaal Klanten"
          value={counts.total}
          icon={Users}
          subtitle="Geregistreerde dossiers"
          subtext="Actief klantenbestand"
          variant="default"
        />
        <InsightCard
          title="In orde"
          value={counts.compliant}
          icon={ShieldCheck}
          subtitle="Conform & gekeurd"
          subtext="Binnen geldig inspectie-interval"
          variant="info"
        />
        <InsightCard
          title="Naderend"
          value={counts.dueSoon}
          icon={Clock}
          subtitle="Inspectie binnen 30-60d"
          subtext="Proactief inplannen"
          variant="warning"
        />
        <InsightCard
          title="Vervallen"
          value={counts.overdue}
          icon={AlertTriangle}
          subtitle="Aandacht vereist"
          subtext="Onderhoudsinterval overschreden"
          variant="destructive"
        />
      </DashboardInsightsRoot>

      {/* Search & Filters */}
      <ClientFilters
        filters={activeFilters}
        availableCities={availableCities}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Client Table */}
      <ClientTable
        clients={clients}
        selectedClientId={searchParams.selectedId ?? null}
        onSelectClient={handleSelectClient}
      />

      {/* Customer Detail Drawer */}
      <ClientDetailDrawer
        clientId={searchParams.selectedId ?? null}
        onClose={handleCloseDrawer}
      />
    </div>
  )
}
