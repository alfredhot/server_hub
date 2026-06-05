import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: ['./db/schema.auth.ts', './db/schema.app.ts'],
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/hub.db'
  }
})
