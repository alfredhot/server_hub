/**
 * Feature registry — the single source of truth for what features exist and
 * their default access by role. Adding a feature = appending one entry here.
 * The hub home page and the admin permission editor both read this list.
 */
export type Role = 'admin' | 'user' | 'guest'

export interface FeatureDef {
  key: string
  title: string
  description: string
  icon: string
  route: string
  /** Fine-grained permissions this feature supports. */
  permissions: string[]
  /** Default access per role: 'all' = every permission, false = not visible. */
  defaultByRole: Partial<Record<Role, string[] | 'all' | false>>
  /** Marks a placeholder feature whose page is not built yet. */
  comingSoon?: boolean
}

export const FEATURES: FeatureDef[] = [
  {
    key: 'notes',
    title: '速记',
    description: '随手记 + 时间线',
    icon: 'i-lucide-notebook-pen',
    route: '/f/notes',
    permissions: ['read', 'write'],
    defaultByRole: { admin: 'all', user: ['read', 'write'], guest: false }
  },
  {
    key: 'downloader',
    title: '文件下载器',
    description: 'Telegram 媒体同步（规划中）',
    icon: 'i-lucide-download',
    route: '/f/downloader',
    permissions: ['read', 'write'],
    defaultByRole: { admin: 'all', user: false, guest: false },
    comingSoon: true
  },
  {
    key: 'webhook',
    title: '通知中枢',
    description: 'Webhook → Telegram（规划中）',
    icon: 'i-lucide-bell',
    route: '/f/webhook',
    permissions: ['read', 'write'],
    defaultByRole: { admin: 'all', user: false, guest: false },
    comingSoon: true
  }
]

export function getFeature(key: string): FeatureDef | undefined {
  return FEATURES.find(f => f.key === key)
}
