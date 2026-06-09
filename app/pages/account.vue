<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'

const { user } = useMe()

const current = ref('')
const next = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function submit() {
  error.value = ''
  success.value = false
  if (next.value.length < 8) {
    error.value = '新密码至少 8 位'
    return
  }
  if (next.value !== confirm.value) {
    error.value = '两次输入的新密码不一致'
    return
  }
  if (next.value === current.value) {
    error.value = '新密码不能与当前密码相同'
    return
  }

  loading.value = true
  const { error: err } = await authClient.changePassword({
    currentPassword: current.value,
    newPassword: next.value,
    revokeOtherSessions: true // 改密后吊销其他设备的登录
  })
  loading.value = false

  if (err) {
    error.value = err.code === 'INVALID_PASSWORD'
      ? '当前密码不正确'
      : (err.message || '修改失败')
    return
  }
  success.value = true
  current.value = ''
  next.value = ''
  confirm.value = ''
}
</script>

<template>
  <div class="max-w-lg">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-highlighted">账号设置</h1>
      <p class="mt-1 text-sm text-muted">{{ user?.name || user?.email }} · {{ user?.email }}</p>
    </div>

    <div class="rounded-2xl bg-default p-6 shadow-sm ring-1 ring-zinc-200/70">
      <div class="mb-4 flex items-center gap-2">
        <div class="flex size-9 items-center justify-center rounded-xl bg-sky-50">
          <UIcon name="i-lucide-key-round" class="size-5 text-sky-500" />
        </div>
        <div>
          <div class="font-semibold text-highlighted">修改密码</div>
          <div class="text-xs text-muted">修改后其他设备会被强制重新登录</div>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="error"
        />
        <UAlert
          v-if="success"
          color="success"
          variant="subtle"
          icon="i-lucide-circle-check"
          title="密码已更新"
        />
        <UFormField label="当前密码">
          <UInput
            v-model="current"
            type="password"
            autocomplete="current-password"
            icon="i-lucide-lock"
            size="lg"
            class="w-full"
          />
        </UFormField>
        <UFormField label="新密码" help="至少 8 位">
          <UInput
            v-model="next"
            type="password"
            autocomplete="new-password"
            icon="i-lucide-lock-keyhole"
            size="lg"
            class="w-full"
          />
        </UFormField>
        <UFormField label="确认新密码">
          <UInput
            v-model="confirm"
            type="password"
            autocomplete="new-password"
            icon="i-lucide-lock-keyhole"
            size="lg"
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end">
          <UButton type="submit" color="neutral" size="lg" :loading="loading" label="更新密码" />
        </div>
      </form>
    </div>
  </div>
</template>
