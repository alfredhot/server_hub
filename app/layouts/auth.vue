<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-default p-6">
    <!-- 白底为主，仅以极淡的明快光晕点缀，营造现代感而不抢主体 -->
    <div class="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-sky-300/20 blur-3xl" />
    <div class="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full bg-violet-300/20 blur-3xl" />
    <div class="relative w-full max-w-sm">
      <slot />
    </div>
  </div>
</template>
