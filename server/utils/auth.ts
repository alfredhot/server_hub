import type { H3Event } from 'h3'
import { auth } from '~~/lib/auth'

export type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>
export type SessionUser = NonNullable<SessionResult>['user'] & { role?: string | null }

export function sessionFromEvent(event: H3Event): SessionResult {
  return (event.context.session ?? null) as SessionResult
}

export function requireUser(event: H3Event): SessionUser {
  const s = sessionFromEvent(event)
  if (!s) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return s.user as SessionUser
}

export function requireRole(event: H3Event, role: string): SessionUser {
  const user = requireUser(event)
  if ((user.role ?? 'user') !== role) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
