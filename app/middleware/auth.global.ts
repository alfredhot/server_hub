/** Redirect unauthenticated users to /login (except the login page itself). */
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const session = await $fetch<{ session?: unknown } | null>('/api/auth/get-session', { headers })
    .catch(() => null)

  if (!session?.session) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
