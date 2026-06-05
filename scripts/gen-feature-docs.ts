/**
 * Generate docs/FEATURES.md (human-readable) from the machine docs:
 *   - lib/features/registry.ts   → canonical key/title/route/permissions
 *   - docs/features/<key>.json   → supplemental status/summary/endpoints/tables/...
 *   - docs/features/_changelog.jsonl → recent change history
 *
 * DO NOT hand-edit docs/FEATURES.md — re-run `npm run docs:features` instead.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FEATURES } from '../lib/features/registry'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const featuresDir = join(root, 'docs', 'features')

interface Supp {
  key: string
  status?: string
  summary?: string
  endpoints?: string[]
  tables?: string[]
  files?: string[]
  notes?: string
  updated?: string
  title?: string
  permissions?: string[]
}

// --- load supplemental per-feature json ---
const supp: Record<string, Supp> = {}
for (const f of readdirSync(featuresDir)) {
  if (!f.endsWith('.json')) continue
  const data = JSON.parse(readFileSync(join(featuresDir, f), 'utf8')) as Supp
  supp[data.key] = data
}

// --- merge registry + supplemental ---
const keys = new Set<string>([...FEATURES.map(f => f.key), ...Object.keys(supp)])
const merged = [...keys].map((key) => {
  const reg = FEATURES.find(f => f.key === key)
  const s = supp[key] || { key }
  const status = s.status || (reg?.comingSoon ? 'planned' : reg ? 'active' : 'unknown')
  return {
    key,
    title: reg?.title || s.title || key,
    description: reg?.description || '',
    route: reg?.route || '',
    permissions: reg?.permissions || s.permissions || [],
    status,
    summary: s.summary || reg?.description || '',
    endpoints: s.endpoints || [],
    tables: s.tables || [],
    files: s.files || [],
    notes: s.notes || '',
    updated: s.updated || ''
  }
}).sort((a, b) => a.key.localeCompare(b.key))

const STATUS_LABEL: Record<string, string> = {
  active: '✅ 可用',
  planned: '🚧 规划中',
  removed: '🗑️ 已移除',
  unknown: '❔ 未知'
}

// --- changelog (newest first) ---
const clPath = join(featuresDir, '_changelog.jsonl')
const changelog = existsSync(clPath)
  ? readFileSync(clPath, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
  : []
const recent = changelog.slice(-20).reverse()

// --- build markdown ---
const lines: string[] = []
lines.push('# 功能总览')
lines.push('')
lines.push('> 本文件由 `npm run docs:features` 从 `docs/features/*.json` 与 `lib/features/registry.ts` 生成，**请勿手工编辑**。')
lines.push('')
lines.push('## 总览')
lines.push('')
lines.push('| 功能 | key | 状态 | 入口 | 权限 | 摘要 |')
lines.push('|------|-----|------|------|------|------|')
for (const m of merged) {
  lines.push(`| ${m.title} | \`${m.key}\` | ${STATUS_LABEL[m.status] || m.status} | ${m.route || '—'} | ${m.permissions.join(', ') || '—'} | ${m.summary || '—'} |`)
}
lines.push('')

for (const m of merged) {
  lines.push(`## ${m.title} \`${m.key}\``)
  lines.push('')
  lines.push(`- **状态**：${STATUS_LABEL[m.status] || m.status}`)
  if (m.route) lines.push(`- **入口**：${m.route}`)
  if (m.permissions.length) lines.push(`- **权限**：${m.permissions.join(', ')}`)
  if (m.summary) lines.push(`- **摘要**：${m.summary}`)
  if (m.endpoints.length) lines.push(`- **接口**：${m.endpoints.map(e => `\`${e}\``).join('、')}`)
  if (m.tables.length) lines.push(`- **数据表**：${m.tables.map(t => `\`${t}\``).join('、')}`)
  if (m.files.length) lines.push(`- **主要文件**：${m.files.map(f => `\`${f}\``).join('、')}`)
  if (m.notes) lines.push(`- **备注**：${m.notes}`)
  if (m.updated) lines.push(`- **更新于**：${m.updated}`)
  lines.push('')
}

lines.push('## 最近变更')
lines.push('')
if (recent.length) {
  for (const c of recent) {
    lines.push(`- \`${c.ts}\` **${c.action}** \`${c.key}\` — ${c.summary}`)
  }
} else {
  lines.push('（暂无）')
}
lines.push('')

writeFileSync(join(root, 'docs', 'FEATURES.md'), lines.join('\n'))
console.log(`[docs] wrote docs/FEATURES.md — ${merged.length} features, ${recent.length} recent changes`)
