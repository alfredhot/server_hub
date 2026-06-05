import type { H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '~~/db'
import { featureGrant } from '~~/db/schema.app'
import { FEATURES, getFeature, type Role } from '~~/lib/features/registry'
import { requireUser, type SessionUser } from './auth'

/**
 * Effective permissions for a user on a feature:
 *   role default (code) ⊕ per-user grant (db).
 * Returns the permission list, or null if the feature is not visible.
 */
export async function effectivePermissions(
  user: { id: string, role?: string | null },
  featureKey: string
): Promise<string[] | null> {
  const feat = getFeature(featureKey)
  if (!feat) return null

  const role = (user.role ?? 'user') as Role

  // Admin always has every permission.
  if (role === 'admin') {
    return [...feat.permissions]
  }

  // Role baseline.
  const def = feat.defaultByRole[role]
  let base: string[] | null
  if (def === 'all') base = [...feat.permissions]
  else if (!def) base = null
  else base = [...def]

  // Per-user override.
  const grant = await db
    .select()
    .from(featureGrant)
    .where(and(eq(featureGrant.userId, user.id), eq(featureGrant.featureKey, featureKey)))
    .get()

  if (grant) {
    if (!grant.enabled) return null
    base = grant.permissions && grant.permissions.length ? grant.permissions : (base ?? [])
  }

  return base
}

/** Features visible to the user, with their effective permissions. */
export async function visibleFeatures(user: { id: string, role?: string | null }) {
  const out: { feature: (typeof FEATURES)[number], permissions: string[] }[] = []
  for (const feature of FEATURES) {
    const perms = await effectivePermissions(user, feature.key)
    if (perms) out.push({ feature, permissions: perms })
  }
  return out
}

/** Guard a feature endpoint. Throws 401/403; returns the user on success. */
export async function requireFeature(
  event: H3Event,
  featureKey: string,
  perm?: string
): Promise<SessionUser> {
  const user = requireUser(event)
  const perms = await effectivePermissions(user, featureKey)
  if (!perms || (perm && !perms.includes(perm))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
