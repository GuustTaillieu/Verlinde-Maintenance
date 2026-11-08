import { Checkbox } from '#/features/shared/components/ui/checkbox'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import { Textarea } from '#/features/shared/components/ui/textarea'
import {
  ListTodo,
  Cpu,
  MapPin,
  CheckCircle2,
  ArrowRight,
  FilePenLine,
} from 'lucide-react'
import type { TechnicianWorkOrder } from '../../types'
import { cn } from '#/features/shared/lib/utils'

interface ExecutionChecklistStepProps {
  workOrder: TechnicianWorkOrder
  onToggleItem: (itemId: string, isChecked: boolean, description?: string, quantity?: number) => void
  onNextStep: () => void
  techNotes: string
  onTechNotesChange: (notes: string) => void
}

export function ExecutionChecklistStep({
  workOrder,
  onToggleItem,
  onNextStep,
  techNotes,
  onTechNotesChange,
}: ExecutionChecklistStepProps) {
  const totalItems = workOrder.items.length
  const checkedItems = workOrder.items.filter((item) => item.isChecked).length
  const isAllChecked = totalItems > 0 && checkedItems === totalItems
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

  return (
    <div className="space-y-4 pt-1">
      {/* 1. Checklist Progress Bar */}
      <div className="p-3 rounded-xl bg-card border border-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <ListTodo className="size-4 text-primary" />
            Inspectie Voortgang
          </span>
          <span className="font-mono font-medium text-muted-foreground">
            {checkedItems} / {totalItems} taken ({progressPercent}%)
          </span>
        </div>

        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300 rounded-full',
              isAllChecked ? 'bg-emerald-500' : 'bg-primary'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {isAllChecked ? (
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 pt-0.5">
            <CheckCircle2 className="size-3.5" />
            <span>Alle taken zijn gecontroleerd! U kunt nu doorgaan naar de aftekening.</span>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            Vink elk controlepunt af na fysieke inspectie ter plaatse.
          </div>
        )}
      </div>

      {/* 2. Interactive Inspection Checklist Items */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-foreground block">
          Te keuren controlepunten:
        </span>

        <div className="space-y-2">
          {workOrder.items.map((item) => {
            const isChecked = item.isChecked
            return (
              <div
                key={item.id}
                className={cn(
                  'p-3 rounded-xl border transition-all text-xs flex flex-col gap-2',
                  isChecked
                    ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                    : 'border-border bg-card'
                )}
              >
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <Checkbox
                      id={`chk_${item.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        onToggleItem(item.id, Boolean(checked), item.description, item.quantity)
                      }
                      className="mt-0.5 size-4"
                    />
                    <label
                      htmlFor={`chk_${item.id}`}
                      className={cn(
                        'cursor-pointer select-none font-medium leading-tight',
                        isChecked ? 'text-foreground line-through opacity-85' : 'text-foreground'
                      )}
                    >
                      {item.description}
                      {item.articleCode && (
                        <span className="ml-1 text-[10px] font-mono text-muted-foreground">
                          [{item.articleCode}]
                        </span>
                      )}
                    </label>
                  </div>

                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono">
                    x{item.quantity}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Physical Installed Equipment with Building Locations */}
      {workOrder.equipment && workOrder.equipment.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-border/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="size-3.5 text-blue-500" />
              Geregistreerde apparatuur & locaties ({workOrder.equipment.length}):
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {workOrder.equipment.map((eq) => (
              <div
                key={eq.id}
                className="p-2.5 rounded-lg bg-muted/25 border border-border/70 text-xs flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <div className="font-medium text-foreground truncate">{eq.description}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    {eq.location ? (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <MapPin className="size-3 text-primary shrink-0" />
                        Locatie: {eq.location}
                      </span>
                    ) : (
                      <span>Locatie: Algemeen / Centrale</span>
                    )}
                    {eq.articleCode && (
                      <span className="font-mono text-muted-foreground/70 ml-1">
                        • {eq.articleCode}
                      </span>
                    )}
                  </div>
                </div>

                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono">
                  x{eq.quantity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Technician Field Notes & Observations */}
      <div className="space-y-1.5 pt-1 border-t border-border/60">
        <label
          htmlFor="technician-notes-input"
          className="text-xs font-semibold text-foreground flex items-center gap-1.5"
        >
          <FilePenLine className="size-3.5 text-primary" />
          Vaststellingen & Notities Technicus (voor keuringsverslag):
        </label>
        <Textarea
          id="technician-notes-input"
          value={techNotes}
          onChange={(e) => onTechNotesChange(e.target.value)}
          placeholder="bv. Centrale en sirene getest. Accuspanning 13.2V conform. Geen defecten waargenomen."
          className="text-xs min-h-[70px] bg-background"
        />
      </div>

      {/* Advance to Step 3 Button */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={onNextStep}
          disabled={!isAllChecked}
          className={cn(
            'w-full text-xs h-9 gap-1.5 font-semibold transition-all',
            isAllChecked
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'opacity-50 cursor-not-allowed'
          )}
        >
          {isAllChecked ? (
            <>
              <span>Alles Gecontroleerd → Ga naar Klantaftekening</span>
              <ArrowRight className="size-3.5" />
            </>
          ) : (
            <span>Controleer eerst alle {totalItems - checkedItems} resterende taken</span>
          )}
        </Button>
      </div>
    </div>
  )
}
