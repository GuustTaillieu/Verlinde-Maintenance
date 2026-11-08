import { createFileRoute } from '@tanstack/react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { planningQueries } from '#/features/planning/query'
import { planningSearchSchema } from '#/features/planning/types'
import { PlanningRoot } from '#/features/planning/components/PlanningRoot'
import { getMonday, formatDateIso } from '#/features/maintenance/utils/dateUtils'
import { Skeleton } from '#/features/shared/components/ui/skeleton'

export const Route = createFileRoute('/_auth/_manager/planning')({
  validateSearch: planningSearchSchema,
  beforeLoad: async ({ context: { queryClient }, search }) => {
    const monday = search.week ? getMonday(search.week) : getMonday(new Date())
    const weekStartDate = formatDateIso(monday)
    const friday = new Date(monday)
    friday.setDate(friday.getDate() + 4)
    const weekEndDate = formatDateIso(friday)

    await queryClient.prefetchQuery(
      planningQueries.week(weekStartDate, weekEndDate)
    )
  },
  component: PlanningPage,
})

function PlanningPage() {
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const monday = searchParams.week ? getMonday(searchParams.week) : getMonday(new Date())
  const weekStartDate = formatDateIso(monday)
  const friday = new Date(monday)
  friday.setDate(friday.getDate() + 4)
  const weekEndDate = formatDateIso(friday)

  const { data, isLoading } = useQuery({
    ...planningQueries.week(weekStartDate, weekEndDate),
    placeholderData: keepPreviousData,
  })

  const activeTechId =
    searchParams.techId && searchParams.techId !== 'ALL'
      ? searchParams.techId
      : data?.technicians[0]?.id || 'usr_tom'

  const handleSelectTech = (techId: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        techId,
      }),
      replace: true,
    })
  }

  const handleSelectWeek = (mondayIso: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        week: mondayIso,
      }),
      replace: true,
    })
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-6 max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 pb-12 w-full">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <PlanningRoot
      data={data}
      activeTechId={activeTechId}
      onSelectTech={handleSelectTech}
      onSelectWeek={handleSelectWeek}
      selectedWoId={searchParams.selectedWoId}
    />
  )
}
