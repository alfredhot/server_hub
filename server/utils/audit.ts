import { randomUUID } from 'node:crypto'
import { db } from '~~/db'
import { auditLog } from '~~/db/schema.app'

export async function writeAudit(params: {
  actorId?: string | null
  action: string
  targetId?: string | null
  meta?: Record<string, unknown>
}) {
  await db.insert(auditLog).values({
    id: randomUUID(),
    actorId: params.actorId ?? null,
    action: params.action,
    targetId: params.targetId ?? null,
    meta: params.meta ?? null
  })
}
