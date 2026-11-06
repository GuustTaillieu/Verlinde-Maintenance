import { Tabs, TabsList, TabsTrigger } from '#/features/shared/components/ui/tabs'
import { Badge } from '#/features/shared/components/ui/badge'
import type { MaintenanceFilterKey, MaintenanceKPIs } from '../types'
import { cn } from 'cn'

interface MaintenanceFilterBarProps {
  activeFilter: MaintenanceFilterKey
  onFilterChange: (filter: MaintenanceFilterKey) => void
  kpis?: MaintenanceKPIs
  className?: string
}

export function MaintenanceFilterBar({
  activeFilter,
  onFilterChange,
  kpis,
  className,
}: MaintenanceFilterBarProps) {
  const urgentFire = kpis?.urgentFireCount ?? 0
  const overdue = kpis?.overdueCount ?? 0
  const pending = kpis?.pendingApprovalCount ?? 0
  const upcoming = kpis?.upcomingCount ?? 0
  const total = urgentFire + overdue + pending + upcoming

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3', className)}>
      <Tabs
        value={activeFilter}
        onValueChange={(val) => onFilterChange(val as MaintenanceFilterKey)}
        className="w-full sm:w-auto"
      >
        <TabsList className="inline-flex h-9 w-full sm:w-auto overflow-x-auto p-1 gap-1">
          <TabsTrigger value="all" className="text-xs gap-1.5 px-3">
            <span>Alles</span>
            <span className="text-[10px] font-mono opacity-70">({total})</span>
          </TabsTrigger>

          <TabsTrigger value="kritiek" className="text-xs gap-1.5 px-3">
            <span>Kritiek</span>
            {urgentFire > 0 ? (
              <Badge variant="destructive" className="h-4 px-1.5 text-[10px] font-mono leading-none">
                {urgentFire}
              </Badge>
            ) : (
              <span className="text-[10px] font-mono opacity-70">(0)</span>
            )}
          </TabsTrigger>

          <TabsTrigger value="dringend" className="text-xs gap-1.5 px-3">
            <span>Dringend</span>
            {overdue > 0 ? (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-mono leading-none bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                {overdue}
              </Badge>
            ) : (
              <span className="text-[10px] font-mono opacity-70">(0)</span>
            )}
          </TabsTrigger>

          <TabsTrigger value="afwachting" className="text-xs gap-1.5 px-3">
            <span>In afwachting</span>
            {pending > 0 ? (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-mono leading-none bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">
                {pending}
              </Badge>
            ) : (
              <span className="text-[10px] font-mono opacity-70">(0)</span>
            )}
          </TabsTrigger>

          <TabsTrigger value="preventief" className="text-xs gap-1.5 px-3">
            <span>Preventief</span>
            <span className="text-[10px] font-mono opacity-70">({upcoming})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
