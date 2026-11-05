import { Input } from '#/features/shared/components/ui/input'
import { Label } from '#/features/shared/components/ui/label'
import { Badge } from '#/features/shared/components/ui/badge'
import { Sliders, MapPin } from 'lucide-react'

export function PlatformPreferencesSection() {
  const regions = [
    { city: 'Kortrijk', primaryTech: 'Tom De Coninck' },
    { city: 'Zwevegem', primaryTech: 'Wout Vanhoutte' },
    { city: 'Waregem', primaryTech: 'Jens Maes' },
    { city: 'Deerlijk', primaryTech: 'Jens Maes' },
    { city: 'Avelgem & Anzegem', primaryTech: 'Wout Vanhoutte' },
    { city: 'Heule & Kuurne', primaryTech: 'Tom De Coninck' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Sliders className="size-3.5 text-foreground" />
          Planning & Bedrijfsvoorkeuren
        </h4>
        <p className="text-[11px] text-muted-foreground">
          Algemene parameters voor het automatische batch dispatch algoritme.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-border p-3 space-y-1 bg-card">
          <Label className="text-xs font-medium">Standaard Reistijd per Werf</Label>
          <div className="flex items-center gap-2 pt-1">
            <Input defaultValue="30" className="h-8 w-20 text-xs font-mono" readOnly />
            <span className="text-muted-foreground">minuten basistijd</span>
          </div>
          <p className="text-[10px] text-muted-foreground pt-1">
            Wordt automatisch toegevoegd aan de duur van elke werf-verplaatsing.
          </p>
        </div>

        <div className="rounded-lg border border-border p-3 space-y-1 bg-card">
          <Label className="text-xs font-medium">Jaarlijkse Keuringsinterval</Label>
          <div className="flex items-center gap-2 pt-1">
            <Input defaultValue="12" className="h-8 w-20 text-xs font-mono" readOnly />
            <span className="text-muted-foreground">maanden</span>
          </div>
          <p className="text-[10px] text-muted-foreground pt-1">
            Volgende onderhoudsdatum wordt automatisch 12m vooruit geschoven na attest.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <MapPin className="size-3.5 text-muted-foreground" />
          Regionale Technicus Toewijzing
        </Label>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {regions.map((reg) => (
            <div key={reg.city} className="p-2.5 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{reg.city}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {reg.primaryTech}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

