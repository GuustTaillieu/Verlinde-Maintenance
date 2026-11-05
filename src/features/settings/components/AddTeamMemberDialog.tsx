import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/features/shared/components/ui/select'
import { Loader2, UserPlus } from 'lucide-react'

interface AddTeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: {
    name: string
    email: string
    role: 'MANAGER' | 'TECHNICIAN'
    title?: string
    specialties: string[]
    weeklySchedule: {
      mon: number
      tue: number
      wed: number
      thu: number
      fri: number
    }
  }) => Promise<void>
}

export function AddTeamMemberDialog({
  open,
  onOpenChange,
  onAdd,
}: AddTeamMemberDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'MANAGER' | 'TECHNICIAN'>('TECHNICIAN')
  const [title, setTitle] = useState('')
  const [scheduleType, setScheduleType] = useState<'full' | 'part'>('full')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return

    setIsSubmitting(true)
    try {
      const weeklySchedule =
        scheduleType === 'full'
          ? { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 }
          : { mon: 8, tue: 8, wed: 4, thu: 8, fri: 0 }

      await onAdd({
        name,
        email,
        role,
        title: title || (role === 'MANAGER' ? 'Projectbeheerder' : 'Technicus Buitendienst'),
        specialties: ['INTRUSION', 'CCTV', 'FIRE'],
        weeklySchedule,
      })
      onOpenChange(false)
      setName('')
      setEmail('')
      setTitle('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="size-4 text-foreground" />
            Nieuwe Medewerker Toevoegen
          </DialogTitle>
          <DialogDescription className="text-xs">
            Voeg een technicus of manager toe inclusief werkregeling en rechten.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div className="space-y-1">
            <Label className="text-xs">Naam</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bv. Sam Verstraete"
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">E-mailadres</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sam@verlinde-beveiliging.be"
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Rol</Label>
              <Select
                value={role}
                onValueChange={(val) => setRole(val as 'MANAGER' | 'TECHNICIAN')}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECHNICIAN" className="text-xs">
                    Technicus
                  </SelectItem>
                  <SelectItem value="MANAGER" className="text-xs">
                    Manager (Beheerder)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Uurrooster</Label>
              <Select
                value={scheduleType}
                onValueChange={(val) => setScheduleType(val as 'full' | 'part')}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full" className="text-xs">
                    Voltijds (40u / 5d)
                  </SelectItem>
                  <SelectItem value="part" className="text-xs">
                    Deeltijds (28u / 4d)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Functietitel (optioneel)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bv. Senior Servicetechnicus"
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name || !email}
              className="text-xs h-8 gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              Medewerker Opslaan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

