import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#/features/shared/components/ui/dialog'
import { Button } from '#/features/shared/components/ui/button'
import { Input } from '#/features/shared/components/ui/input'
import { Label } from '#/features/shared/components/ui/label'
import { Textarea } from '#/features/shared/components/ui/textarea'
import { FileCheck, UploadCloud, CheckCircle2, Loader2, Paperclip } from 'lucide-react'
import type { FireInspectionItem, UploadFireAttestInput } from '../types'

interface UploadAttestContextValue {
  item: FireInspectionItem
  documentName: string
  setDocumentName: (name: string) => void
  officeNotes: string
  setOfficeNotes: (notes: string) => void
  isSubmitting: boolean
  onUpload: () => Promise<void>
  onClose: () => void
}

const UploadAttestContext = React.createContext<UploadAttestContextValue | null>(null)

export function useUploadAttest() {
  const context = React.useContext(UploadAttestContext)
  if (!context) {
    throw new Error('useUploadAttest must be used within UploadAttestDialog')
  }
  return context
}

export function AttestSiteSummary() {
  const { item } = useUploadAttest()

  return (
    <div className="rounded-lg border border-border p-3 space-y-1 bg-muted/30 text-xs">
      <div className="font-semibold text-foreground">{item.siteName}</div>
      <div className="text-muted-foreground">
        {item.customerName} • {item.siteCity}
      </div>
    </div>
  )
}

export function UploadAttestDialogHeader() {
  return (
    <DialogHeader className="p-6 pb-2">
      <DialogTitle className="text-base font-semibold flex items-center gap-2">
        <FileCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
        Keuringsattest Opladen
      </DialogTitle>
      <DialogDescription className="text-xs">
        Registreer het keuringsverslag van Brandtec BV. De onderhoudscyclus wordt met 1 jaar verlengd.
      </DialogDescription>
    </DialogHeader>
  )
}



export function UploadAttestDialogBody() {
  const { documentName, setDocumentName, officeNotes, setOfficeNotes } =
    useUploadAttest()

  return (
    <div className="space-y-4 px-6 text-xs">
      <AttestSiteSummary />

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
  )
}

export function UploadAttestDialogFooter() {
  const { documentName, isSubmitting, onUpload, onClose } = useUploadAttest()

  return (
    <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex sm:flex-row items-center justify-between shrink-0">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClose}
        disabled={isSubmitting}
        className="text-xs h-8"
      >
        Annuleren
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={onUpload}
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
    </DialogFooter>
  )
}

export interface UploadAttestDialogProps {
  item: FireInspectionItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: UploadFireAttestInput) => Promise<void>
  children?: React.ReactNode
}

export function UploadAttestDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
  children,
}: UploadAttestDialogProps) {
  const [documentName, setDocumentName] = React.useState('keuringsattest_brandtec_2025.pdf')
  const [officeNotes, setOfficeNotes] = React.useState(
    'Conform NBN S 21-100 gecontroleerd door Brandtec. Geen opmerkingen.'
  )


  const [isSubmitting, setIsSubmitting] = React.useState(false)

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

  const contextValue: UploadAttestContextValue = {
    item,
    documentName,
    setDocumentName,
    officeNotes,
    setOfficeNotes,
    isSubmitting,
    onUpload: handleUpload,
    onClose: () => onOpenChange(false),
  }

  return (
    <UploadAttestContext.Provider value={contextValue}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md w-full flex flex-col p-0 overflow-hidden bg-background">
          {children || (
            <>
              <UploadAttestDialogHeader />
              <UploadAttestDialogBody />
              <UploadAttestDialogFooter />
            </>
          )}
        </DialogContent>
      </Dialog>
    </UploadAttestContext.Provider>
  )
}

// Compound component attachments
UploadAttestDialog.Header = UploadAttestDialogHeader
UploadAttestDialog.Body = UploadAttestDialogBody
UploadAttestDialog.SiteSummary = AttestSiteSummary
UploadAttestDialog.Footer = UploadAttestDialogFooter

