import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { user } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthUser } from '#/features/auth/server/authGuards'

export interface TechnicianUser {
  id: string
  name: string
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

export const getTechniciansFn = createServerFn({ method: 'GET' }).handler(async (): Promise<TechnicianUser[]> => {
  await requireAuthUser()
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      role: user.role,
      isContractor: user.isContractor,
      techCode: user.techCode,
      initials: user.initials,
      title: user.title,
      specialties: user.specialties,
      weeklySchedule: user.weeklySchedule,
    })
    .from(user)
    .where(and(eq(user.role, 'TECHNICIAN'), eq(user.isContractor, false)))

  return rows.map((r) => ({
    ...r,
    specialties: r.specialties || [],
    weeklySchedule: r.weeklySchedule || { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
  }))
})

