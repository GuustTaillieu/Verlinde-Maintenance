import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { user, account } from '#/db/schema'
import { desc } from 'drizzle-orm'
import { z } from 'zod'
import { requireAuthUser } from '#/features/auth/server/authGuards'
import { hashPassword } from 'better-auth/crypto'

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

export const createTeamMemberInputSchema = z.object({
  name: z.string().min(2, 'Naam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  role: z.enum(['MANAGER', 'TECHNICIAN']),
  title: z.string().optional(),
  initials: z.string().optional(),
  techCode: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  weeklySchedule: z
    .object({
      mon: z.number().min(0).max(12),
      tue: z.number().min(0).max(12),
      wed: z.number().min(0).max(12),
      thu: z.number().min(0).max(12),
      fri: z.number().min(0).max(12),
    })
    .optional(),
})

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberInputSchema>

export const getTeamMembersFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<TeamMemberDto[]> => {
    await requireAuthUser(['MANAGER'])

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
  }
)

export const createTeamMemberFn = createServerFn({ method: 'POST' })
  .validator(createTeamMemberInputSchema)
  .handler(async ({ data }): Promise<TeamMemberDto> => {
    await requireAuthUser(['MANAGER'])

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
    const now = new Date()
    const defaultPassword = 'password123'
    const passwordHash = await hashPassword(defaultPassword)

    const newMember = {
      id,
      name: data.name,
      email: data.email,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
      role: data.role,
      isContractor: false,
      techCode: data.techCode || initials,
      initials,
      title: data.title || (data.role === 'MANAGER' ? 'Projectbeheerder' : 'Technicus'),
      specialties,
      weeklySchedule: schedule,
    }

    // Atomic transaction: Insert user + auth credential account
    await db.transaction(async (tx) => {
      await tx.insert(user).values(newMember)
      await tx.insert(account).values({
        id: `acc_${newMember.id}`,
        accountId: newMember.id,
        providerId: 'credential',
        userId: newMember.id,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      })
    })

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
