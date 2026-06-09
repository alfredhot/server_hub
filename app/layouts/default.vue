<script setup lang="ts">
import { signOut } from '~~/lib/auth-client'

const { user, isAdmin } = useMe()

async function logout() {
  await signOut()
  await navigateTo('/login')
}

const initial = computed(() =>
  (user.value?.name || user.value?.email || '?').charAt(0).toUpperCase()
)
</script>

<template>
  <div class="min-h-screen bg-default">
    <header class="sticky top-0 z-20 border-b border-zinc-200/60 bg-default/75 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <span class="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-sm">
            <UIcon name="i-lucide-layout-grid" class="size-4 text-white" />
          </span>
          <span class="font-semibold tracking-tight text-highlighted">Server Hub</span>
        </NuxtLink>

        <div class="flex items-center gap-1.5">
          <UButton
            v-if="isAdmin"
            to="/admin/users"
            icon="i-lucide-users"
            label="管理"
            color="neutral"
            variant="ghost"
            size="sm"
          />
          <UColorModeButton />
          <NuxtLink
            to="/account"
            class="mx-1 hidden items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-elevated sm:flex"
          >
            <span class="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 text-xs font-semibold text-zinc-600">
              {{ initial }}
            </span>
            <span class="text-sm text-muted">{{ user?.name || user?.email }}</span>
          </NuxtLink>
          <UButton
            to="/account"
            icon="i-lucide-settings"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="账号设置"
          />
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="退出"
            @click="logout"
          />
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <slot />
    </main>
  </div>
</template>
