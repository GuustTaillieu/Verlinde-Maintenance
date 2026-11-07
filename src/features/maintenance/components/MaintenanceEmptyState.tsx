import { CheckCircle2 } from 'lucide-react'

interface MaintenanceEmptyStateProps {
  title?: string
  description?: string
}

export function MaintenanceEmptyState({
  title = 'Geen openstaande acties',
  description = 'Alle periodieke onderhoudsbeurten en keuringen zijn tijdig ingepland en up-to-date.',
}: MaintenanceEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-2">
      <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

