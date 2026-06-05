import { desc, eq } from 'drizzle-orm'
import { db } from '~~/db'
import { note } from '~~/db/schema.app'

export default defineEventHandler(async (event) => {
  const user = await requireFeature(event, 'notes', 'read')
  return db.select().from(note).where(eq(note.userId, user.id)).orderBy(desc(note.createdAt)).all()
})
