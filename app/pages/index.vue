<script setup lang="ts">
const { features, pending } = usePermissions()
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-highlighted">功能中枢</h1>
      <p class="mt-1 text-sm text-muted">你被授权的功能都在这里。</p>
    </div>

    <div v-if="pending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 3" :key="i" class="h-36 animate-pulse rounded-2xl bg-elevated" />
    </div>

    <div
      v-else-if="!features?.length"
      class="flex flex-col items-center rounded-2xl border border-dashed border-default py-20 text-center"
    >
      <div class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-elevated">
        <UIcon name="i-lucide-folder-open" class="size-6 text-dimmed" />
      </div>
      <div class="font-medium text-highlighted">还没有可用的功能</div>
      <div class="mt-1 text-sm text-muted">请联系管理员为你开通。</div>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FeatureCard v-for="f in features" :key="f.key" :feature="f" />
    </div>
  </div>
</template>
