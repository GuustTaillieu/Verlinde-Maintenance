import { CheckCircle2 } from 'lucide-react'

export function MaintenanceEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-2">
      <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
      <h3 className="font-semibold text-sm">Geen openstaande acties</h3>
      <p className="text-xs text-muted-foreground">
        Alle periodieke onderhoudsbeurten en keuringen zijn tijdig ingepland en up-to-date.
      </p>
    </div>
  )
}

