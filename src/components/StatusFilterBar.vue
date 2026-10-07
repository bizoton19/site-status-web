<template>
  <div class="status-filter-bar">
    <div v-if="showSearch" class="sfb-search">
      <label class="visually-hidden" :for="`${idPrefix}-search`">{{ searchLabel }}</label>
      <span class="sfb-search-icon" aria-hidden="true"><i class="bi bi-search"></i></span>
      <input
        :id="`${idPrefix}-search`"
        :value="search"
        type="search"
        class="form-control sfb-search-input"
        :placeholder="searchPlaceholder"
        autocomplete="off"
        spellcheck="false"
        @input="emit('update:search', $event.target.value)"
        @keyup.enter="emit('submit-search')"
      >
      <button
        v-if="searchButton"
        type="button"
        class="btn btn-secondary sfb-search-btn"
        @click="emit('submit-search')"
      >
        Search
      </button>
    </div>

    <div class="sfb-field">
      <label class="sfb-label" :for="`${idPrefix}-group`">Group</label>
      <select
        :id="`${idPrefix}-group`"
        class="form-select sfb-select"
        :value="group"
        @change="emit('update:group', $event.target.value)"
      >
        <option value="">All groups</option>
        <option v-for="name in groupOptions" :key="name" :value="name">{{ name }}</option>
      </select>
    </div>

    <div class="sfb-field">
      <label class="sfb-label" :for="`${idPrefix}-sort`">Sort</label>
      <div class="sfb-sort">
        <select
          :id="`${idPrefix}-sort`"
          class="form-select sfb-select"
          :value="sortKey"
          @change="emit('update:sortKey', $event.target.value)"
        >
          <option v-for="opt in sortOptions" :key="opt.key" :value="opt.key">{{ opt.label }}</option>
        </select>
        <button
          type="button"
          class="btn btn-secondary sfb-dir"
          :aria-label="sortDir === 'asc' ? 'Sort ascending (click for descending)' : 'Sort descending (click for ascending)'"
          :title="sortDir === 'asc' ? 'Ascending' : 'Descending'"
          @click="emit('update:sortDir', sortDir === 'asc' ? 'desc' : 'asc')"
        >
          <i :class="['bi', sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down']" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Search + group filter + sort, shared by every status view. */
defineProps({
  idPrefix: { type: String, default: 'status' },
  showSearch: { type: Boolean, default: true },
  search: { type: String, default: '' },
  searchLabel: { type: String, default: 'Search endpoints' },
  searchPlaceholder: { type: String, default: 'Search name or URL…' },
  /** Show an explicit Search button (server-side search on the public page). */
  searchButton: { type: Boolean, default: false },
  group: { type: String, default: '' },
  groupOptions: { type: Array, default: () => [] },
  sortKey: { type: String, default: 'status' },
  sortDir: { type: String, default: 'asc' },
  sortOptions: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:search', 'update:group', 'update:sortKey', 'update:sortDir', 'submit-search'])
</script>

<style scoped>
.status-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.6rem;
  min-width: 0;
}

.sfb-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex: 1 1 240px;
  min-width: 0;
}

.sfb-search-icon {
  position: absolute;
  left: 0.65rem;
  color: var(--text-muted);
  pointer-events: none;
  font-size: 0.9rem;
}

.sfb-search-input {
  padding-left: 2.1rem;
  min-width: 0;
}

.sfb-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.sfb-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.sfb-select {
  min-width: 140px;
  font-size: 0.85rem;
}

.sfb-sort {
  display: flex;
  gap: 0.35rem;
}

.sfb-dir {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.6rem;
}

.sfb-search-btn {
  flex-shrink: 0;
}

.status-filter-bar :is(input, select, button):focus-visible {
  outline: 2px solid var(--text-accent);
  outline-offset: 1px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .sfb-search {
    flex-basis: 100%;
  }

  .sfb-field {
    flex: 1 1 calc(50% - 0.6rem);
  }

  .sfb-select {
    min-width: 0;
    width: 100%;
  }

  .sfb-sort .sfb-select {
    flex: 1 1 auto;
  }
}
</style>
