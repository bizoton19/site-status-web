<template>
  <span class="status-pill" :class="`is-${bucket}`">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { statusBucket, statusLabel } from '../utils/statusView.js'

const props = defineProps({ item: { type: Object, required: true } })
const bucket = computed(() => statusBucket(props.item))
const label = computed(() => statusLabel(props.item))
</script>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  white-space: nowrap;
}

.status-pill.is-up {
  color: var(--color-success);
  border-color: rgba(74, 222, 128, 0.45);
}

.status-pill.is-down,
.status-pill.is-blocked {
  color: var(--color-danger);
  border-color: rgba(239, 68, 68, 0.45);
}

.status-pill.is-degraded {
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.45);
}

.status-pill.is-unknown {
  color: var(--text-muted);
}
</style>
