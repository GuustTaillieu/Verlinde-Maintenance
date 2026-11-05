import { Checkbox } from '#/features/shared/components/ui/checkbox'
import { Badge } from '#/features/shared/components/ui/badge'
import { Clock, Wrench } from 'lucide-react'
import type { ClusterSiteItem } from '../../types'
import type { ProposedSlot } from './useDispatchPlanner'

interface DispatchJobsListProps {
  city: string
  sites: ClusterSiteItem[]
  selectedSiteIds: string[]
  onToggleSite: (id: string) => void
  onSelectAll: () => void
  totalSelectedHours: number
}

export function DispatchJobsList({
  city,
  sites,
  selectedSiteIds,
  onToggleSite,
  onSelectAll,
  totalSelectedHours,
}: DispatchJobsListProps) {
  const isAllSelected = selectedSiteIds.length === sites.length
  const isIndeterminate = selectedSiteIds.length > 0 && selectedSiteIds.length < sites.length

  return (
    <div className="w-95 flex flex-col bg-muted/10 shrink-0">
      <div className="p-4 border-b border-border flex flex-col gap-2">
        <h3
          className="text-base font-semibold text-foreground block cursor-pointer select-none"
        >
          Werven in {city}
        </h3>
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="select-all-jobs"
            checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
            onCheckedChange={onSelectAll}
            className="opacity-90"
          />
          <label
            htmlFor="select-all-jobs"
            className="text-[11px] text-muted-foreground block">
            {selectedSiteIds.length} van {sites.length} geselecteerd (~{totalSelectedHours}u)
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sites.map((site) => {
          const isSelected = selectedSiteIds.includes(site.id)

          return (
            <div
              key={site.id}
              onClick={() => onToggleSite(site.id)}
              className={`rounded-lg border p-2.5 text-xs cursor-pointer transition-colors select-none ${isSelected
                ? 'border-primary/50 bg-primary/5 shadow-2xs'
                : 'border-border bg-card hover:bg-muted/40 opacity-75'
                }`}
            >
              <div className="flex items-start gap-2.5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSite(site.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 opacity-90"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground/90 truncate">
                    {site.name}
                  </span>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {site.address}
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-primary font-mono font-medium">
                    <Clock className="size-3" />
                    {site.durationHours}u werk
                    <Wrench className="size-3" />
                    {site.sheetNumbers.length > 1 ? `${site.sheetNumbers.length} installaties` : (site.disciplines[0] || 'Onderhoud')}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

