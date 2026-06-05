import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { db } from '../db'
import * as authSchema from '../db/schema.auth'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    // Personal hub: no self sign-up. Users are created by the admin only.
    disableSignUp: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 // sliding renewal once per day
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin']
    })
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL
})

export type Auth = typeof auth
