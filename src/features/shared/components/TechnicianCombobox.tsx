import * as React from 'react'
import {
  Combobox,
  ComboboxTrigger,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '#/features/shared/components/ui/combobox'
import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { Button } from '#/features/shared/components/ui/button'
import { Avatar, AvatarFallback } from '#/features/shared/components/ui/avatar'
import { Clock } from 'lucide-react'
import { cn } from '#/features/shared/lib/utils'

export interface TechnicianOption {
  id: string
  name: string
  title?: string | null
  techCode?: string | null
  initials?: string | null
  role?: string
  availableHours?: number
}

interface TechnicianComboboxProps {
  technicians: TechnicianOption[]
  value: string
  onValueChange: (val: string) => void
  recommendedTechId?: string
  placeholder?: string
  className?: string
  align?: 'start' | 'end' | 'center'
  containerRef?: React.RefObject<HTMLDivElement | null>
}

export function TechnicianCombobox({
  technicians,
  value,
  onValueChange,
  recommendedTechId,
  placeholder = 'Selecteer technicus...',
  className = 'w-56',
  align = 'start',
  containerRef,
}: TechnicianComboboxProps) {
  const selectedTech = technicians.find((t) => t.id === value)

  const items = React.useMemo(() => {
    return ComboboxPrimitive.createItems(technicians, {
      getValue: (t: TechnicianOption) => t.id,
      getLabel: (t: TechnicianOption) => `${t.name} ${t.techCode ? `(${t.techCode})` : ''}`,
    })
  }, [technicians])

  return (
    <Combobox
      value={value}
      onValueChange={(val) => {
        const nextId = typeof val === 'string' ? val : (val as TechnicianOption | null)?.id
        if (nextId) {
          onValueChange(nextId)
        }
      }}
      items={items}
      defaultValue={selectedTech?.id || recommendedTechId}
      itemToStringLabel={(techId) => {
        const tech = technicians.find((t) => t.id === techId)
        return tech ? `${tech.name} ${tech.techCode ? `(${tech.techCode})` : ''}` : ''
      }}
    >
      <ComboboxTrigger
        render={
          <Button
            variant="outline"
            className={cn('justify-between font-normal text-xs bg-background shadow-2xs h-9 px-2.5 w-56', className)}
          />
        }
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedTech ? (
            <>
              <Avatar className="size-6 text-[9px] shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[9px]">
                  {selectedTech.initials || selectedTech.techCode || selectedTech.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-semibold text-foreground">{selectedTech.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </ComboboxTrigger>

      <ComboboxContent align={align} container={containerRef} className="max-h-56 w-56 shadow-md z-50">
        <ComboboxInput
          placeholder="Zoek technicus..."
          showTrigger={false}
          className="m-1 h-8 text-xs"
        />
        <ComboboxEmpty className="py-3 text-center text-xs text-muted-foreground">
          Geen technicus gevonden.
        </ComboboxEmpty>
        <ComboboxList>
          {(tech: TechnicianOption) => {
            const availableHours = tech.availableHours

            return (
              <ComboboxItem key={tech.id} value={tech.id} className="text-xs py-1.5 cursor-pointer">
                <div className="flex items-center gap-2 w-full truncate">
                  <Avatar className="size-6 text-[9px]">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[9px]">
                      {tech.initials || tech.techCode || tech.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col truncate flex-1 min-w-0">
                    <span className="font-semibold text-foreground truncate">{tech.name}</span>
                    {availableHours !== undefined && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="size-2.5 text-primary" />
                        <span className="font-medium text-primary">{availableHours}u</span> beschikbaar
                      </span>
                    )}
                  </div>
                </div>
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
