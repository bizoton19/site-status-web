<template>
  <div class="kanban" role="list" :aria-label="`Board by ${boardBy}`">
    <section
      v-for="col in columns"
      :key="col.key"
      class="kanban-col"
      :class="col.accent ? `accent-${col.accent}` : ''"
      role="listitem"
      :aria-label="`${col.title}: ${col.items.length}`"
    >
      <header class="kanban-col-header">
        <h4 class="kanban-col-title">{{ col.title }}</h4>
        <span class="kanban-col-count">{{ col.items.length }}</span>
        <span v-if="boardBy === 'group'" class="kanban-col-meta">
          {{ col.up }} up · {{ col.items.length - col.up }} need attention
        </span>
      </header>
      <ul class="kanban-col-body">
        <li v-if="col.items.length === 0" class="kanban-empty">Nothing here</li>
        <li v-for="item in col.items" :key="item.key" class="kanban-card" :class="`is-${statusBucket(item)}`">
          <div class="kanban-card-top">
            <span class="kanban-card-name">{{ item.urlName || item.url }}</span>
            <StatusPill :item="item" />
          </div>
          <a
            class="kanban-card-url"
            :href="hrefForUrl(item.url)"
            target="_blank"
            rel="noopener noreferrer"
          >{{ item.url }}</a>
          <div class="kanban-card-meta">
            <span v-if="boardBy === 'status'" class="kanban-card-group">{{ groupLabel(item) }}</span>
            <span>{{ formatChecked(item.date) }}</span>
            <span v-if="item.durationMs > 0">{{ formatDuration(item.durationMs) }}</span>
          </div>
          <div
            v-if="(isItemClickable && isItemClickable(item)) || $slots['item-actions']"
            class="kanban-card-actions"
          >
            <button
              v-if="isItemClickable && isItemClickable(item)"
              type="button"
              class="kanban-details"
              @click="emit('select', item)"
            >
              Details
            </button>
            <slot name="item-actions" :item="item" />
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatusPill from './StatusPill.vue'
import {
  STATUS_COLUMNS,
  distinctGroups,
  formatChecked,
  formatDuration,
  groupLabel,
  hrefForUrl,
  statusBucket,
} from '../utils/statusView.js'

/** Read-only kanban: columns by group (default) or by status. No drag and drop. */
const props = defineProps({
  /** Already filtered + sorted; order is preserved within each column. */
  items: { type: Array, required: true },
  boardBy: { type: String, default: 'group' },
  isItemClickable: { type: Function, default: null },
})
const emit = defineEmits(['select'])

const columns = computed(() => {
  if (props.boardBy === 'status') {
    return STATUS_COLUMNS.map((c) => {
      const items = props.items.filter((i) => statusBucket(i) === c.key)
      return { key: c.key, title: c.label, accent: c.key, items, up: 0 }
    })
  }
  return distinctGroups(props.items).map((name) => {
    const items = props.items.filter((i) => groupLabel(i) === name)
    return {
      key: `g-${name}`,
      title: name,
      accent: null,
      items,
      up: items.filter((i) => statusBucket(i) === 'up').length,
    }
  })
})
</script>

<style scoped>
.kanban {
  display: flex;
  gap: 0.85rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}

.kanban-col {
  flex: 0 0 290px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-top: 3px solid var(--border-active);
  border-radius: var(--radius-md);
  scroll-snap-align: start;
}

.kanban-col.accent-up { border-top-color: var(--color-success); }
.kanban-col.accent-down,
.kanban-col.accent-blocked { border-top-color: var(--color-danger); }
.kanban-col.accent-degraded { border-top-color: #f59e0b; }
.kanban-col.accent-unknown { border-top-color: var(--text-muted); }

.kanban-col-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.5rem;
  padding: 0.7rem 0.85rem;
  border-bottom: 1px solid var(--border-color);
}

.kanban-col-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-main);
  overflow-wrap: anywhere;
}

.kanban-col-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 0.4rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
}

.kanban-col-meta {
  flex-basis: 100%;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
}

.kanban-col-body {
  list-style: none;
  margin: 0;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.kanban-empty {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  padding: 1rem 0.5rem;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
}

.kanban-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--border-active);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.7rem;
  min-width: 0;
}

.kanban-card.is-up { border-left-color: var(--color-success); }
.kanban-card.is-down,
.kanban-card.is-blocked { border-left-color: var(--color-danger); }
.kanban-card.is-degraded { border-left-color: #f59e0b; }

.kanban-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}

.kanban-card-name {
  font-weight: 700;
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}

.kanban-card-url {
  display: block;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  word-break: break-all;
  margin-bottom: 0.35rem;
  text-decoration: none;
}

.kanban-card-url:hover {
  color: var(--text-accent);
  text-decoration: underline;
}

.kanban-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.65rem;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
}

.kanban-card-group {
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.kanban-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.45rem;
}

.kanban-details {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-accent);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-decoration: underline;
  text-underline-offset: 0.15em;
  cursor: pointer;
}

.kanban-details:focus-visible,
.kanban-card-url:focus-visible {
  outline: 2px solid var(--text-accent);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .kanban-col {
    flex-basis: 82%;
  }
}
</style>
