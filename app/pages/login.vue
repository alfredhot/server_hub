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
  <div class="rounded-2xl bg-default p-7 shadow-xl shadow-zinc-200/50 ring-1 ring-zinc-200/70">
    <div class="mb-6 flex flex-col items-center text-center">
      <span class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-sm">
        <UIcon name="i-lucide-layout-grid" class="size-6 text-white" />
      </span>
      <div class="text-lg font-semibold tracking-tight text-highlighted">欢迎回来</div>
      <div class="mt-1 text-sm text-muted">登录 Server Hub 继续</div>
    </div>

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
          icon="i-lucide-mail"
          size="lg"
          class="w-full"
        />
      </UFormField>
      <UFormField label="密码">
        <UInput
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          icon="i-lucide-lock"
          size="lg"
          class="w-full"
        />
      </UFormField>
      <UButton type="submit" block size="lg" color="neutral" :loading="loading" label="登录" />
    </form>
  </div>
</template>
