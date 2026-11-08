import { useState } from 'react'
import { TechnicianDayNavigator } from './TechnicianDayNavigator'
import { TechnicianPartTimeBanner } from './TechnicianPartTimeBanner'
import { TechnicianSlotCard } from './TechnicianSlotCard'
import { TechnicianExecutionDrawer } from './execution/TechnicianExecutionDrawer'
import { useTechnicianMutations } from '../hooks/useTechnicianMutations'
import { Card } from '#/features/shared/components/ui/card'
import { CalendarCheck } from 'lucide-react'
import type { TechnicianDayData, TechnicianWorkOrder } from '../types'

interface TechnicianScheduleRootProps {
  data: TechnicianDayData
  onSelectDate: (dateIso: string) => void
  selectedWoId?: string
}

export function TechnicianScheduleRoot({
  data,
  onSelectDate,
  selectedWoId,
}: TechnicianScheduleRootProps) {
  const { date, scheduledDailyHours, isDayOff, isHalfDay, slots } = data

  // Initial selected work order if specified in URL or user taps a card
  const initialSelected = selectedWoId
    ? slots.find((s) => s.id === selectedWoId) || null
    : null

  const [selectedSlot, setSelectedSlot] = useState<TechnicianWorkOrder | null>(initialSelected)

  // Encapsulated mutation pipeline
  const { toggleItem, completeOrder, isCompleting } = useTechnicianMutations(date)

  // Keep selectedSlot synchronized with freshest slot data from query cache
  const activeSlot = selectedSlot
    ? slots.find((s) => s.id === selectedSlot.id) || selectedSlot
    : null

  const handleToggleItem = (
    itemId: string,
    isChecked: boolean,
    description?: string,
    quantity?: number
  ) => {
    if (!activeSlot) return
    toggleItem({
      workOrderId: activeSlot.id,
      itemId,
      isChecked,
      description,
      quantity,
    })
  }

  const handleCompleteOrder = async (
    signedByName: string,
    signatureDataUrl?: string,
    techNotes?: string
  ) => {
    if (!activeSlot) return
    await completeOrder({
      workOrderId: activeSlot.id,
      signedByName,
      signatureDataUrl,
      techNotes,
    })
  }

  const completedCount = slots.filter((s) => s.status === 'COMPLETED').length

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-16 w-full">
      {/* Clean Header: Mijn Dagschema + Progress */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Mijn Dagschema
          </h1>
        </div>

        {slots.length > 0 && (
          <div className="text-right text-xs">
            <span className="font-semibold text-foreground">
              {completedCount}/{slots.length} Voltooid
            </span>
            <span className="text-[11px] text-muted-foreground block font-mono">
              {slots.reduce((sum, s) => sum + s.durationHours, 0)}u gepland
            </span>
          </div>
        )}
      </div>

      {/* Day Navigator (prev workday, today, next workday with weekend skipping) */}
      <TechnicianDayNavigator
        currentDate={date}
        onSelectDate={onSelectDate}
      />

      {/* Part-time & Day Off schedule notification */}
      <TechnicianPartTimeBanner
        isDayOff={isDayOff}
        isHalfDay={isHalfDay}
        scheduledDailyHours={scheduledDailyHours}
      />

      {/* Work Orders List */}
      <div className="space-y-3">
        {slots.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/10 p-8 text-center space-y-2">
            <CalendarCheck className="size-8 text-muted-foreground/60 mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">
              Geen werkorders ingepland
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Er zijn geen interventies of onderhouden aan u toegewezen voor deze werkdag.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <TechnicianSlotCard
                key={slot.id}
                slot={slot}
                onSelect={(s) => setSelectedSlot(s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stepped Interactive Execution Drawer / Dialog */}
      <TechnicianExecutionDrawer
        workOrder={activeSlot}
        open={Boolean(activeSlot)}
        onOpenChange={(open) => !open && setSelectedSlot(null)}
        onToggleItem={handleToggleItem}
        onComplete={handleCompleteOrder}
        isCompleting={isCompleting}
      />
    </div>
  )
}
