import { createFileRoute } from '@tanstack/react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { technicianQueries } from '#/features/technician/query'
import { technicianScheduleSearchSchema } from '#/features/technician/types'
import { TechnicianScheduleRoot } from '#/features/technician/components/TechnicianScheduleRoot'
import { Skeleton } from '#/features/shared/components/ui/skeleton'

export const Route = createFileRoute('/_auth/_technician/week-schedule')({
  validateSearch: technicianScheduleSearchSchema,
  beforeLoad: async ({ context: { queryClient }, search }) => {
    await queryClient.prefetchQuery(technicianQueries.day(search.date))
  },
  component: TechnicianSchedulePageRoute,
})

function TechnicianSchedulePageRoute() {
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data, isLoading } = useQuery({
    ...technicianQueries.day(searchParams.date),
    placeholderData: keepPreviousData,
  })

  const handleSelectDate = (newDate: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        date: newDate,
      }),
      replace: true,
    })
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto pb-16 w-full">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <TechnicianScheduleRoot
      data={data}
      onSelectDate={handleSelectDate}
      selectedWoId={searchParams.selectedWoId}
    />
  )
}
