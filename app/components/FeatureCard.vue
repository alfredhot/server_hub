<script setup lang="ts">
import type { VisibleFeature } from '~/composables/usePermissions'

const props = defineProps<{ feature: VisibleFeature }>()

function open() {
  if (props.feature.comingSoon) return
  navigateTo(props.feature.route)
}
</script>

<template>
  <button
    type="button"
    :disabled="feature.comingSoon"
    class="rounded-xl border border-default bg-default p-4 text-left transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
    @click="open"
  >
    <div class="mb-3 flex size-9 items-center justify-center rounded-lg bg-elevated">
      <UIcon :name="feature.icon" class="size-5 text-primary" />
    </div>
    <div class="flex items-center gap-2 font-semibold text-highlighted">
      {{ feature.title }}
      <UBadge v-if="feature.comingSoon" color="neutral" variant="subtle" size="sm" label="规划中" />
    </div>
    <div class="mt-1 text-sm text-muted">{{ feature.description }}</div>
  </button>
</template>
