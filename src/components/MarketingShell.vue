<template>
  <main class="home-page">
    <div class="home-grid-bg" aria-hidden="true"></div>
    <PublicHeader />
    <slot />
  </main>
</template>

<script setup>
import PublicHeader from './PublicHeader.vue'
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 1.25rem clamp(1rem, 3vw, 2.5rem) 3rem;
  position: relative;
  overflow: hidden;
}

.home-grid-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 18% 14%, rgba(255, 51, 102, 0.18), transparent 28rem),
    radial-gradient(circle at 78% 8%, rgba(74, 222, 128, 0.12), transparent 24rem),
    linear-gradient(var(--border-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
  background-size: auto, auto, 72px 72px, 72px 72px;
  mask-image: linear-gradient(to bottom, #000 0%, transparent 88%);
  opacity: 0.58;
}
</style>
