import { auth } from '~~/lib/auth'

// Paths that never require authentication.
const WHITELIST = ['/api/auth', '/login', '/_nuxt', '/__nuxt', '/favicon', '/public']

export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (WHITELIST.some(p => path.startsWith(p))) return

  const session = await auth.api.getSession({ headers: event.headers })
  event.context.session = session

  // Page requests are redirected by the client route guard; API requests get 401.
  if (!session && path.startsWith('/api')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
