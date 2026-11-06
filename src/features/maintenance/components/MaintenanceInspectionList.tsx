import * as React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { maintenanceQueries } from '../query'
import { FireInspectionCard } from './FireInspectionCard'
import { MaintenanceEmptyState } from './MaintenanceEmptyState'
import { Accordion } from '#/features/shared/components/ui/accordion'
import { Skeleton } from '#/features/shared/components/ui/skeleton'
import { Button } from '#/features/shared/components/ui/button'
import { Loader2, ArrowDown } from 'lucide-react'
import type { FireInspectionItem, MaintenanceFilterKey } from '../types'

export function MaintenanceInspectionSkeleton() {
  return (
    <div className="border border-border rounded-lg bg-card p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

interface MaintenanceInspectionListProps {
  activeFilter: MaintenanceFilterKey
  onOpenPropose: (item: FireInspectionItem) => void
  onOpenUploadAttest: (item: FireInspectionItem) => void
  onConfirmAppointment: (workOrderId: string) => Promise<void>
}

export function MaintenanceInspectionList({
  activeFilter,
  onOpenPropose,
  onOpenUploadAttest,
  onConfirmAppointment,
}: MaintenanceInspectionListProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    ...maintenanceQueries.fireInspectionsInfinite(activeFilter, 25),
  })

  const loadMoreRef = React.useRef<HTMLDivElement | null>(null)

  // IntersectionObserver for seamless infinite loading
  React.useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    const el = loadMoreRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const inspections = React.useMemo(
    () => (data ? data.pages.flatMap((page) => page.items) : []),
    [data]
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        <MaintenanceInspectionSkeleton />
        <MaintenanceInspectionSkeleton />
        <MaintenanceInspectionSkeleton />
        <MaintenanceInspectionSkeleton />
      </div>
    )
  }

  if (inspections.length === 0) {
    return <MaintenanceEmptyState />
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="space-y-3">
        {inspections.map((item) => (
          <FireInspectionCard
            key={item.siteId}
            item={item}
            onOpenPropose={onOpenPropose}
            onOpenUploadAttest={onOpenUploadAttest}
            onConfirmAppointment={onConfirmAppointment}
          />
        ))}
      </Accordion>

      {/* Infinite Scroll trigger / Load more button */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="pt-4 pb-2 flex flex-col items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-xs gap-1.5 h-8 text-muted-foreground"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Meer laden...
              </>
            ) : (
              <>
                <ArrowDown className="size-3.5" />
                Meer laden
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
