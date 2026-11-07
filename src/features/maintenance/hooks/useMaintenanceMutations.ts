import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  MaintenanceDashboardData,
  MaintenanceKPIs,
  FireInspectionItem,
  MaintenanceCluster,
  ProposeFireAppointmentInput,
  ConfirmFireAppointmentInput,
  UploadFireAttestInput,
  PlanClusterBatchInput,
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
      await Promise.all([
        queryClient.cancelQueries({ queryKey: maintenanceKeys.fireInspections() }),
        queryClient.cancelQueries({ queryKey: maintenanceKeys.kpis() }),
        queryClient.cancelQueries({ queryKey: maintenanceKeys.data() }),
      ])

      const prevInspections = queryClient.getQueryData<FireInspectionItem[]>(
        maintenanceKeys.fireInspections()
      )
      const prevKpis = queryClient.getQueryData<MaintenanceKPIs>(maintenanceKeys.kpis())
      const prevData = queryClient.getQueryData<MaintenanceDashboardData>(maintenanceKeys.data())

      let changedFromUrgent = false

      if (prevInspections) {
        queryClient.setQueryData<FireInspectionItem[]>(
          maintenanceKeys.fireInspections(),
          (old = []) =>
            old.map((todo) => {
              if (todo.siteId === newProposal.siteId) {
                if (todo.stage === 'NEEDS_PROPOSAL') changedFromUrgent = true
                return {
                  ...todo,
                  stage: 'PENDING_APPROVAL' as const,
                  proposedDate: newProposal.proposedDate,
                  plannedStartTime: newProposal.startTime || '09:00',
                  plannedEndTime: newProposal.endTime || '11:00',
                }
              }
              return todo
            })
        )
      }

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

      if (prevData) {
        queryClient.setQueryData<MaintenanceDashboardData>(maintenanceKeys.data(), (old) => {
          if (!old) return old
          let dataChanged = false
          const updatedInspections = old.fireInspections.map((todo) => {
            if (todo.siteId === newProposal.siteId) {
              if (todo.stage === 'NEEDS_PROPOSAL') dataChanged = true
              return {
                ...todo,
                stage: 'PENDING_APPROVAL' as const,
                proposedDate: newProposal.proposedDate,
                plannedStartTime: newProposal.startTime || '09:00',
                plannedEndTime: newProposal.endTime || '11:00',
              }
            }
            return todo
          })

          return {
            ...old,
            kpis: {
              ...old.kpis,
              urgentFireCount: dataChanged
                ? Math.max(0, old.kpis.urgentFireCount - 1)
                : old.kpis.urgentFireCount,
              pendingApprovalCount: old.kpis.pendingApprovalCount + 1,
            },
            fireInspections: updatedInspections,
          }
        })
      }

      return { prevInspections, prevKpis, prevData }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevInspections) {
        queryClient.setQueryData(maintenanceKeys.fireInspections(), context.prevInspections)
      }
      if (context?.prevKpis) {
        queryClient.setQueryData(maintenanceKeys.kpis(), context.prevKpis)
      }
      if (context?.prevData) {
        queryClient.setQueryData(maintenanceKeys.data(), context.prevData)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })

  const confirmFireMut = useMutation({
    mutationFn: (data: ConfirmFireAppointmentInput) => confirmFireAppointmentFn({ data }),
    onMutate: async ({ workOrderId }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: maintenanceKeys.fireInspections() }),
        queryClient.cancelQueries({ queryKey: maintenanceKeys.data() }),
      ])

      const prevInspections = queryClient.getQueryData<FireInspectionItem[]>(
        maintenanceKeys.fireInspections()
      )
      const prevData = queryClient.getQueryData<MaintenanceDashboardData>(maintenanceKeys.data())

      if (prevInspections) {
        queryClient.setQueryData<FireInspectionItem[]>(
          maintenanceKeys.fireInspections(),
          (old = []) =>
            old.map((todo) =>
              todo.workOrderId === workOrderId
                ? { ...todo, stage: 'AWAITING_ATTEST' as const }
                : todo
            )
        )
      }

      if (prevData) {
        queryClient.setQueryData<MaintenanceDashboardData>(maintenanceKeys.data(), (old) => {
          if (!old) return old
          return {
            ...old,
            fireInspections: old.fireInspections.map((todo) =>
              todo.workOrderId === workOrderId
                ? { ...todo, stage: 'AWAITING_ATTEST' as const }
                : todo
            ),
          }
        })
      }

      return { prevInspections, prevData }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevInspections) {
        queryClient.setQueryData(maintenanceKeys.fireInspections(), context.prevInspections)
      }
      if (context?.prevData) {
        queryClient.setQueryData(maintenanceKeys.data(), context.prevData)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })

  const uploadAttestMut = useMutation({
    mutationFn: (data: UploadFireAttestInput) => uploadFireAttestFn({ data }),
    onMutate: async ({ siteId }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: maintenanceKeys.fireInspections() }),
        queryClient.cancelQueries({ queryKey: maintenanceKeys.kpis() }),
        queryClient.cancelQueries({ queryKey: maintenanceKeys.data() }),
      ])

      const prevInspections = queryClient.getQueryData<FireInspectionItem[]>(
        maintenanceKeys.fireInspections()
      )
      const prevKpis = queryClient.getQueryData<MaintenanceKPIs>(maintenanceKeys.kpis())
      const prevData = queryClient.getQueryData<MaintenanceDashboardData>(maintenanceKeys.data())

      if (prevInspections) {
        queryClient.setQueryData<FireInspectionItem[]>(
          maintenanceKeys.fireInspections(),
          (old = []) => old.filter((t) => t.siteId !== siteId)
        )
      }

      if (prevKpis) {
        queryClient.setQueryData<MaintenanceKPIs>(maintenanceKeys.kpis(), (old) => {
          if (!old) return old
          return {
            ...old,
            pendingApprovalCount: Math.max(0, old.pendingApprovalCount - 1),
          }
        })
      }

      if (prevData) {
        queryClient.setQueryData<MaintenanceDashboardData>(maintenanceKeys.data(), (old) => {
          if (!old) return old
          return {
            ...old,
            fireInspections: old.fireInspections.filter((t) => t.siteId !== siteId),
            kpis: {
              ...old.kpis,
              pendingApprovalCount: Math.max(0, old.kpis.pendingApprovalCount - 1),
            },
          }
        })
      }

      return { prevInspections, prevKpis, prevData }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevInspections) {
        queryClient.setQueryData(maintenanceKeys.fireInspections(), context.prevInspections)
      }
      if (context?.prevKpis) {
        queryClient.setQueryData(maintenanceKeys.kpis(), context.prevKpis)
      }
      if (context?.prevData) {
        queryClient.setQueryData(maintenanceKeys.data(), context.prevData)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })

  const planClusterMut = useMutation({
    mutationFn: (data: PlanClusterBatchInput) => planClusterBatchFn({ data }),
    onMutate: async (data) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: maintenanceKeys.clusters() }),
        queryClient.cancelQueries({ queryKey: maintenanceKeys.kpis() }),
        queryClient.cancelQueries({ queryKey: maintenanceKeys.data() }),
      ])

      const prevClusters = queryClient.getQueryData<MaintenanceCluster[]>(
        maintenanceKeys.clusters()
      )
      const prevKpis = queryClient.getQueryData<MaintenanceKPIs>(maintenanceKeys.kpis())
      const prevData = queryClient.getQueryData<MaintenanceDashboardData>(maintenanceKeys.data())

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

      const filterClusterList = (clusters: MaintenanceCluster[]) => {
        return clusters
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
      }

      if (prevClusters) {
        queryClient.setQueryData<MaintenanceCluster[]>(maintenanceKeys.clusters(), (old = []) =>
          filterClusterList(old)
        )
      }

      if (prevKpis) {
        queryClient.setQueryData<MaintenanceKPIs>(maintenanceKeys.kpis(), (old) => {
          if (!old) return old
          return {
            ...old,
            overdueCount: Math.max(0, old.overdueCount - removedOverdue),
          }
        })
      }

      if (prevData) {
        queryClient.setQueryData<MaintenanceDashboardData>(maintenanceKeys.data(), (old) => {
          if (!old) return old
          let dataRemovedOverdue = 0
          const updatedClusters = old.clusters
            .map((cluster) => {
              const remainingSites = cluster.sites.filter((site) => {
                const isDispatched = site.siteIds.some((id) => dispatchedSiteIds.has(id))
                if (isDispatched && site.daysOverdue > 0) {
                  dataRemovedOverdue++
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

          return {
            ...old,
            kpis: {
              ...old.kpis,
              overdueCount: Math.max(0, old.kpis.overdueCount - dataRemovedOverdue),
            },
            clusters: updatedClusters,
          }
        })
      }

      return { prevClusters, prevKpis, prevData }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevClusters) {
        queryClient.setQueryData(maintenanceKeys.clusters(), context.prevClusters)
      }
      if (context?.prevKpis) {
        queryClient.setQueryData(maintenanceKeys.kpis(), context.prevKpis)
      }
      if (context?.prevData) {
        queryClient.setQueryData(maintenanceKeys.data(), context.prevData)
      }
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
