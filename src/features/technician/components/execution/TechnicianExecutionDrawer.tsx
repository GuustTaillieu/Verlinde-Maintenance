import { useState } from 'react'
import { useIsMobile } from '#/features/shared/hooks/use-mobile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#/features/shared/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '#/features/shared/components/ui/drawer'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '#/features/shared/components/ui/accordion'
import { Button } from '#/features/shared/components/ui/button'
import { Badge } from '#/features/shared/components/ui/badge'
import { DisciplineBadge } from '#/features/shared/components/DisciplineBadge'
import {
  Navigation,
  ListTodo,
  PenTool,
  CheckCircle2,
} from 'lucide-react'
import { ExecutionNavigationStep } from './ExecutionNavigationStep'
import { ExecutionChecklistStep } from './ExecutionChecklistStep'
import { ExecutionSignatureStep } from './ExecutionSignatureStep'
import type { TechnicianWorkOrder } from '../../types'
import { cn } from '#/features/shared/lib/utils'

interface TechnicianExecutionDrawerProps {
  workOrder: TechnicianWorkOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleItem: (itemId: string, isChecked: boolean, description?: string, quantity?: number) => void
  onComplete: (signedByName: string, signatureDataUrl?: string, techNotes?: string) => Promise<void>
  isCompleting: boolean
}

type StepKey = 'navigation' | 'checklist' | 'signature'

