import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/features/shared/components/ui/card'
import { Badge } from '#/features/shared/components/ui/badge'
import { CalendarCheck } from 'lucide-react'

export const Route = createFileRoute('/_auth/_technician/week-schedule')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = Route.useRouteContext()

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Mijn Dagschema — {user.name}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Veldwerkagenda en digitale inspectiebonnen.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Welkom {user.name} ({user.techCode || 'Technicus'})
          </CardTitle>
          <CardDescription className="text-xs">
            Het mobiele technicusdagschema met werfinspectie checklist en batterijverbruik registratie wordt in Stap 3 geactiveerd.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            Meld u aan als <strong>Dirk Verlinde</strong> (<code className="font-mono text-foreground">dirk@verlinde-beveiliging.be</code>) om de volledige Onderhoudscockpit met Brandtec-opvolging en regionale batchplanning te testen.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-[10px]">
              Rol: {user.role}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Code: {user.techCode}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>

  )
}
