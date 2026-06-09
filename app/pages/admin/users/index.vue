<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'

definePageMeta({ middleware: 'admin' })

interface AdminUser {
  id: string
  email: string
  name: string
  role?: string | null
  banned?: boolean | null
}

const users = ref<AdminUser[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  const res = await authClient.admin.listUsers({ query: { limit: 100 } })
  users.value = (res.data?.users ?? []) as AdminUser[]
  loading.value = false
}
// admin client uses relative URLs — load on the client only.
onMounted(load)

const open = ref(false)
const form = reactive({ email: '', password: '', name: '', role: 'user' })
const creating = ref(false)
const createError = ref('')
const roles = ['user', 'guest', 'admin']

async function create() {
  creating.value = true
  createError.value = ''
  const { error } = await authClient.admin.createUser({
    email: form.email,
    password: form.password,
    name: form.name || form.email,
    role: form.role as 'user' | 'admin'
  })
  creating.value = false
  if (error) {
    createError.value = error.message || '创建失败'
    return
  }
  open.value = false
  Object.assign(form, { email: '', password: '', name: '', role: 'user' })
  await load()
}

async function changeRole(u: AdminUser, role: string) {
  await authClient.admin.setRole({ userId: u.id, role: role as 'user' | 'admin' })
  await load()
}

async function toggleBan(u: AdminUser) {
  if (u.banned) await authClient.admin.unbanUser({ userId: u.id })
  else await authClient.admin.banUser({ userId: u.id })
  await load()
}

function roleColor(role?: string | null) {
  return role === 'admin' ? 'primary' : role === 'guest' ? 'neutral' : 'info'
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">用户管理</h1>
        <p class="mt-1 text-sm text-muted">创建用户、调整角色与功能授权。</p>
      </div>
      <UButton icon="i-lucide-plus" label="新建用户" color="neutral" @click="open = true" />
    </div>

    <div v-if="loading" class="text-muted">加载中…</div>

    <div
      v-else-if="!users.length"
      class="rounded-2xl border border-dashed border-default py-16 text-center text-muted"
    >
      还没有其他用户
    </div>

    <div v-else class="overflow-hidden rounded-2xl bg-default shadow-sm ring-1 ring-zinc-200/70">
      <table class="w-full text-sm">
        <thead class="bg-elevated/60 text-left text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">邮箱</th>
            <th class="px-4 py-3 font-medium">姓名</th>
            <th class="px-4 py-3 font-medium">角色</th>
            <th class="px-4 py-3 font-medium">状态</th>
            <th class="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-t border-zinc-200/60 transition hover:bg-elevated/40">
            <td class="px-4 py-3 text-highlighted">{{ u.email }}</td>
            <td class="px-4 py-3">{{ u.name }}</td>
            <td class="px-4 py-3">
              <UBadge :color="roleColor(u.role)" variant="subtle" :label="u.role || 'user'" />
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1.5" :class="u.banned ? 'text-error' : 'text-success'">
                <span class="size-1.5 rounded-full" :class="u.banned ? 'bg-error' : 'bg-success'" />
                {{ u.banned ? '已封禁' : '正常' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <USelect
                  :model-value="u.role || 'user'"
                  :items="roles"
                  size="xs"
                  @update:model-value="(r: string) => changeRole(u, r)"
                />
                <UButton
                  :to="`/admin/users/${u.id}`"
                  label="权限"
                  size="xs"
                  color="neutral"
                  variant="soft"
                />
                <UButton
                  :label="u.banned ? '解封' : '封禁'"
                  size="xs"
                  :color="u.banned ? 'neutral' : 'error'"
                  variant="ghost"
                  @click="toggleBan(u)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" title="新建用户">
      <template #body>
        <div class="space-y-4">
          <UAlert v-if="createError" color="error" variant="subtle" :title="createError" />
          <UFormField label="邮箱">
            <UInput v-model="form.email" type="email" class="w-full" />
          </UFormField>
          <UFormField label="初始密码">
            <UInput v-model="form.password" type="password" class="w-full" />
          </UFormField>
          <UFormField label="姓名（可选）">
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="角色">
            <USelect v-model="form.role" :items="roles" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="取消" color="neutral" variant="ghost" @click="open = false" />
          <UButton label="创建" :loading="creating" @click="create" />
        </div>
      </template>
    </UModal>
  </div>
</template>
