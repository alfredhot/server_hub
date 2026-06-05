<script setup lang="ts">
import { signIn } from '~~/lib/auth-client'

definePageMeta({ layout: 'auth' })

const route = useRoute()

// Already logged in → go home.
const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const existing = await $fetch<{ session?: unknown } | null>('/api/auth/get-session', { headers })
  .catch(() => null)
if (existing?.session) {
  await navigateTo('/')
}

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  const { error: err } = await signIn.email({ email: email.value, password: password.value })
  loading.value = false
  if (err) {
    error.value = err.code === 'INVALID_EMAIL_OR_PASSWORD'
      ? '邮箱或密码不正确'
      : (err.message || '登录失败')
    return
  }
  await navigateTo((route.query.redirect as string) || '/')
}
</script>

<template>
  <UCard class="w-full max-w-sm">
    <template #header>
      <div class="text-center">
        <div class="text-xl font-bold text-highlighted">Server Hub</div>
        <div class="mt-1 text-sm text-muted">请登录以继续</div>
      </div>
    </template>

    <form class="space-y-4" @submit.prevent="submit">
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        :title="error"
      />
      <UFormField label="邮箱">
        <UInput
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          class="w-full"
        />
      </UFormField>
      <UFormField label="密码">
        <UInput
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          class="w-full"
        />
      </UFormField>
      <UButton type="submit" block :loading="loading" label="登录" />
    </form>
  </UCard>
</template>
