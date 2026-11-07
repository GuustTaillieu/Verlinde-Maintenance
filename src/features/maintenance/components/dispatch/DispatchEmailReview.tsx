import * as React from 'react'
import { Input } from '#/features/shared/components/ui/input'
import { Textarea } from '#/features/shared/components/ui/textarea'
import { Badge } from '#/features/shared/components/ui/badge'
import { Button } from '#/features/shared/components/ui/button'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/features/shared/components/ui/toggle-group'
import {
  Mail,
  Bold,
  Italic,
  List,
  Clock,
  MapPin,
  CheckCircle2,
  User,
} from 'lucide-react'
import { useClusterDispatch } from './ClusterDispatchContext'
import { formatDateDutch } from '../../utils/dateUtils'
import {
  handleAutoBulletOnEnter,
  generateCustomerBatchEmail,
} from '../../utils/emailTemplateUtils'

export function DispatchEmailReview() {
  const {
    cluster,
    planner,
    emailDrafts,
    updateEmailDraft,
    selectedCustomerId,
    setSelectedCustomerId,
  } = useClusterDispatch()

  const customersList = React.useMemo(() => Object.values(emailDrafts), [emailDrafts])

  const activeDraft = emailDrafts[selectedCustomerId] || customersList[0]

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const handleApplyFormat = (formatType: string) => {
    if (!activeDraft || !textareaRef.current) return
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const currentText = activeDraft.body
    const selectedText = currentText.substring(start, end)

    let replacement = ''
    if (formatType === 'bold') {
      replacement = selectedText ? `**${selectedText}**` : '**belangrijk**'
    } else if (formatType === 'italic') {
      replacement = selectedText ? `*${selectedText}*` : '*let op*'
    } else if (formatType === 'list') {
      replacement = selectedText ? `\n• ${selectedText}` : '\n• Extra opmerking: '
    }

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end)
    updateEmailDraft(activeDraft.customerId, { body: newText })

    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 0)
  }

  const handleTemplateChange = (template: 'standard' | 'concise' | 'urgent') => {
    if (!activeDraft) return
    const newBody = generateCustomerBatchEmail(
      activeDraft.customerName,
      cluster.city,
      planner.activeTech.name,
      activeDraft.sites,
      template
    )
    updateEmailDraft(activeDraft.customerId, { body: newBody })
  }

  if (!activeDraft) {
    return (
      <div className="-mx-4 flex-1 flex items-center justify-center p-12 text-sm text-muted-foreground">
        Geen werven geselecteerd om e-mails voor op te stellen.
      </div>
    )
  }

  return (
    <div className="-mx-4 flex flex-1 min-h-0 divide-x divide-border overflow-hidden">
      {/* Left: Customer Switcher Sidebar */}
      <div className="w-80 flex flex-col h-full min-h-0 bg-muted/10 shrink-0 overflow-hidden">
        <div className="p-4 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <span>Voorstel E-mails ({customersList.length})</span>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Eén gegroepeerde mail per klant met alle geselecteerde werven.
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          {customersList.map((draft) => {
            const isSelected = draft.customerId === activeDraft.customerId
            return (
              <div
                key={draft.customerId}
                onClick={() => setSelectedCustomerId(draft.customerId)}
                className={`rounded-lg border p-3 text-xs cursor-pointer transition-all select-none ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-2xs'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-sm truncate">
                    {draft.customerName}
                  </span>
                  <Badge
                    variant={isSelected ? 'default' : 'secondary'}
                    className="text-[10px] font-mono px-1.5 py-0 h-4.5"
                  >
                    {draft.sites.length} {draft.sites.length === 1 ? 'werf' : 'werven'}
                  </Badge>
                </div>

                <div className="text-[11px] text-muted-foreground truncate mt-1">
                  {draft.toEmail || 'Geen e-mailadres gekoppeld'}
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/50 pt-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Klaar voor verzending
                  </span>
                  <span className="font-mono text-primary font-medium">
                    {draft.sites.reduce((acc, s) => acc + s.durationHours, 0)}u
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: Email Editor */}
      <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden">
        {/* Email Header Fields */}
        <div className="p-4 border-b border-border space-y-3 bg-muted/15 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">
                Voorstel voor {activeDraft.customerName}
              </span>
              <Badge variant="outline" className="text-[10px] font-normal">
                {activeDraft.sites.length} {activeDraft.sites.length === 1 ? 'werf' : 'werven'} in {cluster.city}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              Technicus: <strong className="text-foreground">{planner.activeTech.name}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0 font-medium">Aan:</span>
              <Input
                value={activeDraft.toEmail}
                onChange={(e) =>
                  updateEmailDraft(activeDraft.customerId, { toEmail: e.target.value })
                }
                placeholder="klant@bedrijf.be"
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0 font-medium">Onderwerp:</span>
              <Input
                value={activeDraft.subject}
                onChange={(e) =>
                  updateEmailDraft(activeDraft.customerId, { subject: e.target.value })
                }
                className="h-8 text-xs bg-background font-medium"
              />
            </div>
          </div>
        </div>

        {/* Toolbar & Text Editor Area */}
        <div className="px-4 py-2 border-b border-border bg-muted/25 flex items-center justify-between shrink-0 gap-2">
          {/* Formatting tools */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-medium">Opmaak:</span>
            <ToggleGroup type="multiple" size="sm" variant="outline" className="h-7">
              <ToggleGroupItem
                value="bold"
                onClick={() => handleApplyFormat('bold')}
                className="h-7 px-2"
                title="Vetgedrukt"
              >
                <Bold className="size-3" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="italic"
                onClick={() => handleApplyFormat('italic')}
                className="h-7 px-2"
                title="Cursief"
              >
                <Italic className="size-3" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="list"
                onClick={() => handleApplyFormat('list')}
                className="h-7 px-2"
                title="Opsomming"
              >
                <List className="size-3" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Quick templates */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Sjabloon:</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTemplateChange('standard')}
                className="h-6.5 text-[10px] px-2"
              >
                Standaard
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTemplateChange('concise')}
                className="h-6.5 text-[10px] px-2"
              >
                Kort
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTemplateChange('urgent')}
                className="h-6.5 text-[10px] px-2 text-amber-600 dark:text-amber-400"
              >
                Dringend
              </Button>
            </div>
          </div>
        </div>

        {/* Editor & Planned Sites Split View */}
        <div className="flex-1 min-h-0 flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Body Textarea */}
          <div className="flex-1 flex flex-col min-h-48">
            <Textarea
              ref={textareaRef}
              value={activeDraft.body}
              onKeyDown={(e) => {
                handleAutoBulletOnEnter(e, activeDraft.body, (nextBody) => {
                  updateEmailDraft(activeDraft.customerId, { body: nextBody })
                })
              }}
              onChange={(e) =>
                updateEmailDraft(activeDraft.customerId, { body: e.target.value })
              }
              placeholder="Typ hier het bericht voor de klant..."
              className="flex-1 w-full text-xs font-mono leading-relaxed bg-background p-3.5 resize-none border-border"
            />
          </div>

          {/* Bottom Card: Reserved Appointments Summary for this Customer */}
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3.5 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Gereserveerde tijdsloten voor {activeDraft.customerName}
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Worden als &apos;Gereserveerd&apos; vastgelegd tot bevestiging
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {activeDraft.sites.map((slot) => (
                <div
                  key={slot.siteId}
                  className="rounded-lg border border-border/80 bg-background/80 p-2 text-xs space-y-1 shadow-2xs"
                >
                  <div className="font-semibold text-foreground text-xs flex items-center justify-between">
                    <span className="truncate">{slot.siteName}</span>
                    <span className="text-[10px] font-mono text-primary font-bold shrink-0">
                      {slot.durationHours}u
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{slot.siteAddress}</span>
                  </div>
                  <div className="text-[11px] font-mono font-medium text-foreground/90 pt-0.5 border-t border-border/50">
                    {formatDateDutch(slot.plannedDate)} ({slot.startTime} – {slot.endTime})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
