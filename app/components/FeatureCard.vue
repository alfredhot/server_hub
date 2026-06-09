<script setup lang="ts">
import type { VisibleFeature } from '~/composables/usePermissions'
import { accentFor } from '~/utils/accent'

const props = defineProps<{ feature: VisibleFeature }>()

const isExternal = computed(() => props.feature.external)
const accent = computed(() => accentFor(props.feature.key))

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
    class="group relative flex w-full flex-col rounded-2xl bg-default p-5 text-left shadow-sm ring-1 ring-zinc-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-55 disabled:shadow-none"
    :class="accent.hoverRing"
    @click="isExternal ? undefined : openInternal()"
  >
    <div class="mb-4 flex items-start justify-between">
      <div
        class="flex size-11 items-center justify-center rounded-xl transition duration-200 group-hover:scale-105"
        :class="accent.tileBg"
      >
        <UIcon :name="feature.icon" class="size-5" :class="accent.iconText" />
      </div>
      <UIcon
        v-if="isExternal"
        name="i-lucide-arrow-up-right"
        class="size-4 text-dimmed transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-default"
      />
      <UIcon
        v-else-if="!feature.comingSoon"
        name="i-lucide-arrow-right"
        class="size-4 text-dimmed transition duration-200 group-hover:translate-x-0.5 group-hover:text-default"
      />
    </div>

    <div class="flex items-center gap-2">
      <span class="font-semibold text-highlighted">{{ feature.title }}</span>
      <UBadge v-if="feature.comingSoon" color="neutral" variant="subtle" size="sm" label="规划中" />
    </div>
    <p class="mt-1 text-sm leading-relaxed text-muted">{{ feature.description }}</p>
  </component>
</template>
