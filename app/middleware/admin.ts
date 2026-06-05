/** Named middleware for /admin/* pages — requires the admin role. */
export default defineNuxtRouteMiddleware(async (to) => {
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const session = await $fetch<{ session?: unknown, user?: { role?: string } } | null>(
    '/api/auth/get-session',
    { headers }
  ).catch(() => null)

  if (!session?.session) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (session.user?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '需要管理员权限' })
  }
})
