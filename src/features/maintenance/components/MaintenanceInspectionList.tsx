import * as React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { maintenanceQueries } from '../query'
import { FireInspectionCard } from './FireInspectionCard'
import { MaintenanceEmptyState } from './MaintenanceEmptyState'
import { Accordion } from '#/features/shared/components/ui/accordion'
import { Checkbox } from '#/features/shared/components/ui/checkbox'
import { Skeleton } from '#/features/shared/components/ui/skeleton'
import { Button } from '#/features/shared/components/ui/button'
import { Loader2, ArrowDown, MapPin, Flame, CalendarPlus, Inbox } from 'lucide-react'
import type {
  FireInspectionItem,
  MaintenanceView,
  MaintenanceCluster,
  ClusterSiteItem,
} from '../types'

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
  view: MaintenanceView
  search?: string
  onOpenPropose: (item: FireInspectionItem) => void
  onOpenUploadAttest: (item: FireInspectionItem) => void
  onConfirmAppointment: (workOrderId: string) => Promise<void>
  onOpenPlanBatch?: (cluster: MaintenanceCluster, selectedSiteIds: string[]) => void
}

export function MaintenanceInspectionList({
  view,
  search = '',
  onOpenPropose,
  onOpenUploadAttest,
  onConfirmAppointment,
  onOpenPlanBatch,
}: MaintenanceInspectionListProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    ...maintenanceQueries.fireInspectionsInfinite(view, search, 50),
  })

  // Selected site IDs grouped by municipality
  const [selectedSitesByCity, setSelectedSitesByCity] = React.useState<Record<string, string[]>>({})

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

  // Separate Fire items from Regional items in the active queue
  const fireItems = React.useMemo(
    () => inspections.filter((i) => i.primaryDiscipline === 'FIRE'),
    [inspections]
  )

  const regionalItems = React.useMemo(
    () => inspections.filter((i) => i.primaryDiscipline !== 'FIRE'),
    [inspections]
  )

  // Group regional non-fire items by municipality and sort municipalities by urgency
  const regionalGroups = React.useMemo(() => {
    const map = new Map<string, FireInspectionItem[]>()
    for (const item of regionalItems) {
      const city = item.siteCity || 'Overig'
      const list = map.get(city) || []
      list.push(item)
      map.set(city, list)
    }

    return Array.from(map.entries())
      .map(([city, items]) => {
        const overdueCount = items.filter((i) => i.daysOverdue > 0).length
        // Sort items in this municipality with overdue first
        const sortedItems = [...items].sort((a, b) => b.daysOverdue - a.daysOverdue)
        return {
          city,
          items: sortedItems,
          overdueCount,
          totalCount: items.length,
        }
      })
      .sort((a, b) => {
        // Sort municipality with the most overdue items first!
        if (a.overdueCount !== b.overdueCount) {
          return b.overdueCount - a.overdueCount
        }
        return b.totalCount - a.totalCount
      })
  }, [regionalItems])

  const handleToggleSite = (city: string, siteId: string) => {
    setSelectedSitesByCity((prev) => {
      const current = prev[city] || []
      const next = current.includes(siteId)
        ? current.filter((id) => id !== siteId)
        : [...current, siteId]
      return { ...prev, [city]: next }
    })
  }

  const handleToggleAllInCity = (city: string, citySiteIds: string[]) => {
    setSelectedSitesByCity((prev) => {
      const current = prev[city] || []
      const isAllSelected = current.length === citySiteIds.length
      return {
        ...prev,
        [city]: isAllSelected ? [] : [...citySiteIds],
      }
    })
  }

  const handleLaunchBatchPlan = (city: string, cityItems: FireInspectionItem[]) => {
    if (!onOpenPlanBatch) return
    const selectedForCity = selectedSitesByCity[city] || []
    const targetSiteIds =
      selectedForCity.length > 0 ? selectedForCity : cityItems.map((i) => i.siteId)

    const clusterSites: ClusterSiteItem[] = cityItems.map((item) => ({
      id: item.siteId,
      siteIds: [item.siteId],
      sheetNumber: item.sheetNumber,
      sheetNumbers: [item.sheetNumber],
      name: item.siteName,
      customerName: item.customerName,
      address: item.siteAddress,
      city: item.siteCity,
      disciplines: [item.primaryDiscipline],
      equipmentCount: 1,
      durationHours: 1.5,
      nextDueDate: item.nextDueDate,
      daysOverdue: item.daysOverdue,
    }))

    const cluster: MaintenanceCluster = {
      city,
      siteCount: cityItems.length,
      totalSheetsCount: cityItems.length,
      sites: clusterSites,
      recommendedTechId:
        city.toLowerCase().includes('kortrijk') ||
        city.toLowerCase().includes('wevelgem') ||
        city.toLowerCase().includes('heule')
          ? 'usr_tom'
          : 'usr_jens',
      recommendedTechName:
        city.toLowerCase().includes('kortrijk') ||
        city.toLowerCase().includes('wevelgem') ||
        city.toLowerCase().includes('heule')
          ? 'Tom Planckaert'
          : 'Jens De Smet',
      estimatedHours: Math.round(cityItems.length * 1.5 * 10) / 10,
    }

    onOpenPlanBatch(cluster, targetSiteIds)
  }

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
    return (
      <MaintenanceEmptyState
        title={view === 'inbox' ? 'Geen dossiers in afwachting' : 'Geen taken gevonden'}
        description={
          view === 'inbox'
            ? 'Alle lopende keuringen en voorstellen zijn afgerond of gearchiveerd.'
            : search
              ? `Geen resultaten gevonden voor "${search}".`
              : 'Er zijn momenteel geen openstaande taken die actie vereisen.'
        }
      />
    )
  }

  // INBOX VIEW: Flat list of dossiers waiting on client/subcontractor
  if (view === 'inbox') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1">
          <Inbox className="size-3.5 text-blue-500" />
          <span>
            {inspections.length} dossiers in afwachting van akkoord of keuringsattest
          </span>
        </div>

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
      </div>
    )
  }

  // ACTIVE QUEUE VIEW: Fire Group + Municipality Route Groups
  return (
    <div className="space-y-8">
      {/* 1. Fire Compliance Group (Branddetectie NBN S 21-100) */}
      {fireItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-red-600 dark:text-red-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Branddetectie (Wettelijk NBN S 21-100)
              </h3>
              <span className="text-[11px] font-mono text-muted-foreground">
                ({fireItems.length})
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Brandtec BV</span>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {fireItems.map((item) => (
              <FireInspectionCard
                key={item.siteId}
                item={item}
                onOpenPropose={onOpenPropose}
                onOpenUploadAttest={onOpenUploadAttest}
                onConfirmAppointment={onConfirmAppointment}
              />
            ))}
          </Accordion>
        </section>
      )}

      {/* 2. Regional Groups (Inbraak & Camera by Municipality) */}
      {regionalGroups.map(({ city, items, overdueCount }) => {
        const selected = selectedSitesByCity[city] || []
        const isAllSelected = selected.length === items.length
        const isIndeterminate = selected.length > 0 && selected.length < items.length
        const citySiteIds = items.map((i) => i.siteId)

        return (
          <section key={city} className="space-y-3">
            {/* Minimal Header */}
            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                  onCheckedChange={() => handleToggleAllInCity(city, citySiteIds)}
                  className="opacity-90"
                />
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {city}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    ({items.length} {items.length === 1 ? 'werf' : 'werven'}
                    {overdueCount > 0 && ` • ${overdueCount} achterstallig`})
                  </span>
                </div>
              </div>

              {onOpenPlanBatch && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLaunchBatchPlan(city, items)}
                  className="h-7 text-xs gap-1.5 font-medium"
                >
                  <CalendarPlus className="size-3" />
                  {selected.length > 0 && selected.length < items.length
                    ? `Plan ${selected.length} werven in`
                    : `Plan ${city} in (${items.length})`}
                </Button>
              )}
            </div>

            {/* Individual Cards */}
            <Accordion type="single" collapsible className="space-y-3">
              {items.map((item) => {
                const isSelected = selected.includes(item.siteId)
                return (
                  <FireInspectionCard
                    key={item.siteId}
                    item={item}
                    selectable
                    isSelected={isSelected}
                    onToggleSelect={(id) => handleToggleSite(city, id)}
                    onOpenPropose={onOpenPropose}
                    onOpenUploadAttest={onOpenUploadAttest}
                    onConfirmAppointment={onConfirmAppointment}
                  />
                )
              })}
            </Accordion>
          </section>
        )
      })}

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
