<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
import { FEATURES } from '~~/lib/features/registry'

definePageMeta({ middleware: 'admin' })

interface GrantState { enabled: boolean, permissions: string[] }

const route = useRoute()
const userId = route.params.id as string

const userInfo = ref<{ id: string, email: string, name: string, role?: string | null } | null>(null)
const grants = reactive<Record<string, GrantState>>(
  Object.fromEntries(FEATURES.map(f => [f.key, { enabled: false, permissions: [] as string[] }]))
)
const loading = ref(true)
const saving = ref(false)
const saved = ref(false)

async function load() {
  const res = await authClient.admin.listUsers({ query: { limit: 200 } })
  userInfo.value = (res.data?.users ?? []).find((u: { id: string }) => u.id === userId) ?? null
  const rows = await $fetch<Array<{ featureKey: string, enabled: boolean, permissions: string[] }>>(
    '/api/admin/grants',
    { query: { userId } }
  )
  for (const f of FEATURES) {
    const row = rows.find(r => r.featureKey === f.key)
    grants[f.key] = row
      ? { enabled: !!row.enabled, permissions: [...(row.permissions || [])] }
      : { enabled: false, permissions: [] }
  }
  loading.value = false
}
onMounted(load)

function togglePerm(key: string, perm: string, on: boolean) {
  const s = grants[key]
  if (!s) return
  const i = s.permissions.indexOf(perm)
  if (on && i < 0) s.permissions.push(perm)
  if (!on && i >= 0) s.permissions.splice(i, 1)
}

async function save() {
  saving.value = true
  saved.value = false
  for (const f of FEATURES) {
    const s = grants[f.key]
    await $fetch('/api/admin/grants', {
      method: 'POST',
      body: { userId, featureKey: f.key, enabled: s.enabled, permissions: s.permissions }
    })
  }
  saving.value = false
  saved.value = true
}
</script>

<template>
  <div class="max-w-2xl">
    <UButton to="/admin/users" icon="i-lucide-arrow-left" label="返回用户列表" variant="link" class="mb-3 px-0" />

    <div class="mb-4 flex items-center gap-3">
      <div class="flex size-9 items-center justify-center rounded-full bg-elevated font-bold text-primary">
        {{ (userInfo?.name || userInfo?.email || '?').charAt(0).toUpperCase() }}
      </div>
      <div>
        <div class="font-bold text-highlighted">{{ userInfo?.name || '—' }}</div>
        <div class="text-xs text-muted">{{ userInfo?.email }} · {{ userInfo?.role || 'user' }}</div>
      </div>
    </div>

    <div class="mb-2 text-sm text-muted">功能授权（逐项开关，并勾选该功能内权限）</div>

    <div class="divide-y divide-default rounded-xl border border-default bg-default">
      <div v-for="f in FEATURES" :key="f.key" class="flex items-center justify-between gap-4 p-3">
        <div class="flex items-center gap-3">
          <USwitch v-model="grants[f.key].enabled" />
          <div>
            <div class="text-highlighted" :class="!grants[f.key].enabled && 'text-muted'">{{ f.title }}</div>
            <div class="text-xs text-muted">{{ f.key }}</div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <UCheckbox
            v-for="p in f.permissions"
            :key="p"
            :model-value="grants[f.key].permissions.includes(p)"
            :label="p"
            :disabled="!grants[f.key].enabled"
            @update:model-value="(v: boolean) => togglePerm(f.key, p, v)"
          />
        </div>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-end gap-3">
      <span v-if="saved" class="text-sm text-success">已保存</span>
      <UButton label="保存权限" :loading="saving" @click="save" />
    </div>
  </div>
</template>
