import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
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
import { DISCIPLINE, type MaintenanceView } from '#/features/maintenance/types'
import { RefreshCw } from 'lucide-react'
import { Button } from '#/features/shared/components/ui/button'
import { z } from 'zod'

const dashboardSearchSchema = z.object({
  view: z.enum(['active', 'inbox']).default('active').catch('active'),
  search: z.string().default('').catch(''),
})

export const Route = createFileRoute('/_auth/_manager/dashboard')({
  validateSearch: dashboardSearchSchema,
  loader: async ({ context: { queryClient } }) => {
    await Promise.allSettled([
      queryClient.query({ ...maintenanceQueries.kpis(), staleTime: 'static' }),
      queryClient.query({ ...maintenanceQueries.clusters(), staleTime: 'static' }),
    ])
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { data: kpis, refetch: refetchKpis } = useSuspenseQuery(maintenanceQueries.kpis())
  const { data: clusters = [], refetch: refetchClusters } = useQuery(maintenanceQueries.clusters())

  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const { view, setView, search, setSearch } = useMaintenanceFilters(
    searchParams.view as MaintenanceView,
    searchParams.search,
    (params) => {
      void navigate({
        search: (prev) => ({
          ...prev,
          ...(params.view ? { view: params.view } : {}),
          ...(params.search !== undefined ? { search: params.search } : {}),
        }),
        replace: true,
      })
    }
  )

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
      await Promise.allSettled([refetchKpis(), refetchClusters()])
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleOpenPropose = (item: FireInspectionItem) => {
    if (item.primaryDiscipline === DISCIPLINE.FIRE) {
      setSelectedFireItem(item)
      setIsProposeOpen(true)
      return
    }

    // Non-fire inspection (INTRUSION, CCTV, ACCESS): route directly to technician dispatch dialog
    const targetCity = (item.siteCity || 'Overig').trim()
    const matchingCluster = clusters.find(
      (c) => c.city.toLowerCase() === targetCity.toLowerCase()
    )

    if (matchingCluster) {
      let clusterToUse = matchingCluster
      const existsInCluster = matchingCluster.sites.some(
        (s) => s.id === item.siteId || s.siteIds.includes(item.siteId)
      )
      if (!existsInCluster) {
        clusterToUse = {
          ...matchingCluster,
          siteCount: matchingCluster.siteCount + 1,
          sites: [
            ...matchingCluster.sites,
            {
              id: item.siteId,
              siteIds: [item.siteId],
              sheetNumber: item.sheetNumber,
              sheetNumbers: [item.sheetNumber],
              name: item.siteName,
              customerId: item.customerId,
              customerName: item.customerName,
              customerEmail: item.customerEmail || null,
              customerPhone: item.customerPhone || null,
              address: item.siteAddress,
              city: targetCity,
              disciplines: [item.primaryDiscipline],
              equipmentCount: 1,
              durationHours: 1.5,
              nextDueDate: item.nextDueDate,
              daysOverdue: item.daysOverdue,
            },
          ],
        }
      }
      setSelectedCluster(clusterToUse)
      setSelectedBatchSiteIds([item.siteId])
      setIsPlanClusterOpen(true)
    } else {
      const fallbackCluster: MaintenanceCluster = {
        city: targetCity,
        siteCount: 1,
        totalSheetsCount: 1,
        sites: [
          {
            id: item.siteId,
            siteIds: [item.siteId],
            sheetNumber: item.sheetNumber,
            sheetNumbers: [item.sheetNumber],
            name: item.siteName,
            customerId: item.customerId,
            customerName: item.customerName,
            customerEmail: item.customerEmail || null,
            customerPhone: item.customerPhone || null,
            address: item.siteAddress,
            city: targetCity,
            disciplines: [item.primaryDiscipline],
            equipmentCount: 1,
            durationHours: 1.5,
            nextDueDate: item.nextDueDate,
            daysOverdue: item.daysOverdue,
          },
        ],
        recommendedTechId:
          targetCity.toLowerCase().includes('kortrijk') ||
          targetCity.toLowerCase().includes('wevelgem') ||
          targetCity.toLowerCase().includes('heule')
            ? 'usr_tom'
            : 'usr_jens',
        recommendedTechName:
          targetCity.toLowerCase().includes('kortrijk') ||
          targetCity.toLowerCase().includes('wevelgem') ||
          targetCity.toLowerCase().includes('heule')
            ? 'Tom De Coninck'
            : 'Jens Maes',
        estimatedHours: 1.5,
      }
      setSelectedCluster(fallbackCluster)
      setSelectedBatchSiteIds([item.siteId])
      setIsPlanClusterOpen(true)
    }
  }

  const handleOpenAttest = (item: FireInspectionItem) => {
    setSelectedFireItem(item)
    setIsAttestOpen(true)
  }

  const handleOpenPlanBatch = (cluster: MaintenanceCluster, selectedSiteIds: string[]) => {
    const targetCity = cluster.city.trim().toLowerCase()
    const authoritative = clusters.find((c) => c.city.trim().toLowerCase() === targetCity)
    setSelectedCluster(authoritative || cluster)
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
        onOpenChange={(nextOpen) => {
          setIsPlanClusterOpen(nextOpen)
          if (!nextOpen) {
            setSelectedBatchSiteIds([])
            setSelectedCluster(null)
          }
        }}
        onConfirm={async (payload) => {
          await planClusterMut.mutateAsync(payload)
        }}
      />
    </div>
  )
}
