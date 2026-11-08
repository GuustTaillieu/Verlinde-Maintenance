import * as React from 'react'
import { Tabs, TabsList, TabsTrigger } from '#/features/shared/components/ui/tabs'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import { Input } from '#/features/shared/components/ui/input'
import { CheckSquare, Inbox, Search, X } from 'lucide-react'
import type { MaintenanceView, MaintenanceKPIs } from '../types'
import { MAINTENANCE_VIEW } from '../types'
import { cn } from '#/features/shared/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { maintenanceQueries } from '../query'
import { Skeleton } from '#/features/shared/components/ui/skeleton'

import { useDebounce } from '#/features/shared/hooks/useDebounce'

interface MaintenanceFilterBarProps {
  view: MaintenanceView
  onViewChange: (view: MaintenanceView) => void
  search: string
  onSearchChange: (search: string) => void
  kpis?: MaintenanceKPIs
  className?: string
}

function ExpandingSearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [isExpanded, setIsExpanded] = React.useState(Boolean(value))
  const [localSearch, setLocalSearch] = React.useState(value)
  const debouncedSearch = useDebounce(localSearch, 250)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    setLocalSearch(value)
  }, [value])

  React.useEffect(() => {
    if (debouncedSearch !== value) {
      onChange(debouncedSearch)
    }
  }, [debouncedSearch, value, onChange])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        setIsExpanded(true)
      }
      if (e.key === 'Escape' && isExpanded && !localSearch) {
        setIsExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, localSearch])

  return (
    <div className="relative flex items-center">
      {isExpanded ? (
        <div className="relative flex items-center transition-all duration-200 w-52 sm:w-72">
          <Search className="size-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            autoFocus
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Zoek klant, werf, gemeente..."
            className="pl-8 pr-7 h-8 text-xs bg-background shadow-xs"
            onBlur={() => {
              if (!localSearch) setIsExpanded(false)
            }}
          />
          {localSearch ? (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('')
                onChange('')
                inputRef.current?.focus()
              }}
              className="absolute right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2 text-[10px] font-mono text-muted-foreground/60 bg-muted px-1 rounded pointer-events-none">
              ESC
            </kbd>
          )}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Zoeken...</span>
          <kbd className="hidden sm:inline-block text-[10px] font-mono opacity-60 bg-muted px-1 rounded">
            /
          </kbd>
        </Button>
      )}
    </div>
  )
}

export function MaintenanceFilters({
  view,
  onViewChange,
  search,
  onSearchChange,
  kpis: propKpis,
  className,
}: MaintenanceFilterBarProps) {
  const query = useQuery({
    ...maintenanceQueries.kpis(),
    enabled: !propKpis,
  })

  const kpis = propKpis ?? query.data

  if (!kpis) {
    if (query.isPending) return <Skeleton className="h-9" />
    return null
  }

  const { pendingApprovalCount, overdueCount, upcomingCount, urgentFireCount } = kpis
  const activeCount = urgentFireCount + overdueCount + upcomingCount

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 pt-2',
        className
      )}
    >
      <Tabs
        value={view}
        onValueChange={(val) => onViewChange(val as MaintenanceView)}
      >
        <TabsList className="bg-muted p-0 gap-2 rounded-lg h-9">
          <TabsTrigger value={MAINTENANCE_VIEW.active} className="text-xs gap-1.5 px-3 h-7">
            <CheckSquare className="size-3.5" />
            <span>Actieve Taken</span>
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[10px] font-mono leading-none border-border"
            >
              {activeCount}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value={MAINTENANCE_VIEW.inbox} className="text-xs gap-1.5 px-3 h-7">
            <Inbox className="size-3.5" />
            <span>In Afwachting</span>
            {pendingApprovalCount > 0 ? (
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[10px] font-mono leading-none border-border"
              >
                {pendingApprovalCount}
              </Badge>
            ) : (
              <span className="text-[10px] font-mono opacity-60">(0)</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ExpandingSearchBar value={search} onChange={onSearchChange} />
    </div>
  )
}
