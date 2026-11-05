import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CockpitData, FireTodoItem } from '../types'
import { confirmFireAppointmentFn, proposeFireAppointmentFn } from '../server/postFireAppointment'
import { uploadFireAttestFn } from '../server/postFireAttest'
import { planClusterBatchFn } from '../server/postClusterBatch'
import { COCKPIT_QUERY_KEY } from '../query'


export function useCockpitMutations() {
  const queryClient = useQueryClient()


  const proposeFireMut = useMutation({
    mutationFn: (data: {
      siteId: string
      customerId: string
      proposedDate: string
      startTime?: string
      endTime?: string
    }) => proposeFireAppointmentFn({ data }),
    onMutate: async (newProposal) => {
      await queryClient.cancelQueries({ queryKey: COCKPIT_QUERY_KEY })
      const previous = queryClient.getQueryData<CockpitData>(COCKPIT_QUERY_KEY)

      if (previous) {
        queryClient.setQueryData<CockpitData>(COCKPIT_QUERY_KEY, (old) => {
          if (!old) return old

          let changedFromUrgent = false
          const updatedTodos = old.fireTodos.map((todo) => {
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

          return {
            ...old,
            kpis: {
              ...old.kpis,
              urgentFireCount: changedFromUrgent
                ? Math.max(0, old.kpis.urgentFireCount - 1)
                : old.kpis.urgentFireCount,
              pendingApprovalCount: old.kpis.pendingApprovalCount + 1,
            },
            fireTodos: updatedTodos,
          }
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(COCKPIT_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: COCKPIT_QUERY_KEY })
    },
  })

  const confirmFireMut = useMutation({
    mutationFn: (data: { workOrderId: string }) => confirmFireAppointmentFn({ data }),
    onMutate: async ({ workOrderId }) => {
      await queryClient.cancelQueries({ queryKey: COCKPIT_QUERY_KEY })
      const previous = queryClient.getQueryData<CockpitData>(COCKPIT_QUERY_KEY)

      if (previous) {
        queryClient.setQueryData<CockpitData>(COCKPIT_QUERY_KEY, (old) => {
          if (!old) return old
          return {
            ...old,
            fireTodos: old.fireTodos.map((todo) =>
              todo.workOrderId === workOrderId
                ? { ...todo, stage: 'AWAITING_ATTEST' as const }
                : todo
            ),
          }
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(COCKPIT_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: COCKPIT_QUERY_KEY })
    },
  })

  const uploadAttestMut = useMutation({
    mutationFn: (data: {
      workOrderId: string
      siteId: string
      certificateDocument: string
      officeNotes?: string
    }) => uploadFireAttestFn({ data }),
    onMutate: async ({ siteId }) => {
      await queryClient.cancelQueries({ queryKey: COCKPIT_QUERY_KEY })
      const previous = queryClient.getQueryData<CockpitData>(COCKPIT_QUERY_KEY)

      if (previous) {
        queryClient.setQueryData<CockpitData>(COCKPIT_QUERY_KEY, (old) => {
          if (!old) return old
          return {
            ...old,
            fireTodos: old.fireTodos.filter((t) => t.siteId !== siteId),
            kpis: {
              ...old.kpis,
              pendingApprovalCount: Math.max(0, old.kpis.pendingApprovalCount - 1),
            },
          }
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(COCKPIT_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: COCKPIT_QUERY_KEY })
    },
  })

  const planClusterMut = useMutation({
    mutationFn: (data: {
      siteIds?: string[]
      techId: string
      plannedDate?: string
      assignments?: Array<{
        siteId?: string
        siteIds?: string[]
        techId: string
        plannedDate: string
        startTime: string
        endTime: string
      }>
    }) => planClusterBatchFn({ data }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: COCKPIT_QUERY_KEY })
      const previous = queryClient.getQueryData<CockpitData>(COCKPIT_QUERY_KEY)

      const dispatchedSiteIds = new Set<string>()
      if (data.assignments) {
        data.assignments.forEach((a) => {
          if (a.siteIds) a.siteIds.forEach((id) => dispatchedSiteIds.add(id))
          if (a.siteId) dispatchedSiteIds.add(a.siteId)
        })
      } else if (data.siteIds) {
        data.siteIds.forEach((id) => dispatchedSiteIds.add(id))
      }

      if (previous) {
        queryClient.setQueryData<CockpitData>(COCKPIT_QUERY_KEY, (old) => {
          if (!old) return old

          let removedOverdue = 0
          const updatedClusters = old.regionalClusters
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
                estimatedHours: Math.round(
                  remainingSites.reduce((sum, s) => sum + s.durationHours, 0) * 10
                ) / 10,
              }
            })
            .filter((c) => c.siteCount > 0)

          return {
            ...old,
            kpis: {
              ...old.kpis,
              overdueCount: Math.max(0, old.kpis.overdueCount - removedOverdue),
            },
            regionalClusters: updatedClusters,
          }
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(COCKPIT_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: COCKPIT_QUERY_KEY })
    },
  })

  return {
    proposeFireMut,
    confirmFireMut,
    uploadAttestMut,
    planClusterMut,
  }
}
export type { FireTodoItem }
