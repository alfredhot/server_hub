import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const url = process.env.DATABASE_URL || './data/hub.db'

// Ensure the parent directory exists (e.g. ./data) before opening the file.
try {
  mkdirSync(dirname(url), { recursive: true })
} catch {
  // ignore — directory may already exist
}

const sqlite = new Database(url)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle({ client: sqlite })
export { sqlite }
