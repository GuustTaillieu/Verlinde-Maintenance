import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { user } from '#/db/schema'
import { desc } from 'drizzle-orm'

export interface TeamMemberDto {
  id: string
  name: string
  email: string
  role: 'MANAGER' | 'TECHNICIAN'
  isContractor: boolean
  techCode: string | null
  initials: string | null
  title: string | null
  specialties: string[]
  weeklySchedule: {
    mon: number
    tue: number
    wed: number
    thu: number
    fri: number
  }
}

export const getTeamMembersFn = createServerFn({ method: 'GET' }).handler(async (): Promise<TeamMemberDto[]> => {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isContractor: user.isContractor,
      techCode: user.techCode,
      initials: user.initials,
      title: user.title,
      specialties: user.specialties,
      weeklySchedule: user.weeklySchedule,
    })
    .from(user)
    .orderBy(desc(user.role), user.name)

  return rows.map((r) => ({
    ...r,
    specialties: r.specialties || [],
    weeklySchedule: r.weeklySchedule || { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
  }))
})

export const createTeamMemberFn = createServerFn({ method: 'POST' })
  .validator(
    (d: {
      name: string
      email: string
      role: 'MANAGER' | 'TECHNICIAN'
      title?: string
      initials?: string
      techCode?: string
      specialties?: string[]
      weeklySchedule?: {
        mon: number
        tue: number
        wed: number
        thu: number
        fri: number
      }
    }) => d
  )
  .handler(async ({ data }): Promise<TeamMemberDto> => {
    const id = `usr_${Date.now()}`
    const initials =
      data.initials ||
      data.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 3)

    const schedule = data.weeklySchedule || { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 }
    const specialties = data.specialties || ['INTRUSION', 'CCTV']

    const newMember = {
      id,
      name: data.name,
      email: data.email,
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: data.role,
      isContractor: false,
      techCode: data.techCode || initials,
      initials,
      title: data.title || (data.role === 'MANAGER' ? 'Projectbeheerder' : 'Technicus'),
      specialties,
      weeklySchedule: schedule,
    }

    await db.insert(user).values(newMember)

    return {
      id: newMember.id,
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      isContractor: newMember.isContractor,
      techCode: newMember.techCode,
      initials: newMember.initials,
      title: newMember.title,
      specialties: newMember.specialties,
      weeklySchedule: newMember.weeklySchedule,
    }
  })
