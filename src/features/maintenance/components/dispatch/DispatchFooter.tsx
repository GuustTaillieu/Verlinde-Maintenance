import { Button } from '#/features/shared/components/ui/button'
import { DialogFooter } from '#/features/shared/components/ui/dialog'
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react'
import { useClusterDispatch } from './ClusterDispatchContext'

export function DispatchFooter() {
  const {
    planner,
    step,
    emailDrafts,
    onProceedToEmails,
    onBackToPlanning,
    isSubmitting,
    onConfirmDispatch,
    onClose,
  } = useClusterDispatch()

  const selectedCount = planner.selectedSiteIds.length
  const customerCount = Object.keys(emailDrafts).length
  const techName = planner.activeTech.name
  const isOverCapacity = planner.isOverCapacity
  const isPastWeek = planner.isPastWeek

  if (step === 'EMAILS') {
    return (
      <DialogFooter className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
        <div className="text-xs text-muted-foreground hidden md:block">
          Na verzending worden de afspraken verplaatst naar{' '}
          <strong className="text-foreground">In Afwachting</strong> en blijven ze{' '}
          <strong className="text-foreground">gereserveerd</strong> tot de klant bevestigt.
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBackToPlanning}
            disabled={isSubmitting}
            className="text-xs h-8 gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            Vorige (Planning)
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onConfirmDispatch}
            disabled={isSubmitting || selectedCount === 0}
            className="text-xs h-8 gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Stuur Voorstel Mails ({customerCount} {customerCount === 1 ? 'klant' : 'klanten'})
          </Button>
        </div>
      </DialogFooter>
    )
  }

  return (
    <DialogFooter className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
      <div className="text-xs text-muted-foreground hidden md:block">
        {isPastWeek ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            Week in het verleden geselecteerd — blader naar een toekomstige week om afspraken in te plannen.
          </span>
        ) : selectedCount > 0 ? (
          <span>
            <strong>{selectedCount} werven</strong> ({customerCount}{' '}
            {customerCount === 1 ? 'klant' : 'klanten'}) gereserveerd voor{' '}
            <strong>{techName}</strong>.
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
          onClick={onProceedToEmails}
          disabled={isSubmitting || selectedCount === 0 || isOverCapacity || isPastWeek}
          title={isPastWeek ? 'Er kunnen geen afspraken in het verleden worden ingepland' : undefined}
          className="text-xs h-8 gap-1.5"
        >
          Volgende: E-mails Nakijken ({customerCount})
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </DialogFooter>
  )
}
