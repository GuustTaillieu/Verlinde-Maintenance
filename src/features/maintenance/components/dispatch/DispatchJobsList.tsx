import * as React from 'react'
import { Checkbox } from '#/features/shared/components/ui/checkbox'
import { Button } from '#/features/shared/components/ui/button'
import { Clock, Wrench, Plus, ChevronDown, ChevronUp, History } from 'lucide-react'
import { useClusterDispatch } from './ClusterDispatchContext'

export function DispatchJobsList() {
  const { cluster, planner } = useClusterDispatch()
  const { city, sites } = cluster
  const { selectedSiteIds, handleToggleSite, handleSelectAll, totalSelectedHours } = planner

  const [showAllLeftovers, setShowAllLeftovers] = React.useState(false)

  const isSiteSelected = React.useCallback(
    (s: { id: string; siteIds: string[] }) =>
      selectedSiteIds.includes(s.id) ||
      s.siteIds.some((id) => selectedSiteIds.includes(id)),
    [selectedSiteIds]
  )

  const selectedSites = React.useMemo(
    () => sites.filter(isSiteSelected),
    [sites, isSiteSelected]
  )

  const unselectedSites = React.useMemo(
    () => sites.filter((s) => !isSiteSelected(s)),
    [sites, isSiteSelected]
  )

  const isAllSelected = selectedSites.length === sites.length && sites.length > 0
  const isIndeterminate = selectedSites.length > 0 && selectedSites.length < sites.length

  const getSiteSubtitle = (site: { name: string; customerName?: string | null; address?: string | null }) => {
    const cleanAddress =
      site.address && !site.address.toLowerCase().includes('onbekend')
        ? site.address.trim()
        : null
    const customerPrefix =
      site.customerName && site.customerName !== site.name ? site.customerName : null
    return [customerPrefix, cleanAddress || (customerPrefix ? null : city)].filter(Boolean).join(' • ')
  }

  const handleAddAllLeftovers = () => {
    handleSelectAll()
    setShowAllLeftovers(false)
  }

  return (
    <div className="w-95 flex flex-col h-full min-h-0 bg-muted/10 shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground select-none">
            Werven in {city}
          </h3>
          <span className="text-[11px] font-mono text-muted-foreground">
            ~{totalSelectedHours}u totaal
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="select-all-jobs"
            checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
            onCheckedChange={handleSelectAll}
            className="opacity-90"
          />
          <label htmlFor="select-all-jobs" className="text-[11px] text-muted-foreground block cursor-pointer select-none">
            {selectedSites.length} van {sites.length} {sites.length === 1 ? 'werf' : 'werven'} geselecteerd
          </label>
        </div>
      </div>

      {/* Jobs Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {planner.isPastWeek && (
          <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <History className="size-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              U bekijkt een week in het verleden. Kies een toekomstige week om werven te reserveren.
            </span>
          </div>
        )}

        {/* Render selected jobs */}
        {selectedSites.map((site) => {
          const subtitle = getSiteSubtitle(site)
          return (
            <div
              key={site.id}
              onClick={() => handleToggleSite(site.id)}
              className="rounded-lg border border-primary/50 bg-primary/5 shadow-2xs p-2.5 text-xs cursor-pointer transition-colors select-none"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Checkbox
                  checked={true}
                  onCheckedChange={() => handleToggleSite(site.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 opacity-90 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-semibold text-foreground truncate"
                    title={site.name}
                  >
                    {site.name}
                  </div>
                  {subtitle && (
                    <div
                      className="text-[11px] text-muted-foreground truncate"
                      title={subtitle}
                    >
                      {subtitle}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2 text-[10px] text-primary font-mono font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {site.durationHours}u werk
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Wrench className="size-3" />
                      {site.sheetNumbers.length > 1
                        ? `${site.sheetNumbers.length} installaties`
                        : site.disciplines[0] || 'Onderhoud'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* If no jobs are currently selected */}
        {selectedSites.length === 0 && (
          <div className="p-4 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
            Geen werven geselecteerd. Klik op een werf hieronder om in te plannen.
          </div>
        )}

        {/* Button to add all remaining leftovers in the same city */}
        {unselectedSites.length > 0 && (
          <div className="pt-2 space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAllLeftovers}
              className="w-full text-xs h-8 gap-1.5 text-foreground hover:bg-primary/10 border-dashed border-primary/40 font-medium"
            >
              <Plus className="size-3.5 text-primary" />
              Voeg overige {unselectedSites.length} {unselectedSites.length === 1 ? 'werf' : 'werven'} in {city} toe
            </Button>

            <button
              type="button"
              onClick={() => setShowAllLeftovers((prev) => !prev)}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-1 transition-colors"
            >
              <span>{showAllLeftovers ? 'Verberg overige werven' : `Bekijk ${unselectedSites.length} niet-geselecteerde werven`}</span>
              {showAllLeftovers ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>

            {/* Expandable list of unselected leftover sites */}
            {showAllLeftovers && (
              <div className="space-y-2 pt-1 border-t border-border/50">
                {unselectedSites.map((site) => {
                  const subtitle = getSiteSubtitle(site)
                  return (
                    <div
                      key={site.id}
                      onClick={() => handleToggleSite(site.id)}
                      className="rounded-lg border border-border bg-card hover:bg-muted/40 opacity-80 p-2.5 text-xs cursor-pointer transition-colors select-none"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => handleToggleSite(site.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 opacity-90 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm font-medium text-foreground/80 truncate"
                            title={site.name}
                          >
                            {site.name}
                          </div>
                          {subtitle && (
                            <div
                              className="text-[11px] text-muted-foreground truncate"
                              title={subtitle}
                            >
                              {subtitle}
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <Clock className="size-3" />
                            {site.durationHours}u werk
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
