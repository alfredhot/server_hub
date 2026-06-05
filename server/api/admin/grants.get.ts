import { eq } from 'drizzle-orm'
import { db } from '~~/db'
import { featureGrant } from '~~/db/schema.app'

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')
  const userId = getQuery(event).userId?.toString()
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'userId required' })
  return db.select().from(featureGrant).where(eq(featureGrant.userId, userId)).all()
})
