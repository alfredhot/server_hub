import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from '~~/db'
import { ensureAdmin } from '~~/lib/bootstrap'

/**
 * Run pending migrations and ensure the admin account on server startup.
 * Makes the container fully self-initializing — no manual steps.
 */
export default defineNitroPlugin(async () => {
  try {
    migrate(db, { migrationsFolder: './drizzle' })
  } catch (err) {
    console.error('[migrate] failed:', err)
  }
  try {
    await ensureAdmin()
  } catch (err) {
    console.error('[seed] failed:', err)
  }
})
