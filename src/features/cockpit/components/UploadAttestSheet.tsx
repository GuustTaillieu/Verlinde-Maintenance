import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '#/features/shared/components/ui/sheet'
import { Button } from '#/features/shared/components/ui/button'
import { Input } from '#/features/shared/components/ui/input'
import { Label } from '#/features/shared/components/ui/label'
import { Textarea } from '#/features/shared/components/ui/textarea'
import { FileCheck, UploadCloud, CheckCircle2, Loader2, Paperclip } from 'lucide-react'
import type { FireTodoItem } from '../types'

interface UploadAttestSheetProps {
  item: FireTodoItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: {
    workOrderId: string
    siteId: string
    certificateDocument: string
    officeNotes?: string
  }) => Promise<void>
}

export function UploadAttestSheet({
  item,
  open,
  onOpenChange,
  onConfirm,
}: UploadAttestSheetProps) {
  const [documentName, setDocumentName] = useState('keuringsattest_brandtec_2025.pdf')
  const [officeNotes, setOfficeNotes] = useState('Conform NBN S 21-100 gecontroleerd door Brandtec. Geen opmerkingen.')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!item || !item.workOrderId) return null

  const handleUpload = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm({
        workOrderId: item.workOrderId!,
        siteId: item.siteId,
        certificateDocument: documentName,
        officeNotes,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col justify-between">
        <div className="space-y-5">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold flex items-center gap-2">
              <FileCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              Keuringsattest Opladen
            </SheetTitle>
            <SheetDescription className="text-xs">
              Registreer het keuringsverslag van Brandtec BV. De onderhoudscyclus wordt met 1 jaar verlengd.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 text-xs">
            <div className="rounded-lg border border-border p-3 space-y-1 bg-muted/30">
              <div className="font-semibold text-foreground">{item.siteName}</div>
              <div className="text-muted-foreground">{item.customerName} • {item.siteCity}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attest-file" className="text-xs font-medium flex items-center gap-1.5">
                <Paperclip className="size-3.5 text-muted-foreground" />
                Certificaatbestand (PDF)
              </Label>
              <div className="relative">
                <Input
                  id="attest-file"
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setDocumentName(file.name)
                  }}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:cursor-pointer"
                />
              </div>
              {documentName && (
                <div className="flex items-center gap-2 rounded-md bg-secondary/50 p-2 text-[11px] font-mono text-muted-foreground border border-border">
                  <UploadCloud className="size-3.5 text-foreground" />
                  <span className="truncate">{documentName}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Kantooropmerking</Label>
              <Textarea
                rows={3}
                value={officeNotes}
                onChange={(e) => setOfficeNotes(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>
        </div>

        <SheetFooter className="gap-2 sm:gap-0 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs h-8"
          >
            Annuleren
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleUpload}
            disabled={isSubmitting || !documentName.trim()}
            className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            Valideren (+1J)
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

