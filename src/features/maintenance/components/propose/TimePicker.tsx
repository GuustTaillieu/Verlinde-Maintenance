const PRESET_TIME_SLOTS = [
    { start: '08:30', end: '10:30', label: '08:30 - 10:30 (Ochtend 1)' },
    { start: '09:00', end: '11:00', label: '09:00 - 11:00 (Aanbevolen)' },
    { start: '10:30', end: '12:30', label: '10:30 - 12:30 (Ochtend 2)' },
    { start: '13:00', end: '15:00', label: '13:00 - 15:00 (Namiddag 1)' },
    { start: '14:30', end: '16:30', label: '14:30 - 16:30 (Namiddag 2)' },
]

type TimePickerProps = {
    startTime: string
    endTime: string
    onSelectTimeSlot: (startTime: string, endTime: string) => void
}

export function TimePicker({
    startTime,
    endTime,
    onSelectTimeSlot,
}: TimePickerProps) {
    return (
        // this cols query is good but i want max 2 cols and this doesnt do it
        <div className="grid 2xl:grid-cols-2 xl:grid-cols-1 grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] md:grid-cols-2 gap-1.5">
            {PRESET_TIME_SLOTS.map((slot) => {
                const isSelected = startTime === slot.start && endTime === slot.end
                return (
                    <button
                        key={slot.label}
                        type="button"
                        onClick={() => onSelectTimeSlot(slot.start, slot.end)}
                        className={`p-2 rounded-lg border text-left text-xs transition-colors ${isSelected
                            ? 'border-primary bg-primary/10 text-primary font-medium shadow-2xs'
                            : 'border-border bg-card hover:bg-muted/40 text-foreground'
                            }`}
                    >
                        <div className="font-mono text-[11px] font-semibold">{slot.start} - {slot.end}</div>
                        <div className="text-[10px] text-muted-foreground">{slot.label}</div>
                    </button>
                )
            })}
        </div>
    )
}