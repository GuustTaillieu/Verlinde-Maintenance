import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useCockpitMutations } from '#/features/cockpit/hooks/useCockpitMutations'
import { DashboardInsights } from '#/features/cockpit/components/DashboardInsights'
import { FireInspectionCard } from '#/features/cockpit/components/FireInspectionCard'
import { RegionalClusterCard } from '#/features/cockpit/components/RegionalClusterCard'
import { ProposeAppointmentSheet } from '#/features/cockpit/components/ProposeAppointmentSheet'
import { UploadAttestSheet } from '#/features/cockpit/components/UploadAttestSheet'
import { ClusterDispatchDialog } from '#/features/cockpit/components/ClusterDispatchDrawer'
import { Accordion } from '#/features/shared/components/ui/accordion'
import { Tabs, TabsList, TabsTrigger } from '#/features/shared/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/features/shared/components/ui/select'
import { Button } from '#/features/shared/components/ui/button'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import type { FireTodoItem, RegionalCluster } from '#/features/cockpit/types'
import { noop, useSuspenseQuery } from '@tanstack/react-query'
import { cockpitQueryOptions } from '#/features/cockpit/query'

export const Route = createFileRoute('/_auth/_manager/dashboard')({
  loader: async ({ context: { queryClient } }) => {
    queryClient.query(cockpitQueryOptions).catch(noop)
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { data, refetch, isRefetching } = useSuspenseQuery(cockpitQueryOptions)
  const {
    proposeFireMut,
    confirmFireMut,
    uploadAttestMut,
    planClusterMut,
  } = useCockpitMutations()

  const [selectedFireItem, setSelectedFireItem] = useState<FireTodoItem | null>(null)
  const [isProposeOpen, setIsProposeOpen] = useState(false)
  const [isAttestOpen, setIsAttestOpen] = useState(false)

  const [selectedCluster, setSelectedCluster] = useState<RegionalCluster | null>(null)
  const [isPlanClusterOpen, setIsPlanClusterOpen] = useState(false)

  const [activeTab, setActiveTab] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('overdue')

  const handleOpenPropose = (item: FireTodoItem) => {
    setSelectedFireItem(item)
    setIsProposeOpen(true)
  }

  const handleOpenAttest = (item: FireTodoItem) => {
    setSelectedFireItem(item)
    setIsAttestOpen(true)
  }

  const handleOpenPlanCluster = (cluster: RegionalCluster) => {
    setSelectedCluster(cluster)
    setIsPlanClusterOpen(true)
  }

  const sortedFireTodos = useMemo(() => {
    if (!data?.fireTodos) return []
    const list = [...data.fireTodos]
    if (sortBy === 'name') {
      return list.sort((a, b) => a.customerName.localeCompare(b.customerName))
    }
    if (sortBy === 'city') {
      return list.sort((a, b) => a.siteCity.localeCompare(b.siteCity))
    }
    return list.sort((a, b) => b.daysOverdue - a.daysOverdue)
  }, [data?.fireTodos, sortBy])

  const sortedClusters = useMemo(() => {
    if (!data?.regionalClusters) return []
    const list = [...data.regionalClusters]
    if (sortBy === 'city') {
      return list.sort((a, b) => a.city.localeCompare(b.city))
    }
    return list.sort((a, b) => b.siteCount - a.siteCount)
  }, [data?.regionalClusters, sortBy])

  const totalCount = data.fireTodos.length + data.regionalClusters.length

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Onderhoudscockpit & Dispatching
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Overzicht van openstaande inspecties en regionale planning.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => void refetch()}
          disabled={isRefetching}
          className="h-8 text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Vernieuwen
        </Button>
      </div>

      <DashboardInsights kpis={data.kpis} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="all" className="text-xs">
              Alles ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="fire" className="text-xs">
              Brandinspecties ({data.fireTodos.length})
            </TabsTrigger>
            <TabsTrigger value="clusters" className="text-xs">
              Regio Clusters ({data.regionalClusters.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground">Sorteren op:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overdue" className="text-xs">
                Achterstand
              </SelectItem>
              <SelectItem value="city" className="text-xs">
                Gemeente
              </SelectItem>
              <SelectItem value="name" className="text-xs">
                Klantnaam
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {totalCount === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-2">
            <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
            <h3 className="font-semibold text-sm">Geen openstaande acties</h3>
            <p className="text-xs text-muted-foreground">
              Alle periodieke onderhoudsbeurten en keuringen zijn tijdig ingepland en up-to-date.
            </p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {(activeTab === 'all' || activeTab === 'fire') &&
              sortedFireTodos.map((item) => (
                <FireInspectionCard
                  key={item.siteId}
                  item={item}
                  onOpenPropose={handleOpenPropose}
                  onOpenUploadAttest={handleOpenAttest}
                  onConfirmAppointment={async (workOrderId) => {
                    await confirmFireMut.mutateAsync({ workOrderId })
                  }}
                />
              ))}

            {(activeTab === 'all' || activeTab === 'clusters') &&
              sortedClusters.map((cluster) => (
                <RegionalClusterCard
                  key={cluster.city}
                  cluster={cluster}
                  onOpenPlan={handleOpenPlanCluster}
                />
              ))}
          </Accordion>
        )}
      </div>

      <ProposeAppointmentSheet
        item={selectedFireItem}
        open={isProposeOpen}
        onOpenChange={setIsProposeOpen}
        onConfirm={async (payload) => {
          await proposeFireMut.mutateAsync(payload)
        }}
      />

      <UploadAttestSheet
        item={selectedFireItem}
        open={isAttestOpen}
        onOpenChange={setIsAttestOpen}
        onConfirm={async (payload) => {
          await uploadAttestMut.mutateAsync(payload)
        }}
      />

      <ClusterDispatchDialog
        cluster={selectedCluster}
        open={isPlanClusterOpen}
        onOpenChange={setIsPlanClusterOpen}
        onConfirm={async (payload) => {
          await planClusterMut.mutateAsync(payload)
        }}
      />
    </div>
  )
}
