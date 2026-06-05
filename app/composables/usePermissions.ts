export interface VisibleFeature {
  key: string
  title: string
  description: string
  icon: string
  route: string
  comingSoon: boolean
  permissions: string[]
}

/** Loads the current user's visible features + effective permissions. */
export function usePermissions() {
  const { data, refresh, pending } = useFetch<VisibleFeature[]>('/api/features/visible', {
    key: 'visible-features',
    headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
    default: () => []
  })

  const can = (key: string, perm?: string) => {
    const f = data.value?.find(x => x.key === key)
    return !!f && (!perm || f.permissions.includes(perm))
  }

  return { features: data, can, refresh, pending }
}
