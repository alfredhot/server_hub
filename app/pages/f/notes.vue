<script setup lang="ts">
interface Note { id: string, body: string, createdAt: string | number }

const { data: notes, refresh } = await useFetch<Note[]>('/api/features/notes', {
  headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
  default: () => []
})
const draft = ref('')
const saving = ref(false)

async function add() {
  if (!draft.value.trim()) return
  saving.value = true
  await $fetch('/api/features/notes', { method: 'POST', body: { body: draft.value } })
  draft.value = ''
  saving.value = false
  await refresh()
}

async function remove(id: string) {
  await $fetch(`/api/features/notes/${id}`, { method: 'DELETE' })
  await refresh()
}

function fmt(ts: string | number) {
  return new Date(ts).toLocaleString('zh-CN')
}
</script>

<template>
  <FeatureGuard feature="notes">
    <div class="max-w-xl">
      <h1 class="mb-3 text-xl font-bold text-highlighted">速记</h1>

      <div class="mb-4 flex gap-2">
        <UTextarea
          v-model="draft"
          :rows="2"
          autoresize
          placeholder="记点什么…"
          class="flex-1"
        />
        <UButton :loading="saving" label="添加" @click="add" />
      </div>

      <div
        v-if="!notes?.length"
        class="rounded-lg border border-dashed border-default py-12 text-center text-muted"
      >
        还没有任何速记
      </div>

      <div v-else class="divide-y divide-default rounded-lg border border-default bg-default">
        <div v-for="n in notes" :key="n.id" class="flex items-start justify-between gap-3 p-3">
          <div>
            <div class="whitespace-pre-wrap text-highlighted">{{ n.body }}</div>
            <div class="mt-1 text-xs text-muted">{{ fmt(n.createdAt) }}</div>
          </div>
          <UButton
            icon="i-lucide-trash-2"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="删除"
            @click="remove(n.id)"
          />
        </div>
      </div>
    </div>
  </FeatureGuard>
</template>
