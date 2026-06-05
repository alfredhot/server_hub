interface SessionUser {
  id: string
  name: string
  email: string
  role?: string | null
  banned?: boolean | null
}

/** Reactive current-user/session, SSR-safe (forwards the cookie on the server). */
export function useMe() {
  const { data, refresh, pending } = useFetch<{ user: SessionUser } | null>('/api/auth/get-session', {
    key: 'me',
    headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
    default: () => null
  })

  const user = computed(() => data.value?.user ?? null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  return { session: data, user, isAdmin, refresh, pending }
}
