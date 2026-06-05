<script setup lang="ts">
import type { VisibleFeature } from '~/composables/usePermissions'

const props = defineProps<{ feature: VisibleFeature }>()

const isExternal = computed(() => props.feature.external)

function openInternal() {
  if (props.feature.comingSoon) return
  navigateTo(props.feature.route)
}
</script>

<template>
  <component
    :is="isExternal ? 'a' : 'button'"
    :href="isExternal ? feature.route : undefined"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener noreferrer' : undefined"
    :type="isExternal ? undefined : 'button'"
    :disabled="!isExternal && feature.comingSoon"
    class="block rounded-xl border border-default bg-default p-4 text-left transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
    @click="isExternal ? undefined : openInternal()"
  >
    <div class="mb-3 flex size-9 items-center justify-center rounded-lg bg-elevated">
      <UIcon :name="feature.icon" class="size-5 text-primary" />
    </div>
    <div class="flex items-center gap-2 font-semibold text-highlighted">
      {{ feature.title }}
      <UBadge v-if="feature.comingSoon" color="neutral" variant="subtle" size="sm" label="规划中" />
      <UIcon v-if="isExternal" name="i-lucide-external-link" class="size-3.5 text-muted" />
    </div>
    <div class="mt-1 text-sm text-muted">{{ feature.description }}</div>
  </component>
</template>
