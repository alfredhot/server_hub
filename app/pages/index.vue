<script setup lang="ts">
const { features, pending } = usePermissions()
</script>

<template>
  <div>
    <h1 class="mb-4 text-xl font-bold text-highlighted">功能</h1>

    <div v-if="pending" class="text-muted">加载中…</div>

    <div
      v-else-if="!features?.length"
      class="rounded-xl border border-dashed border-default py-16 text-center text-muted"
    >
      <UIcon name="i-lucide-folder-open" class="mb-2 size-10" />
      <div>你还没有被授予任何功能</div>
      <div class="mt-1 text-sm">请联系管理员开通</div>
    </div>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <FeatureCard v-for="f in features" :key="f.key" :feature="f" />
    </div>
  </div>
</template>
