<template>
  <div class="status-table-wrap">
    <table class="status-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            :aria-sort="col.sortable ? ariaSort(col.key) : undefined"
          >
            <button
              v-if="col.sortable"
              type="button"
              class="th-sort"
              :class="{ active: sortKey === col.key }"
              @click="emit('sort', col.key)"
            >
              {{ col.label }}
              <i :class="['bi', sortIcon(col.key)]" aria-hidden="true"></i>
            </button>
            <template v-else>{{ col.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.key" :class="`row-${statusBucket(item)}`">
          <td class="col-endpoint">
            <span v-if="item.urlName && item.urlName !== item.url" class="st-name">{{ item.urlName }}</span>
            <a
              class="st-url"
              :href="hrefForUrl(item.url)"
              target="_blank"
              rel="noopener noreferrer"
            >{{ item.url }}</a>
          </td>
          <td v-if="showDomain">{{ item.domain || '—' }}</td>
          <td><span class="st-group">{{ groupLabel(item) }}</span></td>
          <td>
            <div class="st-status">
              <StatusPill :item="item" />
              <button
                v-if="isItemClickable && isItemClickable(item)"
                type="button"
                class="st-details"
                @click="emit('select', item)"
              >
                Details
              </button>
              <slot name="item-actions" :item="item" />
            </div>
          </td>
          <td v-if="showResponse" class="st-num">{{ formatDuration(item.durationMs) }}</td>
          <td class="st-checked">{{ formatChecked(item.date) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatusPill from './StatusPill.vue'
import {
  formatChecked,
  formatDuration,
  groupLabel,
  hrefForUrl,
  statusBucket,
} from '../utils/statusView.js'

const props = defineProps({
  items: { type: Array, required: true },
  sortKey: { type: String, default: 'status' },
  sortDir: { type: String, default: 'asc' },
  showDomain: { type: Boolean, default: false },
  showResponse: { type: Boolean, default: false },
  isItemClickable: { type: Function, default: null },
})
const emit = defineEmits(['sort', 'select'])

const columns = computed(() => [
  { key: 'name', label: 'Endpoint', sortable: true },
  ...(props.showDomain ? [{ key: 'domain', label: 'Domain', sortable: false }] : []),
  { key: 'group', label: 'Group', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  ...(props.showResponse ? [{ key: 'response', label: 'Response', sortable: true }] : []),
  { key: 'checked', label: 'Last checked', sortable: true },
])

function ariaSort(key) {
  if (props.sortKey !== key) return 'none'
  return props.sortDir === 'desc' ? 'descending' : 'ascending'
}

function sortIcon(key) {
  if (props.sortKey !== key) return 'bi-chevron-expand'
  return props.sortDir === 'desc' ? 'bi-caret-down-fill' : 'bi-caret-up-fill'
}
</script>

<style scoped>
.status-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-panel);
}

.status-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

.status-table th,
.status-table td {
  padding: 0.7rem 0.9rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  vertical-align: top;
}

.status-table th {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  white-space: nowrap;
  background: var(--bg-surface);
}

.status-table tbody tr:last-child td {
  border-bottom: 0;
}

.status-table tbody tr:hover {
  background: var(--bg-surface-hover);
}

.status-table tbody tr.row-down td:first-child,
.status-table tbody tr.row-blocked td:first-child {
  box-shadow: inset 3px 0 0 var(--color-danger);
}

.status-table tbody tr.row-up td:first-child {
  box-shadow: inset 3px 0 0 var(--color-success);
}

.th-sort {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}

.th-sort:hover,
.th-sort.active {
  color: var(--text-main);
}

.th-sort.active i {
  color: var(--text-accent);
}

.th-sort i {
  font-size: 0.7rem;
  opacity: 0.8;
}

.th-sort:focus-visible,
.st-details:focus-visible,
.st-url:focus-visible {
  outline: 2px solid var(--text-accent);
  outline-offset: 2px;
}

.col-endpoint {
  max-width: 420px;
}

.st-name {
  display: block;
  font-weight: 700;
  font-size: 0.88rem;
  margin-bottom: 0.15rem;
}

.st-url {
  display: block;
  color: var(--text-main);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  word-break: break-all;
}

.st-name + .st-url {
  color: var(--text-muted);
}

.st-group {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.st-status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.st-details {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-accent);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-decoration: underline;
  text-underline-offset: 0.15em;
  cursor: pointer;
}

.st-num,
.st-checked {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
