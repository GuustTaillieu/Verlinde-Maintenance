import { useState } from 'react'
import { Button } from '#/features/shared/components/ui/button'
import { Badge } from '#/features/shared/components/ui/badge'
import { Avatar, AvatarFallback } from '#/features/shared/components/ui/avatar'
import { UserPlus, Clock, Wrench } from 'lucide-react'
import { AddTeamMemberDialog } from './AddTeamMemberDialog'
import type { TeamMemberDto } from '../server/settingsMutations'

interface TeamManagementSectionProps {
  members: TeamMemberDto[]
  onAddMember: (data: {
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

export function TeamManagementSection({
  members,
  onAddMember,
}: TeamManagementSectionProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)

  const getTotalHours = (schedule: TeamMemberDto['weeklySchedule']) => {
    return (schedule.mon || 0) + (schedule.tue || 0) + (schedule.wed || 0) + (schedule.thu || 0) + (schedule.fri || 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-foreground">Team & Technici</h4>
          <p className="text-[11px] text-muted-foreground">
            Beheer actieve medewerkers, rollen en wekelijkse uurroosters.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="h-7 text-xs gap-1.5"
        >
          <UserPlus className="size-3" />
          Medewerker Toevoegen
        </Button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
        {members.map((member) => {
          const totalHours = getTotalHours(member.weeklySchedule)
          const isManager = member.role === 'MANAGER'

          return (
            <div
              key={member.id}
              className="p-3 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg text-[11px] font-semibold bg-muted text-foreground">
                    {member.initials || member.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {member.name}
                    </span>
                    <Badge
                      variant={isManager ? 'default' : 'secondary'}
                      className="text-[9px] py-0 px-1.5"
                    >
                      {isManager ? 'Manager' : 'Technicus'}
                    </Badge>

                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {member.title || member.email} • {member.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                  <Clock className="size-3" />
                  <span>{totalHours}u/week</span>
                </div>

                {member.specialties.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    <Wrench className="size-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {member.specialties.slice(0, 2).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AddTeamMemberDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={onAddMember}
      />
    </div>
  )
}

