<template>
  <div class="status-board" :data-view="view">
    <div v-if="showToolbar" class="sb-toolbar">
      <StatusFilterBar
        class="sb-filters"
        :id-prefix="idPrefix"
        :show-search="showSearch"
        :search="search"
        :search-placeholder="searchPlaceholder"
        :search-button="!clientSearch"
        :group="group"
        :group-options="groupChoices"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        :sort-options="sortOptions"
        @update:search="search = $event"
        @update:group="group = $event"
        @update:sort-key="setSort($event, defaultSortDir($event))"
        @update:sort-dir="sortDir = $event"
        @submit-search="emit('search-submit')"
      />
    </div>

    <div v-if="showToolbar" class="sb-subbar">
      <p class="sb-meta" aria-live="polite">
        Showing {{ visibleItems.length }} of {{ items.length }}
        <template v-if="group"> · group “{{ group }}”</template>
        <template v-if="clientSearch && searchTrim"> · search</template>
        <template v-if="view === 'board'"> · board by {{ boardBy }}</template>
      </p>
      <div v-if="!lockedView" class="sb-views">
        <ViewToggle v-model="view" :options="VIEW_OPTIONS" label="Status view" />
        <ViewToggle
          v-if="view === 'board'"
          v-model="boardBy"
          :options="BOARD_BY_OPTIONS"
          label="Board columns"
          class="sb-board-by"
        />
      </div>
    </div>

    <p v-if="loading" class="sb-empty">{{ loadingMessage }}</p>
    <div v-else-if="visibleItems.length === 0" class="sb-empty">
      <slot name="empty">{{ emptyMessage }}</slot>
    </div>

    <template v-else>
      <StatusTable
        v-if="view === 'table'"
        :items="visibleItems"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        :show-domain="showDomain"
        :show-response="showResponse"
        :is-item-clickable="isItemClickable"
        @sort="onHeaderSort"
        @select="emit('select', $event)"
      >
        <template v-if="$slots['item-actions']" #item-actions="slotProps">
          <slot name="item-actions" v-bind="slotProps" />
        </template>
      </StatusTable>

      <StatusCards
        v-else-if="view === 'cards'"
        :items="visibleItems"
        :is-item-clickable="isItemClickable"
        @select="emit('select', $event)"
      >
        <template v-if="$slots['item-actions']" #item-actions="slotProps">
          <slot name="item-actions" v-bind="slotProps" />
        </template>
      </StatusCards>

      <StatusKanban
        v-else
        :items="visibleItems"
        :board-by="boardBy"
        :is-item-clickable="isItemClickable"
        @select="emit('select', $event)"
      >
        <template v-if="$slots['item-actions']" #item-actions="slotProps">
          <slot name="item-actions" v-bind="slotProps" />
        </template>
      </StatusKanban>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import StatusFilterBar from './StatusFilterBar.vue'
import StatusTable from './StatusTable.vue'
import StatusCards from './StatusCards.vue'
import StatusKanban from './StatusKanban.vue'
import ViewToggle from './ViewToggle.vue'
import {
  SORT_OPTIONS,
  compareItems,
  defaultSortDir,
  distinctGroups,
  groupLabel,
  hasResponseTimes,
  isNarrowViewport,
  loadViewPrefs,
  sameGroup,
  saveViewPrefs,
} from '../utils/statusView.js'

/**
 * Shared status display for the public directory and the signed-in app:
 * group filter + sort + search, and Table / Cards / Board views.
 * Data fetching stays in the page; pass normalized items in.
 */
