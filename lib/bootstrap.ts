import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { auth } from './auth'
import { db } from '../db'
import { user, account } from '../db/schema.auth'

/**
 * Idempotently ensure the admin account exists. Reads ADMIN_EMAIL /
 * ADMIN_PASSWORD. Safe to call on every startup.
 */
export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.warn('[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed')
    return
  }

  const existing = db.select().from(user).where(eq(user.email, email)).get()
  if (existing) return

  const ctx = await auth.$context
  const hashed = await ctx.password.hash(password)
  const userId = randomUUID()
  const now = new Date()

  db.insert(user)
    .values({
      id: userId,
      name: process.env.ADMIN_NAME || 'Admin',
      email,
      emailVerified: true,
      role: 'admin',
      createdAt: now,
      updatedAt: now
    })
    .run()

  db.insert(account)
    .values({
      id: randomUUID(),
      accountId: userId,
      providerId: 'credential',
      userId,
      password: hashed,
      createdAt: now,
      updatedAt: now
    })
    .run()

  console.log(`[seed] created admin: ${email} — change the password after first login`)
}
