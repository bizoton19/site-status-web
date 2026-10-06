<template>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <div class="site-footer-logo" aria-hidden="true">
        <Outpost13LogoMark :size="84" :show-wordmark="true" />
      </div>
      <p class="site-footer-copy">
        © {{ year }} Outpost13. All rights reserved.
      </p>
    </div>
  </footer>
</template>

<script setup>
import Outpost13LogoMark from './Outpost13LogoMark.vue'

const year = new Date().getFullYear()
</script>

<style scoped>
.site-footer {
  max-width: 1180px;
  margin: 3.5rem auto 0;
  padding: 2rem 0 0.5rem;
  border-top: 1px solid var(--border-color);
}

.site-footer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  text-align: center;
}

.site-footer-logo {
  display: flex;
  justify-content: center;
}

.site-footer-logo :deep(.logo-mark) {
  filter:
    drop-shadow(0 0 4px rgba(94, 234, 212, 0.28))
    drop-shadow(0 0 10px rgba(212, 175, 55, 0.22));
}

.site-footer-copy {
  margin: 0;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
}
</style>
