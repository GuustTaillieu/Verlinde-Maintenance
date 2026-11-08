import { Flame, Shield, Video, KeyRound, ShieldCheck } from 'lucide-react'
import { Badge } from '#/features/shared/components/ui/badge'
import { cn } from '#/features/shared/lib/utils'

export type DisciplineType = 'FIRE' | 'INTRUSION' | 'CCTV' | 'ACCESS' | 'OTHER' | string

interface DisciplineIconProps {
  discipline?: DisciplineType | null
  className?: string
}

export function DisciplineIcon({ discipline, className = 'size-3.5' }: DisciplineIconProps) {
  const disc = (discipline || '').toUpperCase()
  if (disc === 'FIRE' || disc.includes('BRAND')) {
    return <Flame className={cn('text-red-500 shrink-0', className)} />
  }
  if (disc === 'INTRUSION' || disc.includes('INBRAAK')) {
    return <Shield className={cn('text-blue-500 shrink-0', className)} />
  }
  if (disc === 'CCTV' || disc.includes('CAMERA')) {
    return <Video className={cn('text-purple-500 shrink-0', className)} />
  }
  if (disc === 'ACCESS' || disc.includes('TOEGANG')) {
    return <KeyRound className={cn('text-amber-500 shrink-0', className)} />
  }
  return <ShieldCheck className={cn('text-muted-foreground shrink-0', className)} />
}

export function getDisciplineLabel(discipline?: DisciplineType | null): string {
  const disc = (discipline || '').toUpperCase()
  if (disc === 'FIRE' || disc.includes('BRAND')) return 'Brand'
  if (disc === 'INTRUSION' || disc.includes('INBRAAK')) return 'Inbraak'
  if (disc === 'CCTV' || disc.includes('CAMERA')) return 'CCTV'
  if (disc === 'ACCESS' || disc.includes('TOEGANG')) return 'Toegang'
  return 'Beveiliging'
}

interface DisciplineBadgeProps {
  discipline?: DisciplineType | null
  showIcon?: boolean
  className?: string
  variant?: 'secondary' | 'outline' | 'default'
}

export function DisciplineBadge({
  discipline,
  showIcon = true,
  className,
  variant = 'secondary',
}: DisciplineBadgeProps) {
  const label = getDisciplineLabel(discipline)

  return (
    <Badge
      variant={variant}
      className={cn(
        'text-[10px] px-1.5 py-0 h-4.5 font-normal gap-1 bg-muted/80 text-foreground items-center inline-flex',
        className
      )}
    >
      {showIcon && <DisciplineIcon discipline={discipline} className="size-3" />}
      <span>{label}</span>
    </Badge>
  )
}
