import { Button } from '#/features/shared/components/ui/button'
import { DialogFooter } from '#/features/shared/components/ui/dialog'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface DispatchFooterProps {
  selectedCount: number
  techName: string
  weekLabel: string
  isSubmitting: boolean
  isOverCapacity: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DispatchFooter({
  selectedCount,
  techName,
  weekLabel,
  isSubmitting,
  isOverCapacity,
  onCancel,
  onConfirm,
}: DispatchFooterProps) {
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
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-xs h-8"
        >
          Annuleren
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onConfirm}
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

