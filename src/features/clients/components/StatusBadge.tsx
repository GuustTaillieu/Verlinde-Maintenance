import { Badge } from '#/features/shared/components/ui/badge'
import type { MaintenanceHealthStatus } from '#/features/clients/types'
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '#/features/shared/lib/utils'

interface StatusBadgeProps {
  status: MaintenanceHealthStatus
  className?: string
  showIcon?: boolean
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  switch (status) {
    case 'COMPLIANT':
      return (
        <Badge
          variant="positive"
          className={cn('gap-1.5 font-medium text-xs px-2.5 py-0.5', className)}
        >
          {showIcon && <CheckCircle2 className="size-3.5" />}
          <span>In orde</span>
        </Badge>
      )
    case 'DUE_SOON':
      return (
        <Badge
          variant="warning"
          className={cn('gap-1.5 font-medium text-xs px-2.5 py-0.5', className)}
        >
          {showIcon && <Clock className="size-3.5" />}
          <span>Naderend (30-60d)</span>
        </Badge>
      )
    case 'OVERDUE':
      return (
        <Badge
          variant="negative"
          className={cn('gap-1.5 font-medium text-xs px-2.5 py-0.5', className)}
        >
          {showIcon && <AlertTriangle className="size-3.5" />}
          <span>Vervallen / Urgent</span>
        </Badge>
      )
  }
}
