<script setup lang="ts">
const props = defineProps<{ feature: string, permission?: string }>()
const { can, pending } = usePermissions()
const allowed = computed(() => can(props.feature, props.permission))
</script>

<template>
  <div>
    <div v-if="pending" class="py-16 text-center text-muted">加载中…</div>
    <slot v-else-if="allowed" />
    <div v-else class="py-14 text-center">
      <UIcon name="i-lucide-lock" class="mb-2 size-10 text-muted" />
      <div class="text-highlighted">无权访问此功能</div>
      <div class="mt-1 text-sm text-muted">如需使用，请联系管理员开通</div>
      <div class="mt-3">
        <UButton to="/" variant="link" label="返回首页" />
      </div>
    </div>
  </div>
</template>
