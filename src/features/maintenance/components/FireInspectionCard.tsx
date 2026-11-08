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
  CalendarCheck,
  FileText,
  Loader2,
  ShieldAlert,
  Video,
  KeyRound,
  Wrench,
  Check,
  Square,
} from 'lucide-react'
import type { FireInspectionItem } from '../types'
import { MAINTENANCE_STAGE, DISCIPLINE } from '../types'
import { cn } from '#/features/shared/lib/utils'

interface FireInspectionCardContextValue {
  item: FireInspectionItem
  onOpenPropose?: (item: FireInspectionItem) => void
  onConfirmAppointment?: (workOrderId: string) => Promise<void>
  onOpenUploadAttest?: (item: FireInspectionItem) => void
  isConfirming: boolean
  setIsConfirming: (val: boolean) => void
  isOverdue: boolean
  isSelected?: boolean
  onToggleSelect?: (siteId: string) => void
  selectable?: boolean
}

const FireInspectionCardContext = React.createContext<FireInspectionCardContextValue | null>(null)

export function useFireInspectionCard() {
  const context = React.useContext(FireInspectionCardContext)
  if (!context) {
    throw new Error('FireInspectionCard compound subcomponents must be used within FireInspectionCard')
  }
  return context
}

export function FireInspectionCardIcon({ className }: { className?: string }) {
  const { item, isOverdue, isSelected, onToggleSelect, selectable } = useFireInspectionCard()
  const isFire = item.primaryDiscipline === 'FIRE'
  const [isHovered, setIsHovered] = React.useState(false)

  const renderIcon = () => {
    switch (item.primaryDiscipline) {
      case 'FIRE':
        return <Flame className="size-4" />
      case 'INTRUSION':
        return <ShieldAlert className="size-4" />
      case 'CCTV':
        return <Video className="size-4" />
      case 'ACCESS':
        return <KeyRound className="size-4" />
      default:
        return <Wrench className="size-4" />
    }
  }

  const showCheckbox = selectable && (isHovered || isSelected)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (selectable && onToggleSelect) {
          e.stopPropagation()
          onToggleSelect(item.siteId)
        }
      }}
      className={cn(
        'group/icon flex size-8 shrink-0 items-center justify-center rounded-lg transition-all select-none',
        selectable && 'cursor-pointer hover:ring-2 hover:ring-primary/40',
        isSelected
          ? 'bg-primary text-primary-foreground shadow-xs'
          : isFire
            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
            : isOverdue
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-muted text-muted-foreground',
        className
      )}
    >
      {showCheckbox ? (
        isSelected ? (
          <Check className="size-4 stroke-[2.5]" />
        ) : (
          <Square className="size-4 stroke-[1.5] text-muted-foreground group-hover/icon:text-primary" />
        )
      ) : (
        renderIcon()
      )}
    </div>
  )
}

export function FireInspectionCardInfo() {
  const { item } = useFireInspectionCard()

  let disciplineLabel = ''
  switch (item.primaryDiscipline) {
    case DISCIPLINE.FIRE:
      disciplineLabel = 'Branddetectie (NBN S 21-100)'
      break

    case DISCIPLINE.INTRUSION:
      disciplineLabel = 'Inbraakbeveiliging'
      break
    case DISCIPLINE.CCTV:
      disciplineLabel = 'Camerabewaking'
      break
    case DISCIPLINE.ACCESS:
      disciplineLabel = 'Toegangscontrole'
      break
    default:
      disciplineLabel = 'Periodiek Onderhoud'
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-xs text-foreground">{item.siteName}</span>
        <span className="text-[11px] text-muted-foreground">({item.customerName})</span>
      </div>
      <div className="text-[11px] text-muted-foreground">
        {item.siteAddress} • {item.siteCity} • {disciplineLabel}
      </div>
    </div>
  )
}

