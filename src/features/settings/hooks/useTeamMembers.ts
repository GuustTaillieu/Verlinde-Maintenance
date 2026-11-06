import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createTeamMemberFn,
  type TeamMemberDto,
} from '../server/settingsMutations'
import { teamMemberKeys, teamMemberQueries } from '../query'
import { maintenanceKeys } from '#/features/maintenance/query'

export { teamMemberKeys } from '../query'
export const TEAM_MEMBERS_QUERY_KEY = teamMemberKeys.all

export function useTeamMemberMutations() {
  const queryClient = useQueryClient()

  const createMember = useMutation({
    mutationFn: (data: {
      name: string
      email: string
      role: 'MANAGER' | 'TECHNICIAN'
      title?: string
      specialties?: string[]
      weeklySchedule?: {
        mon: number
        tue: number
        wed: number
        thu: number
        fri: number
      }
    }) => createTeamMemberFn({ data }),
    onMutate: async (newMemberData) => {
      await queryClient.cancelQueries({ queryKey: teamMemberKeys.list() })
      const previousMembers = queryClient.getQueryData<TeamMemberDto[]>(teamMemberKeys.list())

      const optimisticMember: TeamMemberDto = {
        id: `optimistic_${Date.now()}`,
        name: newMemberData.name,
        email: newMemberData.email,
        role: newMemberData.role,
        isContractor: false,
        techCode: null,
        initials: newMemberData.name.slice(0, 2).toUpperCase(),
        title:
          newMemberData.title ||
          (newMemberData.role === 'MANAGER' ? 'Projectbeheerder' : 'Technicus'),
        specialties: newMemberData.specialties || ['INTRUSION', 'CCTV'],
        weeklySchedule:
          newMemberData.weeklySchedule || { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
      }

      queryClient.setQueryData<TeamMemberDto[]>(teamMemberKeys.list(), (old = []) => [
        ...old,
        optimisticMember,
      ])

      return { previousMembers }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(teamMemberKeys.list(), context.previousMembers)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: teamMemberKeys.list() })
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })

  return { createMember }
}

export function useTeamMembers() {
  const query = useQuery(teamMemberQueries.list())
  const { createMember } = useTeamMemberMutations()

  return {
    ...query,
    createMember,
  }
}
