import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import { DisciplineBadge } from '#/features/shared/components/DisciplineBadge'
import {
  Clock,
  MapPin,
  CheckCircle2,
  Navigation,
  Play,
  FileCheck2,
  ChevronRight,
} from 'lucide-react'
import type { TechnicianWorkOrder } from '../types'
import { cn } from '#/features/shared/lib/utils'

interface TechnicianSlotCardProps {
  slot: TechnicianWorkOrder
  onSelect: (slot: TechnicianWorkOrder) => void
}

export function TechnicianSlotCard({ slot, onSelect }: TechnicianSlotCardProps) {
  const isCompleted = slot.status === 'COMPLETED'
  const isInProgress = slot.status === 'IN_PROGRESS'

  const totalItems = slot.items.length
  const checkedItems = slot.items.filter((i) => i.isChecked).length
  const allItemsChecked = totalItems > 0 && checkedItems === totalItems

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${slot.siteAddress}, ${slot.siteCity}`
  )}`

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(slot)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(slot)
        }
      }}
      className={cn(
        'group text-left rounded-xl border bg-card p-3.5 sm:p-4 shadow-2xs transition-all cursor-pointer select-none space-y-3',
        'hover:shadow-md hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
        isCompleted
          ? 'border-l-4 border-l-emerald-500'
          : isInProgress
          ? 'border-l-4 border-l-amber-500 ring-1 ring-amber-500/20'
          : 'border-l-4 border-l-primary'
      )}
    >
      {/* Top Row: Time, Discipline & Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono font-semibold bg-background gap-1">
            <Clock className="size-3 text-primary shrink-0" />
            <span>
              {slot.startTime} – {slot.endTime}
            </span>
          </Badge>
          <span className="text-[11px] font-mono text-muted-foreground">{slot.woNumber}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <DisciplineBadge discipline={slot.primaryDiscipline} />
          <Badge
            variant={isCompleted ? 'outline' : isInProgress ? 'secondary' : 'default'}
            className={cn(
              'text-[10px] font-semibold',
              isCompleted && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
              isInProgress && 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
            )}
          >
            {isCompleted ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-2.5" />
                Voltooid
              </span>
            ) : isInProgress ? (
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Bezig
              </span>
            ) : (
              'Ingepland'
            )}
          </Badge>
        </div>
      </div>

      {/* Middle: Customer & Site Details */}
      <div className="space-y-1">
        <h3 className="font-bold text-sm sm:text-base text-foreground leading-tight group-hover:text-primary transition-colors">
          {slot.customerName}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
          <MapPin className="size-3 text-muted-foreground/80 shrink-0" />
          <span className="truncate">
            {slot.siteName} • {slot.siteAddress}, <strong className="text-foreground">{slot.siteCity}</strong>
          </span>
        </div>
      </div>

      {/* Bottom Row: Checklist Progress & Quick Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 gap-2 text-xs">
        {/* Checklist count badge */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Checklist:</span>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-mono px-1.5 py-0 h-4',
              allItemsChecked
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {checkedItems}/{totalItems} taken
          </Badge>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              window.open(mapsUrl, '_blank')
            }}
            className="size-7 p-0 text-muted-foreground hover:text-foreground"
            title="Navigeer via Google Maps"
          >
            <Navigation className="size-3.5" />
          </Button>

          <Button
            size="sm"
            variant={isCompleted ? 'outline' : isInProgress ? 'default' : 'secondary'}
            className="h-7 text-xs px-2.5 gap-1 font-semibold"
          >
            {isCompleted ? (
              <>
                <FileCheck2 className="size-3 text-emerald-500" />
                <span>Bekijk</span>
              </>
            ) : isInProgress ? (
              <>
                <Play className="size-3 fill-current" />
                <span>Verdergaan</span>
              </>
            ) : (
              <>
                <span>Start</span>
                <ChevronRight className="size-3" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
