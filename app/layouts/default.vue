<script setup lang="ts">
import { signOut } from '~~/lib/auth-client'

const { user, isAdmin } = useMe()

async function logout() {
  await signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-default">
    <header class="sticky top-0 z-10 border-b border-default bg-default/80 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <NuxtLink to="/" class="font-bold text-highlighted">Server Hub</NuxtLink>
        <div class="flex items-center gap-2">
          <UButton
            v-if="isAdmin"
            to="/admin/users"
            icon="i-lucide-users"
            label="管理"
            color="neutral"
            variant="ghost"
          />
          <UColorModeButton />
          <span class="hidden text-sm text-muted sm:inline">{{ user?.name || user?.email }}</span>
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            aria-label="退出"
            @click="logout"
          />
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>
