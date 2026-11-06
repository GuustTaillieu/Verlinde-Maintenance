import { Button } from '#/features/shared/components/ui/button'
import { DialogFooter } from '#/features/shared/components/ui/dialog'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useClusterDispatch } from './ClusterDispatchContext'

export function DispatchFooter() {
  const { planner, isSubmitting, onConfirmDispatch, onClose } = useClusterDispatch()

  const selectedCount = planner.selectedSiteIds.length
  const techName = planner.activeTech.name
  const weekLabel = planner.weekDays[0]?.dayLabel || ''
  const isOverCapacity = planner.isOverCapacity

  return (
    <DialogFooter className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
      <div className="text-xs text-muted-foreground hidden md:block">
        {selectedCount > 0 ? (
          <span>
            <strong>{selectedCount} werven</strong> ingepland voor{' '}
            <strong>{techName}</strong> in week van {weekLabel}.
          </span>
        ) : (
          <span>Selecteer minstens één werf om in te plannen.</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
          className="text-xs h-8"
        >
          Annuleren
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onConfirmDispatch}
          disabled={isSubmitting || selectedCount === 0 || isOverCapacity}
          className="text-xs h-8 gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-3.5" />
          )}
          Inplannen en Bevestigen ({selectedCount} werven)
        </Button>
      </div>
    </DialogFooter>
  )
}
