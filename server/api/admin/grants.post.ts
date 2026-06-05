import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '~~/db'
import { featureGrant } from '~~/db/schema.app'
import { getFeature } from '~~/lib/features/registry'

export default defineEventHandler(async (event) => {
  const admin = requireRole(event, 'admin')
  const body = await readBody(event)
  const userId = body?.userId?.toString()
  const featureKey = body?.featureKey?.toString()
  const feat = featureKey ? getFeature(featureKey) : undefined
  if (!userId || !feat) {
    throw createError({ statusCode: 400, statusMessage: 'invalid userId / featureKey' })
  }
  const enabled = !!body?.enabled
  const perms: string[] = Array.isArray(body?.permissions)
    ? body.permissions.filter((p: string) => feat.permissions.includes(p))
    : []

  const existing = db
    .select()
    .from(featureGrant)
    .where(and(eq(featureGrant.userId, userId), eq(featureGrant.featureKey, featureKey)))
    .get()

  const now = new Date()
  if (existing) {
    db.update(featureGrant)
      .set({ enabled, permissions: perms, grantedBy: admin.id, updatedAt: now })
      .where(eq(featureGrant.id, existing.id))
      .run()
  } else {
    db.insert(featureGrant)
      .values({
        id: randomUUID(),
        userId,
        featureKey,
        enabled,
        permissions: perms,
        grantedBy: admin.id,
        createdAt: now,
        updatedAt: now
      })
      .run()
  }

  await writeAudit({
    actorId: admin.id,
    action: 'grant.update',
    targetId: userId,
    meta: { featureKey, enabled, permissions: perms }
  })

  return { ok: true }
})
