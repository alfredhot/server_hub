import { FEATURES } from '~~/lib/features/registry'

/**
 * 点缀色系统：白底主体，按规律给各功能分配一组明快色作为点缀。
 * 不设单一主色 —— 色彩由各功能卡片分散承载，骨架保持中性。
 * 规则：按功能在 registry 中的顺序取色（前 8 个互不重复），未登记的 key 回退到稳定哈希。
 * 每个字段都写成完整字面量类名，保证 Tailwind 能静态扫描到。
 */
export interface Accent {
  /** 图标块背景 */
  tileBg: string
  /** 图标颜色 */
  iconText: string
  /** 悬停时卡片描边（需配合 group + ring-1） */
  hoverRing: string
}

const ACCENTS: Accent[] = [
  { tileBg: 'bg-rose-50', iconText: 'text-rose-500', hoverRing: 'group-hover:ring-rose-300/70' },
  { tileBg: 'bg-orange-50', iconText: 'text-orange-500', hoverRing: 'group-hover:ring-orange-300/70' },
  { tileBg: 'bg-amber-50', iconText: 'text-amber-500', hoverRing: 'group-hover:ring-amber-300/70' },
  { tileBg: 'bg-emerald-50', iconText: 'text-emerald-500', hoverRing: 'group-hover:ring-emerald-300/70' },
  { tileBg: 'bg-sky-50', iconText: 'text-sky-500', hoverRing: 'group-hover:ring-sky-300/70' },
  { tileBg: 'bg-violet-50', iconText: 'text-violet-500', hoverRing: 'group-hover:ring-violet-300/70' },
  { tileBg: 'bg-fuchsia-50', iconText: 'text-fuchsia-500', hoverRing: 'group-hover:ring-fuchsia-300/70' },
  { tileBg: 'bg-cyan-50', iconText: 'text-cyan-500', hoverRing: 'group-hover:ring-cyan-300/70' }
]

/** 优先按 registry 顺序取色（保证前 8 个功能颜色各异）；未登记则回退稳定哈希。 */
export function accentFor(key: string): Accent {
  const idx = FEATURES.findIndex(f => f.key === key)
  if (idx >= 0) return ACCENTS[idx % ACCENTS.length]!
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return ACCENTS[h % ACCENTS.length]!
}
