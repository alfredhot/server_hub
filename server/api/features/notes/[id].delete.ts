import { and, eq } from 'drizzle-orm'
import { db } from '~~/db'
import { note } from '~~/db/schema.app'

export default defineEventHandler(async (event) => {
  const user = await requireFeature(event, 'notes', 'write')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  db.delete(note).where(and(eq(note.id, id), eq(note.userId, user.id))).run()
  return { ok: true }
})