export function FireInspectionCardBadges() {
  const { item, isOverdue } = useFireInspectionCard()
  const isFire = item.primaryDiscipline === DISCIPLINE.FIRE

  return (
    <div className="flex gap-2">
      {isFire && item.stage === MAINTENANCE_STAGE.AWAITING_ATTEST && (
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
        >
          Attest vereist
        </Badge>
      )}
      {item.stage === MAINTENANCE_STAGE.PENDING_APPROVAL && (
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
  )
}

export function FireInspectionCardHeader({ children }: { children?: React.ReactNode }) {
  if (children) {
    return (
      <AccordionTrigger className="hover:no-underline py-3 flex justify-between">
        {children}
      </AccordionTrigger>
    )
  }

  return (
    <AccordionTrigger className="hover:no-underline py-3 flex justify-between">
      <div className="flex items-center gap-3 text-left">
        <FireInspectionCardIcon />
        <FireInspectionCardInfo />
      </div>
      <FireInspectionCardBadges />
    </AccordionTrigger>
  )
}

export function FireInspectionCardContent() {
  const {
    item,
    onOpenPropose,
    onConfirmAppointment,
    onOpenUploadAttest,
    isConfirming,
    setIsConfirming,
  } = useFireInspectionCard()

  const handleConfirm = async () => {
    if (!item.workOrderId || !onConfirmAppointment) return
    setIsConfirming(true)
    try {
      await onConfirmAppointment(item.workOrderId)
    } finally {
      setIsConfirming(false)
    }
  }

  const isFire = item.primaryDiscipline === DISCIPLINE.FIRE

  const fireSteps: StepItem[] = [
    {
      id: 'step-1',
      title: 'Afspraak voorstellen aan klant',
      status: item.stage === MAINTENANCE_STAGE.NEEDS_PROPOSAL ? 'active' : 'completed',
      completedInfo: item.proposedDate
        ? `${item.proposedDate} (${item.plannedStartTime || '09:00'})`
        : undefined,
      action: onOpenPropose && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenPropose(item)}
          className="h-7 text-xs gap-1.5"
        >
          <CalendarCheck className="size-3 text-primary" />
          Datum voorstellen
        </Button>
      ),
    },
    {
      id: 'step-2',
      title: 'Akkoord registreren & planning vastleggen',
      status:
        item.stage === MAINTENANCE_STAGE.PENDING_APPROVAL
          ? 'active'
          : item.stage === MAINTENANCE_STAGE.NEEDS_PROPOSAL
            ? 'upcoming'
            : 'completed',
      completedInfo:
        item.stage === MAINTENANCE_STAGE.AWAITING_ATTEST || item.stage === MAINTENANCE_STAGE.COMPLETED
          ? 'Ingepland voor keuring'
          : undefined,

      action: (
        <div className="flex items-center gap-2">
          {onConfirmAppointment && (
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
          )}
          {onOpenPropose && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenPropose(item)}
              className="h-7 text-xs text-muted-foreground"
            >
              Ander Tijdstip
            </Button>
          )}
        </div>
      ),
    },
    {
      id: 'step-3',
      title: 'Keuringsattest archiveren (NBN S 21-100)',
      status:
        item.stage === MAINTENANCE_STAGE.COMPLETED
          ? 'completed'
          : item.stage === MAINTENANCE_STAGE.AWAITING_ATTEST
            ? 'active'
            : 'upcoming',
      completedInfo: item.stage === MAINTENANCE_STAGE.COMPLETED ? 'Attest bewaard' : undefined,
      action: onOpenUploadAttest && (
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

  const regularSteps: StepItem[] = [
    {
      id: 'regular-step-1',
      title: 'Tijdslot reserveren in technicusplanning & voorstel versturen',
      status: item.stage === MAINTENANCE_STAGE.NEEDS_PROPOSAL ? 'active' : 'completed',
      completedInfo: item.proposedDate
        ? `${item.proposedDate} (${item.plannedStartTime || '08:30'} – ${item.plannedEndTime || '12:00'})`
        : undefined,
      action: onOpenPropose && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenPropose(item)}
          className="h-7 text-xs gap-1.5"
        >
          <CalendarCheck className="size-3 text-primary" />
          Datum voorstellen
        </Button>
      ),
    },
    {
      id: 'regular-step-2',
      title: 'Akkoord klant registreren & technicusagenda vastleggen',
      status:
        item.stage === MAINTENANCE_STAGE.PENDING_APPROVAL
          ? 'active'
          : item.stage === MAINTENANCE_STAGE.NEEDS_PROPOSAL
            ? 'upcoming'
            : 'completed',
      completedInfo:
        item.stage === MAINTENANCE_STAGE.COMPLETED
          ? 'Definitief bevestigd'
          : undefined,
      action: (
        <div className="flex items-center gap-2">
          {onConfirmAppointment && (
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
          )}
          {onOpenPropose && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenPropose(item)}
              className="h-7 text-xs text-muted-foreground"
            >
              Ander Tijdstip
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AccordionContent className="px-10 py-4">
      <TodoStepper steps={isFire ? fireSteps : regularSteps} />
    </AccordionContent>
  )
}

export interface FireInspectionCardProps {
  item: FireInspectionItem
  onOpenPropose?: (item: FireInspectionItem) => void
  onConfirmAppointment?: (workOrderId: string) => Promise<void>
  onOpenUploadAttest?: (item: FireInspectionItem) => void
  isSelected?: boolean
  onToggleSelect?: (siteId: string) => void
  selectable?: boolean
  children?: React.ReactNode
  className?: string
}

export function FireInspectionCard({
  item,
  onOpenPropose,
  onConfirmAppointment,
  onOpenUploadAttest,
  isSelected,
  onToggleSelect,
  selectable,
  children,
  className,
}: FireInspectionCardProps) {
  const [isConfirming, setIsConfirming] = React.useState(false)
  const isOverdue = item.daysOverdue > 0

  return (
    <FireInspectionCardContext.Provider
      value={{
        item,
        onOpenPropose,
        onConfirmAppointment,
        onOpenUploadAttest,
        isConfirming,
        setIsConfirming,
        isOverdue,
        isSelected,
        onToggleSelect,
        selectable,
      }}
    >
      <AccordionItem
        value={item.siteId}
        className={cn(
          'border rounded-lg px-4 py-1 shadow-xs transition-colors',
          isSelected ? 'border-primary/60 bg-primary/2 shadow-2xs' : 'border-border bg-card',
          className
        )}
      >
        {children || (
          <>
            <FireInspectionCardHeader />
            <FireInspectionCardContent />
          </>
        )}
      </AccordionItem>
    </FireInspectionCardContext.Provider>
  )
}

FireInspectionCard.Header = FireInspectionCardHeader
FireInspectionCard.Icon = FireInspectionCardIcon
FireInspectionCard.Info = FireInspectionCardInfo
FireInspectionCard.Badges = FireInspectionCardBadges
FireInspectionCard.Content = FireInspectionCardContent
