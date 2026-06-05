import { randomUUID } from 'node:crypto'
import { db } from '~~/db'
import { note } from '~~/db/schema.app'

export default defineEventHandler(async (event) => {
  const user = await requireFeature(event, 'notes', 'write')
  const body = await readBody(event)
  const text = (body?.body ?? '').toString().trim()
  if (!text) throw createError({ statusCode: 400, statusMessage: '内容不能为空' })
  const row = { id: randomUUID(), userId: user.id, body: text, createdAt: new Date() }
  db.insert(note).values(row).run()
  return row
})
