<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface AuditRow {
  id: string
  actorId: string | null
  action: string
  targetId: string | null
  meta: Record<string, unknown> | null
  createdAt: string | number
}

const { data: rows } = await useFetch<AuditRow[]>('/api/admin/audit', {
  headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
  default: () => []
})

function fmt(ts: string | number) {
  return new Date(ts).toLocaleString('zh-CN')
}
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-semibold tracking-tight text-highlighted">审计日志</h1>

    <div
      v-if="!rows?.length"
      class="rounded-2xl border border-dashed border-default py-16 text-center text-muted"
    >
      暂无记录
    </div>

    <div v-else class="divide-y divide-zinc-200/60 overflow-hidden rounded-2xl bg-default shadow-sm ring-1 ring-zinc-200/70">
      <div v-for="r in rows" :key="r.id" class="flex items-center justify-between gap-4 p-4 text-sm transition hover:bg-elevated/40">
        <div>
          <span class="font-medium text-highlighted">{{ r.action }}</span>
          <span class="text-muted"> · target {{ r.targetId || '—' }}</span>
          <span v-if="r.meta" class="text-muted"> · {{ JSON.stringify(r.meta) }}</span>
        </div>
        <span class="shrink-0 text-muted">{{ fmt(r.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>
