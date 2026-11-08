import type { ClientEquipmentItem } from '#/features/clients/types'
import { Badge } from '#/features/shared/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/features/shared/components/ui/table'
import { AlertTriangle, BatteryCharging, Box, Calendar, MapPin } from 'lucide-react'

interface SiteEquipmentTableProps {
  equipment: ClientEquipmentItem[]
}

export function SiteEquipmentTable({ equipment }: SiteEquipmentTableProps) {
  if (equipment.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
        <Box className="size-8 stroke-[1.5] text-muted-foreground/60 mb-2" />
        <p className="text-sm font-medium">Geen componenten geregistreerd</p>
        <p className="text-xs text-muted-foreground">
          Voor deze installatie zijn nog geen specifieke hardware modules ingevoerd.
        </p>
      </div>
    )
  }

  const expiredBatteriesCount = equipment.filter((e) => e.isBatteryExpired).length

  return (
    <div className="space-y-3">
      {expiredBatteriesCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-700 dark:text-red-400">
          <AlertTriangle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>
            <strong>{expiredBatteriesCount} {expiredBatteriesCount === 1 ? 'noodstroombatterij' : 'noodstroombatterijen'}</strong> overschrijdt de 4-jarige levensduurnorm (NBN S21-100 / INCERT) en dient preventief vervangen te worden.
          </span>
        </div>
      )}

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[140px] text-xs font-semibold">Artikelcode</TableHead>
              <TableHead className="text-xs font-semibold">Omschrijving</TableHead>
              <TableHead className="text-xs font-semibold">Locatie</TableHead>
              <TableHead className="w-[110px] text-xs font-semibold">Installatiedatum</TableHead>
              <TableHead className="w-[100px] text-xs font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((item) => (
              <TableRow key={item.id} className="text-xs hover:bg-muted/30">
                <TableCell className="font-mono font-medium text-foreground">
                  <div className="flex items-center gap-1.5">
                    {item.isBatteryExpired ? (
                      <BatteryCharging className="size-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    ) : (
                      <Box className="size-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span>{item.articleCode}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{item.description}</span>
                    {item.isBatteryExpired && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                        <AlertTriangle className="size-3" />
                        Batterij &gt; 4 jaar oud (vervanging vereist)
                      </span>
                    )}
                    {item.serialNumber && (
                      <span className="text-[10px] text-muted-foreground">
                        S/N: {item.serialNumber}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {item.location ? (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span>{item.location}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="size-3 shrink-0" />
                    <span>{item.installDate}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {item.status === 'ACTIVE' && (
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px]">
                      Actief
                    </Badge>
                  )}
                  {item.status === 'REPLACED' && (
                    <Badge variant="outline" className="border-muted text-muted-foreground text-[10px]">
                      Vervangen
                    </Badge>
                  )}
                  {item.status === 'DECOMMISSIONED' && (
                    <Badge variant="destructive" className="text-[10px]">
                      Buiten dienst
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
