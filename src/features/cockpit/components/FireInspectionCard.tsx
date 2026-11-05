import * as React from 'react'
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  AccordionDefaultArrow,
} from '#/features/shared/components/ui/accordion'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import { TodoStepper, type StepItem } from './TodoStepper'
import {
  Flame,
  Mail,
  Phone,
  CalendarCheck,
  FileText,
  Loader2,
} from 'lucide-react'
import type { FireTodoItem } from '../types'

interface FireInspectionCardProps {
  item: FireTodoItem
  onOpenPropose: (item: FireTodoItem) => void
  onConfirmAppointment: (workOrderId: string) => Promise<void>
  onOpenUploadAttest: (item: FireTodoItem) => void
}

export function FireInspectionCard({
  item,
  onOpenPropose,
  onConfirmAppointment,
  onOpenUploadAttest,
}: FireInspectionCardProps) {
  const [isConfirming, setIsConfirming] = React.useState(false)

  const handleConfirm = async () => {
    if (!item.workOrderId) return
    setIsConfirming(true)
    try {
      await onConfirmAppointment(item.workOrderId)
    } finally {
      setIsConfirming(false)
    }
  }

  const isOverdue = item.daysOverdue > 0

  const steps: StepItem[] = [
    {
      id: 'step-1',
      title: 'Afspraak voorstellen aan Brandtec & klant',
      status: item.stage === 'NEEDS_PROPOSAL' ? 'active' : 'completed',
      completedInfo: item.proposedDate
        ? `${item.proposedDate} (${item.plannedStartTime || '09:00'})`
        : undefined,
      action: (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenPropose(item)}
            className="h-7 text-xs gap-1.5"
          >
            <Mail className="size-3" />
            Voorstel Mailen
          </Button>
          {item.customerPhone && (
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="h-7 text-xs gap-1 text-muted-foreground"
            >
              <a href={`tel:${item.customerPhone}`}>
                <Phone className="size-3" />
                Bellen ({item.customerPhone})
              </a>
            </Button>
          )}
        </div>
      ),
    },
    {
      id: 'step-2',
      title: 'Akkoord registreren & planning vastleggen',
      status:
        item.stage === 'PENDING_APPROVAL'
          ? 'active'
          : item.stage === 'NEEDS_PROPOSAL'
            ? 'upcoming'
            : 'completed',
      completedInfo:
        item.stage === 'AWAITING_ATTEST' || item.stage === 'COMPLETED'
          ? 'Bevestigd'
          : undefined,
      action: (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="h-7 text-xs gap-1.5"
          >
            {isConfirming ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <CalendarCheck className="size-3" />
            )}
            Akkoord Ontvangen
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenPropose(item)}
            className="h-7 text-xs text-muted-foreground"
          >
            Ander Tijdstip
          </Button>
        </div>
      ),
    },
    {
      id: 'step-3',
      title: 'Keuringsattest archiveren',
      status:
        item.stage === 'COMPLETED'
          ? 'completed'
          : item.stage === 'AWAITING_ATTEST'
            ? 'active'
            : 'upcoming',
      completedInfo:
        item.stage === 'COMPLETED' ? 'Attest bewaard' : undefined,
      action: (
        <Button
          size="sm"
          onClick={() => onOpenUploadAttest(item)}
          className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <FileText className="size-3" />
          Attest Opladen & Afronden (+1J)
        </Button>
      ),
    },
  ]

  return (
    <AccordionItem
      value={item.siteId}
      className="border border-border rounded-lg bg-card px-4 py-1 shadow-xs transition-colors"
    >
      <AccordionTrigger className="hover:no-underline py-3 flex justify-between">
        <div className="flex items-center gap-3 text-left">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${isOverdue
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted text-muted-foreground'
              }`}
          >
            <Flame className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-foreground">
                {item.siteName}
              </span>
              <span className="text-[11px] text-muted-foreground">
                ({item.customerName})
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {item.siteAddress} • Brandtec BV
            </div>
          </div>
        </div>

        <div className='flex gap-2'>
          {item.stage === 'AWAITING_ATTEST' && (
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
            >
              Attest vereist
            </Badge>
          )}
          {item.stage === 'PENDING_APPROVAL' && (
            <Badge variant="outline" className="text-blue-500 text-[10px]">
              Wacht op akkoord
            </Badge>
          )}
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px] font-mono">
              {item.daysOverdue}d te laat
            </Badge>
          )}

          <AccordionDefaultArrow />
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-10 py-4">
        <TodoStepper steps={steps} />
      </AccordionContent>
    </AccordionItem>
  )
}
