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
import { Button } from '#/features/shared/components/ui/button'
import { Badge } from '#/features/shared/components/ui/badge'
import {
  Navigation,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Clock,
  User,
  CheckCircle2,
  FileText,
  FileCheck2,
  Download,
  AlertCircle,
  MapPin,
  ListTodo,
  Cpu,
} from 'lucide-react'
import type { PlanningSlot } from '../types'
import { cn } from '#/features/shared/lib/utils'

interface JobDetailsDrawerProps {
  slot: PlanningSlot | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JobDetailsDrawer({ slot, open, onOpenChange }: JobDetailsDrawerProps) {
  const isMobile = useIsMobile()
  const [isAlarmRevealed, setIsAlarmRevealed] = useState(false)

  if (!slot) return null

  const isCompleted = slot.status === 'COMPLETED'

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${slot.siteAddress}, ${slot.siteCity}`
  )}`

  const certificateName =
    slot.certificateDocument || `Keuringsattest_${slot.woNumber}_NBN-S21-100.pdf`

  const handleDownloadCertificate = () => {
    const dummyContent = `Verlinde Beveiliging - Keuringsattest NBN S21-100\nWerkorder: ${slot.woNumber}\nKlant: ${slot.customerName}\nLocatie: ${slot.siteAddress}, ${slot.siteCity}\nDatum: ${slot.date}\nStatus: Conform`
    const blob = new Blob([dummyContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = certificateName
    a.click()
    URL.revokeObjectURL(url)
  }

  // Shared body content rendered in both Dialog and Drawer
  const content = (
    <div className="space-y-4">
      {/* 1. Quick Actions: Navigation & Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-xs font-medium text-foreground"
        >
          <Navigation className="size-4 text-primary shrink-0" />
          <div className="truncate">
            <div className="font-semibold">Navigeer via Google Maps</div>
            <div className="text-[10px] text-muted-foreground truncate">{slot.siteAddress}</div>
          </div>
        </a>

        {slot.customerPhone ? (
          <a
            href={`tel:${slot.customerPhone}`}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-xs font-medium text-foreground"
          >
            <Phone className="size-4 text-emerald-500 shrink-0" />
            <div className="truncate">
              <div className="font-semibold">Klant Bellen</div>
              <div className="text-[10px] text-muted-foreground truncate">{slot.customerPhone}</div>
            </div>
          </a>
        ) : slot.customerEmail ? (
          <a
            href={`mailto:${slot.customerEmail}`}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-xs font-medium text-foreground"
          >
            <Mail className="size-4 text-blue-500 shrink-0" />
            <div className="truncate">
              <div className="font-semibold">Stuur E-mail</div>
              <div className="text-[10px] text-muted-foreground truncate">{slot.customerEmail}</div>
            </div>
          </a>
        ) : (
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground">
            <AlertCircle className="size-4 shrink-0" />
            <span>Geen rechtstreeks telefoonnummer</span>
          </div>
        )}
      </div>

      {/* 2. Schedule & Assigned Technician Information */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/30 border border-border text-xs">
        <div>
          <span className="text-[11px] text-muted-foreground block">Tijdslot & Duur:</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
            <Clock className="size-3 text-primary shrink-0" />
            {slot.startTime} – {slot.endTime} ({slot.durationHours}u)
          </span>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground block">Toegewezen Technicus:</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
            <User className="size-3 text-primary shrink-0" />
            {slot.assignedTechnicianName || 'Nog niet toegewezen'}
          </span>
        </div>
      </div>

      {/* 3. Zero-Trust Confidential Access Vault (ONLY shown if accessNotesConfidential exists!) */}
      {slot.accessNotesConfidential && (
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lock className="size-3.5 text-amber-600 dark:text-amber-400" />
              Toegangs- & Alarmcode
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsAlarmRevealed(!isAlarmRevealed)}
              className="h-6 px-2 text-[11px]"
            >
              {isAlarmRevealed ? (
                <>
                  <EyeOff className="size-3 mr-1" />
                  Verberg
                </>
              ) : (
                <>
                  <Eye className="size-3 mr-1" />
                  Toon code
                </>
              )}
            </Button>
          </div>
          <p className="font-mono text-xs text-foreground bg-background p-2 rounded border border-border select-all">
            {isAlarmRevealed ? slot.accessNotesConfidential : '••••••••••••••••'}
          </p>
        </div>
      )}

      {/* 4. Office Notes (if present) */}
      {slot.officeNotes && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1">
            <FileText className="size-3 text-muted-foreground" />
            Kantoorinstructies:
          </span>
          <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border">
            {slot.officeNotes}
          </p>
        </div>
      )}

      {/* 5. To-do Checklist (Items that need to be verified on-site) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <ListTodo className="size-3.5 text-primary" />
            Te keuren checklist ({slot.items.length}):
          </span>
        </div>
        {slot.items.length > 0 ? (
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {slot.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/60 text-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <CheckCircle2
                    className={cn(
                      'size-3.5 shrink-0',
                      item.isChecked
                        ? 'text-emerald-500'
                        : 'text-muted-foreground/50'
                    )}
                  />
                  <span className="font-medium text-foreground truncate">{item.description}</span>
                  {item.articleCode && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      [{item.articleCode}]
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 shrink-0">
                  x{item.quantity}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded-md">
            Standaard veiligheidsinspectie conform NBN S21-100 voorschriften.
          </p>
        )}
      </div>

      {/* 6. Installed Equipment with Physical Building Location */}
      {slot.equipment && slot.equipment.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="size-3.5 text-blue-500" />
              Geregistreerde componenten & locatie ({slot.equipment.length}):
            </span>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {slot.equipment.map((eq) => (
              <div
                key={eq.id}
                className="p-2 rounded-md bg-card border border-border text-xs flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <div className="font-medium text-foreground truncate">{eq.description}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    {eq.location ? (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <MapPin className="size-3 text-primary shrink-0" />
                        Locatie: {eq.location}
                      </span>
                    ) : (
                      <span>Locatie: Onbekend / Centrale</span>
                    )}
                    {eq.articleCode && (
                      <span className="font-mono text-muted-foreground/70 ml-1">
                        • {eq.articleCode}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                  x{eq.quantity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Completed Records Verification & Certificate (if COMPLETED) */}
      {isCompleted && (
        <div className="space-y-3 pt-2 border-t border-border">
          {/* Tech Field Notes */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1">
              <FileText className="size-3 text-primary" />
              Vaststellingen & Notities Technicus:
            </span>
            <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg border border-border whitespace-pre-wrap">
              {slot.techNotes || 'Periodiek onderhoud conform voorschriften uitgevoerd.'}
            </p>
          </div>

          {/* Client Signature */}
          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Digitaal Ondertekend:</span>
              <span className="font-semibold text-foreground">
                {slot.signedByName || 'Klant ter plaatse'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">Tijdstip:</span>
              <span className="font-medium text-foreground">
                {slot.signedAt || slot.completedAt || slot.date}
              </span>
            </div>
          </div>

          {/* Certificate Download */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 truncate pr-2">
              <FileCheck2 className="size-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-semibold text-foreground truncate">
                  Keuringsattest NBN S21-100
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  {certificateName}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadCertificate}
              className="text-xs h-7 gap-1 shrink-0"
            >
              <Download className="size-3" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  // Header Title & Subtitle block (clean, no redundant top badge cluster)
  const headerContent = (
    <div className="space-y-1 pr-6">
      <h2 className="text-base font-bold text-foreground truncate">
        {slot.customerName}
      </h2>
      <p className="text-xs text-muted-foreground truncate">
        {slot.siteName} • {slot.woNumber} • {slot.siteAddress}, {slot.siteCity}
      </p>
    </div>
  )

  // Render Drawer on Mobile, Dialog on Desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[88vh] flex flex-col">
          <DrawerHeader className="p-4 border-b border-border text-left pr-6">
            <DrawerTitle asChild>{headerContent}</DrawerTitle>
            <DrawerDescription className="sr-only">Werkorder details</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto flex-1">{content}</div>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pr-6">
          <DialogTitle asChild>{headerContent}</DialogTitle>
          <DialogDescription className="sr-only">Werkorder details</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto -mr-2 pr-2 flex-1">{content}</div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
