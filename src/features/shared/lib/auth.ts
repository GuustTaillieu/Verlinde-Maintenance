import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '#/db/index'
import { user, session, account, verification } from '#/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'TECHNICIAN',
      },
      isContractor: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
      techCode: {
        type: 'string',
        required: false,
      },
      initials: {
        type: 'string',
        required: false,
      },
      title: {
        type: 'string',
        required: false,
      },
      specialties: {
        type: 'string',
        required: false,
      },
      weeklySchedule: {
        type: 'string',
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [tanstackStartCookies()],
})
