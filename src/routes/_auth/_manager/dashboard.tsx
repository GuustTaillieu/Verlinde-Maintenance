import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { maintenanceQueries } from '#/features/maintenance/query'
import { useMaintenanceMutations } from '#/features/maintenance/hooks/useMaintenanceMutations'
import { useMaintenanceFilters } from '#/features/maintenance/hooks/useMaintenanceFilters'
import { Header } from '#/features/shared/components/header'
import { DashboardInsights } from '#/features/maintenance/components/DashboardInsights'
import { MaintenanceFilters } from '#/features/maintenance/components/MaintenanceFilters'
import { MaintenanceInspectionList } from '#/features/maintenance/components/MaintenanceInspectionList'
import { ProposeAppointmentDialog } from '#/features/maintenance/components/ProposeAppointmentDialog'
import { UploadAttestDialog } from '#/features/maintenance/components/UploadAttestDialog'
import { ClusterDispatchDialog } from '#/features/maintenance/components/ClusterDispatchDialog'
import type { FireInspectionItem, MaintenanceCluster } from '#/features/maintenance/types'
import { RefreshCw } from 'lucide-react'
import { Button } from '#/features/shared/components/ui/button'

export const Route = createFileRoute('/_auth/_manager/dashboard')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.allSettled([
      queryClient.query({ ...maintenanceQueries.kpis(), staleTime: 'static' }),
    ])
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { data: kpis, refetch: refetchKpis } = useSuspenseQuery(maintenanceQueries.kpis())

  const [isRefreshing, setIsRefreshing] = useState(false)

  const { view, setView, search, setSearch } = useMaintenanceFilters('active')

  const {
    proposeFireMut,
    confirmFireMut,
    uploadAttestMut,
    planClusterMut,
  } = useMaintenanceMutations()

  const [selectedFireItem, setSelectedFireItem] = useState<FireInspectionItem | null>(null)
  const [isProposeOpen, setIsProposeOpen] = useState(false)
  const [isAttestOpen, setIsAttestOpen] = useState(false)

  const [selectedCluster, setSelectedCluster] = useState<MaintenanceCluster | null>(null)
  const [selectedBatchSiteIds, setSelectedBatchSiteIds] = useState<string[]>([])
  const [isPlanClusterOpen, setIsPlanClusterOpen] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetchKpis()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleOpenPropose = (item: FireInspectionItem) => {
    setSelectedFireItem(item)
    setIsProposeOpen(true)
  }

  const handleOpenAttest = (item: FireInspectionItem) => {
    setSelectedFireItem(item)
    setIsAttestOpen(true)
  }

  const handleOpenPlanBatch = (cluster: MaintenanceCluster, selectedSiteIds: string[]) => {
    setSelectedCluster(cluster)
    setSelectedBatchSiteIds(selectedSiteIds)
    setIsPlanClusterOpen(true)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 w-full">
      <Header
        title="Belangrijkste Inzichten"
        subtitle="Hieronder vindt u een overzicht van de belangrijkste inzichten."
        rightComponent={
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 text-xs gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
        }
      />

      <DashboardInsights kpis={kpis} />

      <Header title="Taken" subtitle="Hieronder vindt u een overzicht van alle taken." />

      <MaintenanceFilters
        view={view}
        onViewChange={setView}
        search={search}
        onSearchChange={setSearch}
        kpis={kpis}
      />

      <MaintenanceInspectionList
        view={view}
        search={search}
        onOpenPropose={handleOpenPropose}
        onOpenUploadAttest={handleOpenAttest}
        onConfirmAppointment={async (workOrderId) => {
          await confirmFireMut.mutateAsync({ workOrderId })
        }}
        onOpenPlanBatch={handleOpenPlanBatch}
      />

      <ProposeAppointmentDialog
        item={selectedFireItem}
        open={isProposeOpen}
        onOpenChange={setIsProposeOpen}
        onConfirm={async (payload) => {
          await proposeFireMut.mutateAsync(payload)
        }}
      />

      <UploadAttestDialog
        item={selectedFireItem}
        open={isAttestOpen}
        onOpenChange={setIsAttestOpen}
        onConfirm={async (payload) => {
          await uploadAttestMut.mutateAsync(payload)
        }}
      />

      <ClusterDispatchDialog
        cluster={selectedCluster}
        initialSelectedSiteIds={selectedBatchSiteIds}
        open={isPlanClusterOpen}
        onOpenChange={setIsPlanClusterOpen}
        onConfirm={async (payload) => {
          await planClusterMut.mutateAsync(payload)
        }}
      />
    </div>
  )
}
