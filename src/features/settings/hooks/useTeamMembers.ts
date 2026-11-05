import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTeamMembersFn,
  createTeamMemberFn,
  type TeamMemberDto,
} from '../server/settingsMutations'

export const TEAM_MEMBERS_QUERY_KEY = ['settings', 'team-members'] as const

export function useTeamMembers() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: TEAM_MEMBERS_QUERY_KEY,
    queryFn: () => getTeamMembersFn(),
    staleTime: 1000 * 60,
  })

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
      await queryClient.cancelQueries({ queryKey: TEAM_MEMBERS_QUERY_KEY })
      const previousMembers = queryClient.getQueryData<TeamMemberDto[]>(TEAM_MEMBERS_QUERY_KEY)

      const optimisticMember: TeamMemberDto = {
        id: `optimistic_${Date.now()}`,
        name: newMemberData.name,
        email: newMemberData.email,
        role: newMemberData.role,
        isContractor: false,
        techCode: null,
        initials: newMemberData.name.slice(0, 2).toUpperCase(),
        title: newMemberData.title || (newMemberData.role === 'MANAGER' ? 'Projectbeheerder' : 'Technicus'),
        specialties: newMemberData.specialties || ['INTRUSION', 'CCTV'],
        weeklySchedule: newMemberData.weeklySchedule || { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
      }

      queryClient.setQueryData<TeamMemberDto[]>(TEAM_MEMBERS_QUERY_KEY, (old = []) => [
        ...old,
        optimisticMember,
      ])

      return { previousMembers }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(TEAM_MEMBERS_QUERY_KEY, context.previousMembers)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TEAM_MEMBERS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['cockpit', 'data'] })
    },
  })

  return {
    ...query,
    createMember,
  }
}

