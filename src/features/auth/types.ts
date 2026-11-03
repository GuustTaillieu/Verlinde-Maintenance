export type UserRole = 'MANAGER' | 'TECHNICIAN'

export interface UserSpecialties {
  specialties: ('FIRE' | 'INTRUSION' | 'CCTV' | 'ACCESS')[]
}

export interface WeeklySchedule {
  mon: number
  tue: number
  wed: number
  thu: number
  fri: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  role: UserRole
  isContractor: boolean
  techCode?: string | null
  initials?: string | null
  title?: string | null
  specialties?: string[] | null
  weeklySchedule?: WeeklySchedule | null
}