const props = defineProps({
  items: { type: Array, default: () => [] },
  /** localStorage key for { view, boardBy }; null = don't persist. */
  storageKey: { type: String, default: null },
  /** View used on desktop (> 992px) when nothing is saved. Narrow screens default to cards. */
  defaultDesktopView: { type: String, default: 'table' },
  /** Force one view and hide the switcher (previews). */
  lockedView: { type: String, default: null },
  defaultSortKey: { type: String, default: 'status' },
  showToolbar: { type: Boolean, default: true },
  showSearch: { type: Boolean, default: true },
  /** false = search is server-side (parent listens to search-submit). */
  clientSearch: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: 'Search name, URL, or error…' },
  /** Override group choices (e.g. groups seen across server pages). Defaults to groups in items. */
  groupOptions: { type: Array, default: null },
  /** Show a Domain column in the table. */
  showDomain: { type: Boolean, default: false },
  limit: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  loadingMessage: { type: String, default: 'Loading endpoints…' },
  emptyMessage: { type: String, default: 'No endpoints match.' },
  /** Items for which a "Details" action is offered (emits select). */
  isItemClickable: { type: Function, default: null },
  idPrefix: { type: String, default: 'status' },
})

const emit = defineEmits(['select', 'search-submit'])
const group = defineModel('group', { type: String, default: '' })
const search = defineModel('search', { type: String, default: '' })

const VIEW_OPTIONS = [
  { value: 'table', label: 'Table', icon: 'bi-table' },
  { value: 'cards', label: 'Cards', icon: 'bi-grid-3x2-gap' },
  { value: 'board', label: 'Board', icon: 'bi-kanban' },
]
const BOARD_BY_OPTIONS = [
  { value: 'group', label: 'By group', icon: 'bi-collection' },
  { value: 'status', label: 'By status', icon: 'bi-activity' },
]

const saved = loadViewPrefs(props.storageKey)
const view = ref(props.lockedView || saved.view || (isNarrowViewport() ? 'cards' : props.defaultDesktopView))
const boardBy = ref(saved.boardBy || 'group')
const sortKey = ref(props.defaultSortKey)
const sortDir = ref(defaultSortDir(props.defaultSortKey))

watch(view, (v) => {
  if (!props.lockedView) saveViewPrefs(props.storageKey, { view: v })
})
watch(boardBy, (v) => saveViewPrefs(props.storageKey, { boardBy: v }))

const showResponse = computed(() => hasResponseTimes(props.items))
const sortOptions = computed(() =>
  SORT_OPTIONS.filter((o) => o.key !== 'response' || showResponse.value)
)

const groupChoices = computed(() => {
  const list = props.groupOptions ? [...props.groupOptions] : distinctGroups(props.items)
  if (group.value && !list.some((g) => sameGroup(g, group.value))) list.push(group.value)
  return list
})

const searchTrim = computed(() => search.value.trim().toLowerCase())

const filteredItems = computed(() => {
  let list = props.items
  if (group.value) list = list.filter((i) => sameGroup(groupLabel(i), group.value))
  if (props.clientSearch && searchTrim.value) {
    const q = searchTrim.value
    list = list.filter((i) =>
      [i.urlName, i.url, i.description, i.group, i.domain]
        .some((v) => String(v ?? '').toLowerCase().includes(q))
    )
  }
  return list
})

const visibleItems = computed(() => {
  const sorted = [...filteredItems.value].sort(compareItems(sortKey.value, sortDir.value))
  return props.limit > 0 ? sorted.slice(0, props.limit) : sorted
})

function setSort(key, dir) {
  sortKey.value = key
  sortDir.value = dir
}

function onHeaderSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else setSort(key, defaultSortDir(key))
}
</script>

<style scoped>
.status-board {
  min-width: 0;
}

.sb-toolbar {
  margin-bottom: 0.75rem;
}

.sb-subbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem 1rem;
  margin-bottom: 0.85rem;
}

.sb-views {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-left: auto;
}

.sb-meta {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.03em;
  color: var(--text-muted);
}

.sb-empty {
  color: var(--text-muted);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  margin: 0;
  text-align: center;
}

@media (max-width: 640px) {
  .sb-views {
    order: -1;
    width: 100%;
    margin-left: 0;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
