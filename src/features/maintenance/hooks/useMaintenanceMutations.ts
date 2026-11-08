import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  MaintenanceKPIs,
  MaintenanceCluster,
  ProposeFireAppointmentInput,
  ConfirmFireAppointmentInput,
  UploadFireAttestInput,
  PlanClusterBatchInput,
  PaginatedInspectionsResult,
} from '../types'
import {
  confirmFireAppointmentFn,
  proposeFireAppointmentFn,
} from '../server/postFireAppointment'
import { uploadFireAttestFn } from '../server/postFireAttest'
import { planClusterBatchFn } from '../server/postClusterBatch'
import { maintenanceKeys } from '../query'

export function useMaintenanceMutations() {
  const queryClient = useQueryClient()

  const proposeFireMut = useMutation({
    mutationFn: (data: ProposeFireAppointmentInput) => proposeFireAppointmentFn({ data }),
    onMutate: async (newProposal) => {
      // 1. Cancel outgoing queries across maintenance namespace
      await queryClient.cancelQueries({ queryKey: maintenanceKeys.all })

      // 2. Snapshot previous cache values for multi-cache rollback
      const prevKpis = queryClient.getQueryData<MaintenanceKPIs>(maintenanceKeys.kpis())
      const prevInfiniteQueries = queryClient.getQueriesData<
        InfiniteData<PaginatedInspectionsResult>
      >({ queryKey: ['maintenance', 'inspections-infinite'] })

      let changedFromUrgent = false

      // 3. Optimistically update all infinite query pages
      queryClient.setQueriesData<InfiniteData<PaginatedInspectionsResult>>(
        { queryKey: ['maintenance', 'inspections-infinite'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => {
                if (item.siteId === newProposal.siteId) {
                  if (item.stage === 'NEEDS_PROPOSAL') changedFromUrgent = true
                  return {
                    ...item,
                    stage: 'PENDING_APPROVAL' as const,
                    proposedDate: newProposal.proposedDate,
                    plannedStartTime: newProposal.startTime || '09:00',
                    plannedEndTime: newProposal.endTime || '11:00',
                  }
                }
                return item
              }),
            })),
          }
        }
      )

      // 4. Optimistically update KPI indicators
      if (prevKpis) {
        queryClient.setQueryData<MaintenanceKPIs>(maintenanceKeys.kpis(), (old) => {
          if (!old) return old
          return {
            ...old,
            urgentFireCount: changedFromUrgent
              ? Math.max(0, old.urgentFireCount - 1)
              : old.urgentFireCount,
            pendingApprovalCount: old.pendingApprovalCount + 1,
          }
        })
      }

      return { prevKpis, prevInfiniteQueries }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevKpis) {
        queryClient.setQueryData(maintenanceKeys.kpis(), context.prevKpis)
      }
      if (context?.prevInfiniteQueries) {
        for (const [key, data] of context.prevInfiniteQueries) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error('Fout bij voorstellen van afspraak', {
        description: 'De wijziging kon niet worden opgeslagen. Probeer het opnieuw.',
      })
    },
    onSuccess: () => {
      toast.success('Afspraakvoorstel verzonden', {
        description: 'Het voorstel is naar Brandtec BV en de klant verzonden.',
      })
    },


    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })

  const confirmFireMut = useMutation({
    mutationFn: (data: ConfirmFireAppointmentInput) => confirmFireAppointmentFn({ data }),
    onMutate: async ({ workOrderId }) => {
      await queryClient.cancelQueries({ queryKey: maintenanceKeys.all })

      const prevInfiniteQueries = queryClient.getQueriesData<
        InfiniteData<PaginatedInspectionsResult>
      >({ queryKey: ['maintenance', 'inspections-infinite'] })

      queryClient.setQueriesData<InfiniteData<PaginatedInspectionsResult>>(
        { queryKey: ['maintenance', 'inspections-infinite'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => {
                if (item.workOrderId === workOrderId) {
                  return {
                    ...item,
                    stage: 'AWAITING_ATTEST' as const,
                  }
                }
                return item
              }),
            })),
          }
        }
      )

      return { prevInfiniteQueries }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevInfiniteQueries) {
        for (const [key, data] of context.prevInfiniteQueries) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error('Fout bij vastleggen van afspraak', {
        description: 'De afspraak kon niet worden bevestigd.',
      })
    },
    onSuccess: () => {
      toast.success('Afspraak definitief vastgelegd', {
        description: 'De afspraak staat nu definitief op de agenda van de technicus.',
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })

  const uploadAttestMut = useMutation({
    mutationFn: (data: UploadFireAttestInput) => uploadFireAttestFn({ data }),
    onMutate: async ({ siteId }) => {
      await queryClient.cancelQueries({ queryKey: maintenanceKeys.all })

      const prevKpis = queryClient.getQueryData<MaintenanceKPIs>(maintenanceKeys.kpis())
      const prevInfiniteQueries = queryClient.getQueriesData<
        InfiniteData<PaginatedInspectionsResult>
      >({ queryKey: ['maintenance', 'inspections-infinite'] })

      queryClient.setQueriesData<InfiniteData<PaginatedInspectionsResult>>(
        { queryKey: ['maintenance', 'inspections-infinite'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.siteId === siteId
                  ? { ...item, stage: 'COMPLETED' as const }
                  : item
              ),
            })),
          }
        }
      )

      if (prevKpis) {
        queryClient.setQueryData<MaintenanceKPIs>(maintenanceKeys.kpis(), (old) => {
          if (!old) return old
          return {
            ...old,
            pendingApprovalCount: Math.max(0, old.pendingApprovalCount - 1),
          }
        })
      }

      return { prevKpis, prevInfiniteQueries }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevKpis) {
        queryClient.setQueryData(maintenanceKeys.kpis(), context.prevKpis)
      }
      if (context?.prevInfiniteQueries) {
        for (const [key, data] of context.prevInfiniteQueries) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error('Fout bij opslaan keuringsattest', {
        description: 'Het attest kon niet worden verwerkt.',
      })
    },
    onSuccess: () => {
      toast.success('Keuringsattest opgeslagen', {
        description: 'Wettelijke cyclus NBN S 21-100 afgerond. Geldigheid met 1 jaar verlengd.',
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })

  const planClusterMut = useMutation({
    mutationFn: (data: PlanClusterBatchInput) => planClusterBatchFn({ data }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: maintenanceKeys.all })

      const prevClusters = queryClient.getQueryData<MaintenanceCluster[]>(
        maintenanceKeys.clusters()
      )
      const prevKpis = queryClient.getQueryData<MaintenanceKPIs>(maintenanceKeys.kpis())
      const prevInfiniteQueries = queryClient.getQueriesData<
        InfiniteData<PaginatedInspectionsResult>
      >({ queryKey: ['maintenance', 'inspections-infinite'] })

      const dispatchedSiteIds = new Set<string>()
      if (data.assignments) {
        data.assignments.forEach((a) => {
          if (a.siteIds) a.siteIds.forEach((id) => dispatchedSiteIds.add(id))
          if (a.siteId) dispatchedSiteIds.add(a.siteId)
        })
      } else if (data.siteIds) {
        data.siteIds.forEach((id) => dispatchedSiteIds.add(id))
      }

      let removedOverdue = 0

      if (prevClusters) {
        queryClient.setQueryData<MaintenanceCluster[]>(maintenanceKeys.clusters(), (old = []) =>
          old
            .map((cluster) => {
              const remainingSites = cluster.sites.filter((site) => {
                const isDispatched = site.siteIds.some((id) => dispatchedSiteIds.has(id))
                if (isDispatched && site.daysOverdue > 0) {
                  removedOverdue++
                }
                return !isDispatched
              })

              return {
                ...cluster,
                siteCount: remainingSites.length,
                totalSheetsCount: remainingSites.reduce((sum, s) => sum + s.sheetNumbers.length, 0),
                sites: remainingSites,
                estimatedHours:
                  Math.round(remainingSites.reduce((sum, s) => sum + s.durationHours, 0) * 10) / 10,
              }
            })
            .filter((c) => c.siteCount > 0)
        )
      }

      // Optimistically update infinite inspections
      queryClient.setQueriesData<InfiniteData<PaginatedInspectionsResult>>(
        { queryKey: ['maintenance', 'inspections-infinite'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                dispatchedSiteIds.has(item.siteId)
                  ? { ...item, stage: 'PENDING_APPROVAL' as const }
                  : item
              ),
            })),
          }
        }
      )

      if (prevKpis) {
        queryClient.setQueryData<MaintenanceKPIs>(maintenanceKeys.kpis(), (old) => {
          if (!old) return old
          return {
            ...old,
            overdueCount: Math.max(0, old.overdueCount - removedOverdue),
            pendingApprovalCount: old.pendingApprovalCount + dispatchedSiteIds.size,
          }
        })
      }

      return { prevClusters, prevKpis, prevInfiniteQueries }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevClusters) {
        queryClient.setQueryData(maintenanceKeys.clusters(), context.prevClusters)
      }
      if (context?.prevKpis) {
        queryClient.setQueryData(maintenanceKeys.kpis(), context.prevKpis)
      }
      if (context?.prevInfiniteQueries) {
        for (const [key, data] of context.prevInfiniteQueries) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error('Fout bij batch-inplanning', {
        description: 'De planning kon niet worden opgeslagen.',
      })
    },
    onSuccess: (result) => {
      const count = result?.count ?? 'Werven'
      toast.success(`${count} werven succesvol ingepland`, {
        description: 'E-mail verzonden naar de klant(en) met de bevestigingslink voor de gereserveerde tijdsloten.',
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })

  return {
    proposeFireMut,
    confirmFireMut,
    uploadAttestMut,
    planClusterMut,
  }
}