export function TechnicianExecutionDrawer({
  workOrder,
  open,
  onOpenChange,
  onToggleItem,
  onComplete,
  isCompleting,
}: TechnicianExecutionDrawerProps) {
  const isMobile = useIsMobile()

  // Track active accordion step
  const [activeStep, setActiveStep] = useState<StepKey>('navigation')
  const [techNotes, setTechNotes] = useState(workOrder?.techNotes || '')

  if (!workOrder) return null

  const isCompleted = workOrder.status === 'COMPLETED'
  const totalItems = workOrder.items.length
  const checkedItems = workOrder.items.filter((item) => item.isChecked).length
  const isAllChecked = totalItems > 0 && checkedItems === totalItems

  const handleCompleteOrder = async (signedByName: string, signatureDataUrl?: string) => {
    await onComplete(signedByName, signatureDataUrl, techNotes)
  }

  // Header content rendered in both Dialog and Drawer
  const headerContent = (
    <div className="space-y-1.5 pr-6 text-left">
      <div className="flex items-center gap-2">
        <DisciplineBadge discipline={workOrder.primaryDiscipline} />
        <Badge
          variant={isCompleted ? 'outline' : workOrder.status === 'IN_PROGRESS' ? 'secondary' : 'default'}
          className={cn(
            'text-[10px] font-semibold',
            isCompleted && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
          )}
        >
          {isCompleted ? 'Voltooid' : workOrder.status === 'IN_PROGRESS' ? 'In uitvoering' : 'Ingepland'}
        </Badge>
        <span className="font-mono text-xs text-muted-foreground">{workOrder.woNumber}</span>
      </div>

      <div>
        <h2 className="text-base font-bold text-foreground truncate">{workOrder.customerName}</h2>
        <p className="text-xs text-muted-foreground truncate">
          {workOrder.siteName} • {workOrder.siteAddress}, {workOrder.siteCity}
        </p>
      </div>
    </div>
  )

  // Stepped Accordion Content
  const accordionContent = (
    <Accordion
      type="single"
      collapsible={false}
      value={isCompleted ? 'signature' : activeStep}
      onValueChange={(val) => {
        if (val) setActiveStep(val as StepKey)
      }}
      className="w-full space-y-2.5"
    >
      {/* Stap 1: Aanrijden & Toegang */}
      <AccordionItem
        value="navigation"
        className="border border-border rounded-xl px-3 bg-card shadow-2xs overflow-hidden"
      >
        <AccordionTrigger className="hover:no-underline py-3 text-xs font-semibold">
          <div className="flex items-center gap-2.5 truncate">
            <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div className="flex items-center gap-2 truncate text-left">
              <Navigation className="size-3.5 text-primary shrink-0" />
              <span className="truncate">Stap 1: Aanrijden & Toegangsinfo</span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 text-xs">
          <ExecutionNavigationStep
            workOrder={workOrder}
            onNextStep={() => setActiveStep('checklist')}
          />
        </AccordionContent>
      </AccordionItem>

      {/* Stap 2: Uitvoering & Checklist */}
      <AccordionItem
        value="checklist"
        className="border border-border rounded-xl px-3 bg-card shadow-2xs overflow-hidden"
      >
        <AccordionTrigger className="hover:no-underline py-3 text-xs font-semibold">
          <div className="flex items-center justify-between w-full pr-2 truncate">
            <div className="flex items-center gap-2.5 truncate">
              <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div className="flex items-center gap-2 truncate text-left">
                <ListTodo className="size-3.5 text-primary shrink-0" />
                <span className="truncate">Stap 2: Uitvoering & Checklist</span>
              </div>
            </div>

            <Badge
              variant={isAllChecked ? 'outline' : 'secondary'}
              className={cn(
                'text-[10px] font-mono px-1.5 py-0 shrink-0',
                isAllChecked && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              )}
            >
              {checkedItems}/{totalItems}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 text-xs">
          <ExecutionChecklistStep
            workOrder={workOrder}
            onToggleItem={onToggleItem}
            onNextStep={() => setActiveStep('signature')}
            techNotes={techNotes}
            onTechNotesChange={setTechNotes}
          />
        </AccordionContent>
      </AccordionItem>

      {/* Stap 3: Klantaftekening & Voltooiing */}
      <AccordionItem
        value="signature"
        className="border border-border rounded-xl px-3 bg-card shadow-2xs overflow-hidden"
      >
        <AccordionTrigger className="hover:no-underline py-3 text-xs font-semibold">
          <div className="flex items-center justify-between w-full pr-2 truncate">
            <div className="flex items-center gap-2.5 truncate">
              <div
                className={cn(
                  'size-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs',
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isAllChecked
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <CheckCircle2 className="size-3.5" /> : '3'}
              </div>
              <div className="flex items-center gap-2 truncate text-left">
                <PenTool className="size-3.5 text-primary shrink-0" />
                <span className="truncate">Stap 3: Klantaftekening & Voltooiing</span>
              </div>
            </div>

            {isCompleted ? (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">
                Afgetekend
              </Badge>
            ) : !isAllChecked ? (
              <Badge variant="outline" className="text-[10px] text-muted-foreground opacity-60 shrink-0">
                Vergrendeld
              </Badge>
            ) : null}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 text-xs">
          <ExecutionSignatureStep
            workOrder={workOrder}
            onComplete={handleCompleteOrder}
            isCompleting={isCompleting}
            isAllChecklistDone={isAllChecked}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )

  // Mobile / Tablet Drawer (90% screen height, smooth thumb scrolling without nested scroll traps)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[92vh] h-[90vh] flex flex-col">
          <DrawerHeader className="p-4 border-b border-border text-left">
            <DrawerTitle asChild>{headerContent}</DrawerTitle>
            <DrawerDescription className="sr-only">Werkorder uitvoering</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto flex-1">{accordionContent}</div>
          <DrawerFooter className="p-4 border-t border-border">
            <DrawerClose asChild>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Sluiten
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[88vh] flex flex-col">
        <DialogHeader className="pr-6">
          <DialogTitle asChild>{headerContent}</DialogTitle>
          <DialogDescription className="sr-only">Werkorder uitvoering</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto -mr-2 pr-2 flex-1 my-2">{accordionContent}</div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Compound subcomponent attachments ($compound-pattern)
TechnicianExecutionDrawer.NavigationStep = ExecutionNavigationStep
TechnicianExecutionDrawer.ChecklistStep = ExecutionChecklistStep
TechnicianExecutionDrawer.SignatureStep = ExecutionSignatureStep
