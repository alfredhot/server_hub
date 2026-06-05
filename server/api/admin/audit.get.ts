import { desc } from 'drizzle-orm'
import { db } from '~~/db'
import { auditLog } from '~~/db/schema.app'

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100).all()
})
