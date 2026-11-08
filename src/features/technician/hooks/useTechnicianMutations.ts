import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleChecklistItemFn } from '../server/toggleChecklistItem'
import { completeWorkOrderFn } from '../server/completeWorkOrder'
import { technicianKeys } from '../query'
import { planningKeys } from '#/features/planning/query'
import { maintenanceKeys } from '#/features/maintenance/query'
import type { TechnicianDayData } from '../types'

export function useTechnicianMutations(currentDate: string) {
  const queryClient = useQueryClient()
  const dayQueryKey = technicianKeys.day(currentDate)

  // 1. Toggle Checklist Item Mutation with Optimistic Update
  const toggleItemMutation = useMutation({
    mutationFn: (variables: {
      workOrderId: string
      itemId: string
      isChecked: boolean
      description?: string
      quantity?: number
      techRemarks?: string
    }) => toggleChecklistItemFn({ data: variables }),

    onMutate: async ({ workOrderId, itemId, isChecked }) => {
      await queryClient.cancelQueries({ queryKey: dayQueryKey })

      const previousData = queryClient.getQueryData<TechnicianDayData>(dayQueryKey)

      if (previousData) {
        queryClient.setQueryData<TechnicianDayData>(dayQueryKey, {
          ...previousData,
          slots: previousData.slots.map((slot) => {
            if (slot.id !== workOrderId) return slot

            const updatedItems = slot.items.map((item) =>
              item.id === itemId ? { ...item, isChecked } : item
            )

            return {
              ...slot,
              status: slot.status === 'SCHEDULED' ? 'IN_PROGRESS' : slot.status,
              items: updatedItems,
            }
          }),
        })
      }

      return { previousData }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(dayQueryKey, context.previousData)
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: dayQueryKey })
      void queryClient.invalidateQueries({ queryKey: planningKeys.all })
    },
  })

  // 2. Complete Work Order Mutation
  const completeOrderMutation = useMutation({
    mutationFn: (variables: {
      workOrderId: string
      signedByName: string
      signatureDataUrl?: string
      techNotes?: string
    }) => completeWorkOrderFn({ data: variables }),

    onMutate: async ({ workOrderId, signedByName, techNotes }) => {
      await queryClient.cancelQueries({ queryKey: dayQueryKey })

      const previousData = queryClient.getQueryData<TechnicianDayData>(dayQueryKey)

      if (previousData) {
        const nowIso = new Date().toISOString()
        queryClient.setQueryData<TechnicianDayData>(dayQueryKey, {
          ...previousData,
          slots: previousData.slots.map((slot) => {
            if (slot.id !== workOrderId) return slot
            return {
              ...slot,
              status: 'COMPLETED',
              isSigned: true,
              signedByName,
              signedAt: nowIso,
              completedAt: nowIso,
              techNotes: techNotes || slot.techNotes,
            }
          }),
        })
      }

      return { previousData }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(dayQueryKey, context.previousData)
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: dayQueryKey })
      void queryClient.invalidateQueries({ queryKey: planningKeys.all })
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })

  return {
    toggleItem: toggleItemMutation.mutate,
    isToggling: toggleItemMutation.isPending,
    completeOrder: completeOrderMutation.mutateAsync,
    isCompleting: completeOrderMutation.isPending,
  }
}
