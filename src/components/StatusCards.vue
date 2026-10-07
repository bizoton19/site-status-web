<template>
  <div class="status-grid">
    <div
      v-for="item in items"
      :key="item.key"
      class="status-item"
      :class="[ok(item) ? 'online' : 'offline', { clickable: clickable(item) }]"
      :role="clickable(item) ? 'button' : undefined"
      :tabindex="clickable(item) ? 0 : undefined"
      :title="clickable(item) ? 'View request / response details' : undefined"
      @click="onClick(item)"
      @keydown.enter.prevent="onClick(item)"
      @keydown.space.prevent="onClick(item)"
    >
      <div class="status-item-header">
        <span class="status-item-name">{{ item.urlName || item.url }}</span>
        <span v-if="ok(item)" class="status-icon-ok" title="Up" aria-label="Up">
          <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
        </span>
        <span v-else class="status-badge offline">{{ statusLabel(item) }}</span>
      </div>
      <div class="status-item-group">{{ groupLabel(item) }}</div>
      <div class="status-item-url">
        <a
          class="link-dashboard"
          :href="hrefForUrl(item.url)"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >{{ item.url }}</a>
      </div>
      <div class="status-item-footer">
        <span>{{ formatChecked(item.date) }}</span>
        <span v-if="ok(item)" class="status-item-detail ok">
          {{ item.durationMs > 0 ? formatDuration(item.durationMs) : 'Normal' }}
        </span>
        <span v-else class="status-item-detail err">{{ formatErrorDescription(item.description) }}</span>
      </div>
      <div v-if="$slots['item-actions']" class="status-item-actions" @click.stop>
        <slot name="item-actions" :item="item" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { isSuccessStatus } from '../utils/probeStatus.js'
import {
  formatChecked,
  formatDuration,
  formatErrorDescription,
  groupLabel,
  hrefForUrl,
  statusLabel,
} from '../utils/statusView.js'

const props = defineProps({
  items: { type: Array, required: true },
  isItemClickable: { type: Function, default: null },
})
const emit = defineEmits(['select'])

const ok = (item) => isSuccessStatus(item)
const clickable = (item) => !!props.isItemClickable?.(item)

function onClick(item) {
  if (clickable(item)) emit('select', item)
}
</script>

<style scoped>
.status-icon-ok {
  color: var(--success);
  font-size: 1.35rem;
  line-height: 1;
  display: flex;
  align-items: center;
}

.status-item-group {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: -0.25rem 0 0.4rem;
}

.status-item-url .link-dashboard {
  word-break: break-all;
}

.status-item-footer {
  gap: 0.75rem;
}

.status-item-detail.err {
  text-align: right;
}

.status-item-actions {
  margin-top: 0.5rem;
}

.status-item.clickable {
  cursor: pointer;
}

.status-item.clickable:hover {
  outline: 1px solid color-mix(in srgb, var(--danger, #ef4444) 45%, transparent);
}

.status-item:focus-visible {
  outline: 2px solid var(--text-accent);
  outline-offset: 2px;
}
</style>
