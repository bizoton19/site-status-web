<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Monitored URLs</h3>
      <div class="header-actions">
        <button
          v-if="selectedCount > 0"
          class="btn btn-secondary btn-danger-outline"
          type="button"
          :disabled="bulkDeleting"
          @click="handleBulkDelete"
        >
          {{ bulkDeleting ? 'Deleting…' : `Delete selected (${selectedCount})` }}
        </button>
        <button class="btn btn-primary" type="button" @click="openAddModal">
          Add URL
        </button>
      </div>
    </div>
    <div class="dashboard-card-body">
      <div
        v-if="actionMessage"
        class="alert mb-3"
        :class="actionSuccess ? 'alert-success' : 'alert-danger'"
        role="alert"
      >
        {{ actionMessage }}
      </div>
      <div v-if="urls.length === 0" class="empty-state">
        <h4>No URLs configured</h4>
        <p>Use Add URL to register endpoints.</p>
      </div>
      <template v-else>
        <div class="url-filters">
          <input
            v-model="filterQuery"
            type="search"
            class="form-control url-filter-search"
            placeholder="Search name or URL…"
            autocomplete="off"
            aria-label="Search name or URL"
          >
          <select
            v-model="filterCategory"
            class="form-control url-filter-select"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            <option v-for="cat in filterCategoryOptions" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <select
            v-model="filterDomain"
            class="form-control url-filter-select"
            aria-label="Filter by domain"
          >
            <option value="">All domains</option>
            <option v-for="d in filterDomainOptions" :key="d" :value="d">{{ d }}</option>
          </select>
          <button
            v-if="filtersActive"
            type="button"
            class="btn btn-secondary btn-sm"
            @click="clearFilters"
          >
            Clear
          </button>
          <span class="url-filter-count">
            {{ filteredUrls.length }} of {{ urls.length }}
          </span>
        </div>
        <div v-if="filteredUrls.length === 0" class="empty-state empty-filtered">
          <h4>No matching URLs</h4>
          <p>Try clearing search or filters.</p>
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th class="col-check">
                <input
                  type="checkbox"
                  :checked="allVisibleSelected"
                  :indeterminate="someVisibleSelected && !allVisibleSelected"
                  aria-label="Select all visible URLs"
                  @change="toggleSelectAllVisible($event.target.checked)"
                >
              </th>
              <th>Name</th>
              <th>Category</th>
              <th>Visibility</th>
              <th>URL</th>
              <th>Headers</th>
              <th style="width: 120px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="url in filteredUrls" :key="urlNameOf(url)">
              <td class="col-check">
                <input
                  type="checkbox"
                  :checked="isSelected(urlNameOf(url))"
                  :aria-label="`Select ${urlNameOf(url)}`"
                  @change="toggleSelect(urlNameOf(url), $event.target.checked)"
                >
              </td>
              <td>
                <strong>{{ urlNameOf(url) }}</strong>
              </td>
              <td>
                <span class="cat-pill">{{ displayCategory(url) }}</span>
              </td>
              <td>
                <span
                  class="vis-pill"
                  :class="(url.Visibility || url.visibility || 'private') === 'public' ? 'is-public' : 'is-private'"
                >
                  {{ url.Visibility || url.visibility || 'private' }}
                </span>
              </td>
              <td>
                <a
                  class="link-dashboard"
                  :href="url.Url || url.url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ url.Url || url.url }}
                </a>
              </td>
              <td>
                <div class="headers-cell">
                  <template v-if="domainHeadersForUrl(url).length">
                    <span
                      v-for="h in domainHeadersForUrl(url)"
                      :key="`d-${h.key}`"
                      class="header-chip is-domain"
                      :title="`From domain ${matchedDomainForUrl(url)} (read-only)`"
                    >{{ h.key }}</span>
                  </template>
                  <template v-if="urlHeaderKeys(url).length">
                    <span
                      v-for="key in urlHeaderKeys(url)"
                      :key="`u-${key}`"
                      class="header-chip is-url"
                      title="Per-URL header"
                    >{{ key }}</span>
                  </template>
                  <span
                    v-if="!domainHeadersForUrl(url).length && !urlHeaderKeys(url).length"
                    class="text-muted headers-none"
                  >—</span>
                </div>
              </td>
              <td>
                <div class="actions">
                  <button class="btn-icon" type="button" title="Edit" @click="openEditModal(url)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="btn-icon danger"
                    type="button"
                    title="Delete"
                    @click="handleDelete(urlNameOf(url))"
                  >
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </div>

  <!-- Teleport to body — Bootstrap modal + dashboard overflow froze inputs on SWA -->
  <Teleport to="body">
    <div
      v-if="modalOpen"
      class="url-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="url-modal-title"
      @keydown.escape.prevent="closeModal"
    >
      <div
        class="url-modal-backdrop"
        aria-hidden="true"
        @click="closeModal"
      />
      <div
        class="url-modal-dialog"
        :class="{ 'url-modal-dialog-wide': !isEditing && addMode === 'paste' }"
        @click.stop
        tabindex="-1"
      >
        <div class="url-modal-header">
          <h5 id="url-modal-title" class="modal-title">
            {{ isEditing ? 'Edit URL' : 'Add URL' }}
          </h5>
          <button type="button" class="btn-close" aria-label="Close" @click="closeModal" />
        </div>
        <form class="url-modal-body" @submit.prevent="handleSave">
          <div v-if="!isEditing" class="add-mode-tabs mb-3" role="tablist">
            <button
              type="button"
              role="tab"
              class="add-mode-tab"
              :class="{ active: addMode === 'manual' }"
              :aria-selected="addMode === 'manual'"
              @click="addMode = 'manual'"
            >
              Manual
            </button>
            <button
              type="button"
              role="tab"
              class="add-mode-tab"
              :class="{ active: addMode === 'paste' }"
              :aria-selected="addMode === 'paste'"
              @click="addMode = 'paste'"
            >
              Paste list
            </button>
          </div>

          <template v-if="isEditing || addMode === 'manual'">
            <div class="mb-3">
              <label class="form-label" for="url-name">Site / endpoint name</label>
              <input
                id="url-name"
                ref="nameInput"
                v-model="formData.urlName"
                type="text"
                class="form-control"
                :readonly="isEditing"
                placeholder="e.g., API Health (auto from URL if blank)"
                autocomplete="off"
                tabindex="0"
              >
            </div>
            <div class="mb-3">
              <label class="form-label" for="url-value">URL</label>
              <input
                id="url-value"
                v-model="formData.url"
                type="url"
                class="form-control"
                placeholder="https://example.com/health"
                autocomplete="off"
                tabindex="0"
              >
            </div>
          </template>

          <template v-else>
            <div class="mb-3">
              <label class="form-label" for="url-paste">URLs (one per line or CSV)</label>
              <textarea
                id="url-paste"
                ref="pasteInput"
                v-model="pasteText"
                class="form-control paste-textarea"
                rows="10"
                spellcheck="false"
                autocomplete="off"
                placeholder="name,url,category&#10;calendly,https://calendly.com/,TechSMB&#10;API Health | https://api.example.com/status&#10;https://example.com/health"
              />
              <p class="headers-hint">
                Paste a plain list or CSV. CSV columns <code>name,url,category</code> (header optional).
                Also: one HTTPS URL per line, <code>name | url</code>, or tab-separated.
                Per-row category overrides the picker below when present. Blank lines and <code>#</code> comments are ignored.
              </p>
              <p v-if="pastePreview.rows.length || pastePreview.errors.length" class="paste-preview">
                <span v-if="pastePreview.rows.length" class="paste-ok">
                  {{ pastePreview.rows.length }} ready
                </span>
                <span v-if="pastePreview.errors.length" class="paste-bad">
                  {{ pastePreview.errors.length }} invalid
                </span>
              </p>
              <ul v-if="pastePreview.errors.length" class="paste-errors">
                <li v-for="(err, i) in pastePreview.errors.slice(0, 8)" :key="i">{{ err }}</li>
              </ul>
            </div>
          </template>

          <div class="mb-3">
            <label class="form-label" for="url-category">Category</label>
            <select id="url-category" v-model="formData.category" class="form-control">
              <option v-for="opt in categoryOptions" :key="opt" :value="opt">{{ opt }}</option>
              <option value="Custom">Custom (free text)</option>
            </select>
          </div>
          <div v-if="formData.category === 'Custom'" class="mb-3">
            <label class="form-label" for="url-category-custom">Custom category</label>
            <input
              id="url-category-custom"
              v-model="formData.categoryCustom"
              type="text"
              class="form-control"
              placeholder="e.g., Billing webhook"
              maxlength="64"
              autocomplete="off"
            >
          </div>
          <div class="mb-3">
            <label class="form-label">Visibility</label>
            <div class="vis-toggle">
              <label class="vis-option">
                <input v-model="formData.visibility" type="radio" value="private">
                <span>Private</span>
                <small>Only your signed-in workspace</small>
              </label>
              <label class="vis-option">
                <input v-model="formData.visibility" type="radio" value="public">
                <span>Public</span>
                <small>Shown on the landing directory</small>
              </label>
            </div>
          </div>

          <template v-if="isEditing || addMode === 'manual'">
            <div v-if="inheritedHeaders.length" class="mb-3 inherited-headers">
              <div class="headers-label-row">
                <label class="form-label mb-0">
                  Domain headers
                  <span class="readonly-badge">read-only</span>
                </label>
                <span class="domain-match-label">{{ matchedDomain }}</span>
              </div>
              <p class="headers-hint">
                Already applied from domain settings. Edit them under Domain headers; override a key below for this URL only.
              </p>
              <div class="headers-editor inherited-editor">
                <div
                  v-for="h in inheritedHeaders"
                  :key="h.key"
                  class="header-row"
                >
                  <input
                    type="text"
                    class="form-control"
                    :value="h.key"
                    readonly
                    tabindex="-1"
                  >
                  <input
                    :type="headerValueInputType(h.key, !showHeaderValues)"
                    class="form-control"
                    :value="h.value"
                    readonly
                    tabindex="-1"
                  >
                </div>
              </div>
            </div>
            <div class="mb-3">
              <div class="headers-label-row">
                <label class="form-label mb-0">Per-URL headers (optional)</label>
                <label class="headers-show">
                  <input v-model="showHeaderValues" type="checkbox">
                  Show secrets
                </label>
              </div>
              <p class="headers-hint">
                Prefills <code>User-Agent: {{ DEFAULT_MONITOR_USER_AGENT }}</code> (WAF allowlists). Domain headers or an explicit User-Agent override it.
              </p>
              <div class="headers-editor">
                <div
                  v-for="(row, index) in formData.headers"
                  :key="index"
                  class="header-row"
                >
                  <input
                    v-model="row.key"
                    type="text"
                    class="form-control"
                    list="outpost13-header-suggestions"
                    placeholder="e.g. Authorization"
                    autocomplete="off"
                    spellcheck="false"
                  >
                  <input
                    v-model="row.value"
                    :type="headerValueInputType(row.key, !showHeaderValues)"
                    class="form-control"
                    :placeholder="suggestionForHeader(row.key)"
                    autocomplete="off"
                    spellcheck="false"
                  >
                  <button
                    type="button"
                    class="btn-icon danger"
                    title="Remove header"
                    @click="removeHeaderRow(index)"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                <div class="header-suggest-row">
                  <button
                    v-for="hint in unusedSuggestions(formData.headers)"
                    :key="hint.name"
                    type="button"
                    class="header-suggest-chip"
                    @click="addSuggestedHeader(formData.headers, hint.name)"
                  >
                    + {{ hint.name }}
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm" @click="addHeaderRow">
                    + Custom
                  </button>
                </div>
              </div>
              <datalist id="outpost13-header-suggestions">
                <option v-for="hint in SUGGESTED_HEADERS" :key="hint.name" :value="hint.name" />
              </datalist>
            </div>
          </template>

          <div
            v-if="formMessage"
            class="small"
            :style="{
              marginTop: '0.5rem',
              color: formSuccess ? 'var(--success)' : 'var(--danger)'
            }"
          >
            {{ formMessage }}
          </div>
          <div class="url-modal-footer url-modal-footer-inline">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving || saveDisabled">
              {{ saveButtonLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useApi } from '../composables/useApi'
import {
  headerValueInputType,
  hostFromUrl,
  matchDomain,
  parseHeadersJson,
  SUGGESTED_HEADERS,
  suggestionForHeader
} from '../utils/domainHeaders'
import { generateUrlName, parseUrlImport, validateUrl } from '../utils/urlValidation'
import { DEFAULT_MONITOR_USER_AGENT } from '../composables/useApi'

const emit = defineEmits(['urlUpdated'])

const CATEGORY_OPTIONS = [
  'Landing',
  'API',
  'Intake',
  'Documentation',
  'General',
  'Auth',
  'Search'
]

const { fetchUrls, fetchUrlsWithRetry, addUrl, addUrls, updateUrl, deleteUrl, deleteUrls, fetchDomainHeaders } = useApi()
const domainProfiles = ref([])

const urls = ref([])
const isEditing = ref(false)
const addMode = ref('manual')
const pasteText = ref('')
const modalOpen = ref(false)
const saving = ref(false)
const bulkDeleting = ref(false)
const formMessage = ref('')
const formSuccess = ref(false)
const actionMessage = ref('')
const actionSuccess = ref(false)
const nameInput = ref(null)
const pasteInput = ref(null)
const categoryOptions = CATEGORY_OPTIONS
const showHeaderValues = ref(true)

const filterQuery = ref('')
const filterCategory = ref('')
const filterDomain = ref('')
/** @type {import('vue').Ref<Set<string>>} */
const selectedNames = ref(new Set())

const pastePreview = computed(() => parseUrlImport(pasteText.value))

const saveDisabled = computed(() => {
  if (saving.value) return true
  if (!isEditing.value && addMode.value === 'paste') {
    return pastePreview.value.rows.length === 0
  }
  return false
})

const saveButtonLabel = computed(() => {
  if (saving.value) return 'Saving…'
  if (!isEditing.value && addMode.value === 'paste') {
    const n = pastePreview.value.rows.length
    return n > 0 ? `Save ${n} URL${n === 1 ? '' : 's'}` : 'Save'
  }
  return 'Save'
})

const emptyHeaderRow = () => ({ key: '', value: '' })

const defaultHeaderRows = () => [
  { key: 'User-Agent', value: DEFAULT_MONITOR_USER_AGENT }
]

const emptyForm = () => ({
  urlName: '',
  url: '',
  category: 'General',
  categoryCustom: '',
  visibility: 'private',
  headers: defaultHeaderRows()
})

const formData = ref(emptyForm())

function urlNameOf(url) {
  return url?.UrlName || url?.urlName || ''
}

function urlValueOf(url) {
  return url?.Url || url?.url || ''
}

function hostOf(url) {
  return hostFromUrl(urlValueOf(url)) || ''
}

const filterCategoryOptions = computed(() => {
  const fromData = urls.value.map((u) => displayCategory(u)).filter(Boolean)
  return [...new Set([...CATEGORY_OPTIONS, ...fromData])].sort((a, b) =>
    a.localeCompare(b)
  )
})

const filterDomainOptions = computed(() => {
  const hosts = urls.value.map((u) => hostOf(u)).filter(Boolean)
  return [...new Set(hosts)].sort((a, b) => a.localeCompare(b))
})

const filtersActive = computed(
  () => !!(filterQuery.value.trim() || filterCategory.value || filterDomain.value)
)

const filteredUrls = computed(() => {
  const q = filterQuery.value.trim().toLowerCase()
  const cat = filterCategory.value
  const domain = filterDomain.value.toLowerCase()

  return urls.value.filter((url) => {
    if (cat && displayCategory(url) !== cat) return false
    if (domain && hostOf(url) !== domain) return false
    if (q) {
      const name = urlNameOf(url).toLowerCase()
      const href = urlValueOf(url).toLowerCase()
      if (!name.includes(q) && !href.includes(q)) return false
    }
    return true
  })
})

const selectedCount = computed(() => selectedNames.value.size)

const allVisibleSelected = computed(() => {
  const list = filteredUrls.value
  if (list.length === 0) return false
  return list.every((u) => selectedNames.value.has(urlNameOf(u)))
})

const someVisibleSelected = computed(() =>
  filteredUrls.value.some((u) => selectedNames.value.has(urlNameOf(u)))
)

function isSelected(name) {
  return selectedNames.value.has(name)
}

function toggleSelect(name, checked) {
  if (!name) return
  const next = new Set(selectedNames.value)
  if (checked) next.add(name)
  else next.delete(name)
  selectedNames.value = next
}

function toggleSelectAllVisible(checked) {
  const next = new Set(selectedNames.value)
  for (const url of filteredUrls.value) {
    const name = urlNameOf(url)
    if (!name) continue
    if (checked) next.add(name)
    else next.delete(name)
  }
  selectedNames.value = next
}

function clearSelection() {
  selectedNames.value = new Set()
}

function clearFilters() {
  filterQuery.value = ''
  filterCategory.value = ''
  filterDomain.value = ''
}

const matchedDomain = computed(() =>
  matchDomain(
    formData.value.url,
    domainProfiles.value.map((p) => p.domain)
  )
)

const inheritedHeaders = computed(() => {
  const domain = matchedDomain.value
  if (!domain) return []
  const profile = domainProfiles.value.find((p) => p.domain === domain)
  return profile ? profile.headerList : []
})

function matchedDomainForUrl(url) {
  return matchDomain(
    url?.Url || url?.url || '',
    domainProfiles.value.map((p) => p.domain)
  )
}

function domainHeadersForUrl(url) {
  const domain = matchedDomainForUrl(url)
  if (!domain) return []
  const profile = domainProfiles.value.find((p) => p.domain === domain)
  return profile?.headerList?.length ? profile.headerList : []
}

function urlHeaderKeys(url) {
  return parseHeaders(url)
    .map((row) => String(row.key || '').trim())
    .filter(Boolean)
}

function resolveCategory(category, categoryCustom) {
  if (category === 'Custom') {
    return (categoryCustom || '').trim() || 'Custom'
  }
  return category || 'General'
}

function displayCategory(url) {
  return url.Category || url.category || 'General'
}

function splitCategory(raw) {
  const value = (raw || 'General').trim()
  if (CATEGORY_OPTIONS.includes(value)) {
    return { category: value, categoryCustom: '' }
  }
  return { category: 'Custom', categoryCustom: value }
}

function parseHeaders(url) {
  const raw = url.CustomHeadersJson || url.customHeadersJson || url.headers || url.Headers
  if (!raw) return [emptyHeaderRow()]

  let map = null
  if (typeof raw === 'string') {
    try {
      map = JSON.parse(raw)
    } catch {
      return [emptyHeaderRow()]
    }
  } else if (Array.isArray(raw)) {
    const rows = raw
      .map((row) => ({
        key: String(row?.key || row?.name || '').trim(),
        value: row?.value == null ? '' : String(row.value)
      }))
      .filter((row) => row.key)
    return rows.length ? rows : [emptyHeaderRow()]
  } else if (typeof raw === 'object') {
    map = raw
  }

  if (!map || typeof map !== 'object') return [emptyHeaderRow()]
  const rows = Object.entries(map).map(([key, value]) => ({
    key,
    value: value == null ? '' : String(value)
  }))
  return rows.length ? rows : [emptyHeaderRow()]
}

function addHeaderRow() {
  formData.value.headers.push(emptyHeaderRow())
}

function unusedSuggestions(rows) {
  const used = new Set((rows || []).map((r) => String(r.key || '').toLowerCase()).filter(Boolean))
  return SUGGESTED_HEADERS.filter((h) => !used.has(h.name.toLowerCase()))
}

function addSuggestedHeader(rows, name) {
  const empty = rows.find((r) => !String(r.key || '').trim())
  if (empty) {
    empty.key = name
    return
  }
  rows.push({ key: name, value: '' })
}

function removeHeaderRow(index) {
  formData.value.headers.splice(index, 1)
  if (formData.value.headers.length === 0) {
    formData.value.headers.push(emptyHeaderRow())
  }
}

function mergeSavedUrls(saved) {
  if (!Array.isArray(saved) || saved.length === 0) return
  const byName = new Map(urls.value.map((u) => [urlNameOf(u), u]))
  for (const entity of saved) {
    const name = urlNameOf(entity)
    if (!name) continue
    byName.set(name, entity)
  }
  urls.value = [...byName.values()]
}

function syncSelection() {
  const valid = new Set(urls.value.map((u) => urlNameOf(u)).filter(Boolean))
  selectedNames.value = new Set([...selectedNames.value].filter((n) => valid.has(n)))
}

async function loadUrls() {
  const data = await fetchUrls()
  urls.value = Array.isArray(data) ? data : []
  syncSelection()
}

/** Merge POST result immediately, then refetch with short backoff if the list is stale. */
async function reloadUrlsAfterSave(saved) {
  mergeSavedUrls(saved)
  syncSelection()
  const expectedNames = (saved || []).map((u) => urlNameOf(u)).filter(Boolean)
  const data = await fetchUrlsWithRetry({ expectedNames, attempts: 3 })
  if (Array.isArray(data) && data.length > 0) {
    const byName = new Map(data.map((u) => [urlNameOf(u), u]))
    for (const entity of saved || []) {
      const name = urlNameOf(entity)
      if (name && !byName.has(name)) byName.set(name, entity)
    }
    urls.value = [...byName.values()]
  }
  syncSelection()
}

async function loadDomainProfiles() {
  const data = await fetchDomainHeaders()
  domainProfiles.value = (Array.isArray(data) ? data : []).map((entity) => {
    const domain = entity.Domain || entity.domain || entity.RowKey || ''
    const headersJson = entity.HeadersJson || entity.headersJson || ''
    return {
      domain,
      headerList: parseHeadersJson(headersJson)
    }
  })
}

function lockBodyScroll(lock) {
  document.body.style.overflow = lock ? 'hidden' : ''
  const app = document.getElementById('app')
  if (app) {
    if (lock) app.setAttribute('inert', '')
    else app.removeAttribute('inert')
  }
}

async function openAddModal() {
  isEditing.value = false
  addMode.value = 'manual'
  pasteText.value = ''
  showHeaderValues.value = true
  formData.value = emptyForm()
  formMessage.value = ''
  modalOpen.value = true
  lockBodyScroll(true)
  await nextTick()
  nameInput.value?.focus({ preventScroll: true })
}

async function openEditModal(url) {
  const split = splitCategory(url.Category || url.category)
  isEditing.value = true
  showHeaderValues.value = false // hides Authorization / API keys only — User-Agent stays visible
  formData.value = {
    urlName: url.UrlName || url.urlName || '',
    url: url.Url || url.url || '',
    category: split.category,
    categoryCustom: split.categoryCustom,
    visibility: url.Visibility || url.visibility || 'private',
    headers: parseHeaders(url)
  }
  formMessage.value = ''
  modalOpen.value = true
  lockBodyScroll(true)
  await nextTick()
  nameInput.value?.focus({ preventScroll: true })
}

function closeModal() {
  modalOpen.value = false
  lockBodyScroll(false)
  formMessage.value = ''
}

async function handleSave() {
  const visibility = formData.value.visibility === 'public' ? 'public' : 'private'

  if (!isEditing.value && addMode.value === 'paste') {
    const { rows, errors } = pastePreview.value
    if (rows.length === 0) {
      formMessage.value = errors[0] || 'Paste at least one valid HTTPS URL'
      formSuccess.value = false
      return
    }

    const needsDefaultCategory = rows.some((row) => !String(row.category || '').trim())
    if (
      needsDefaultCategory &&
      formData.value.category === 'Custom' &&
      !formData.value.categoryCustom?.trim()
    ) {
      formMessage.value = 'Enter a custom category, or pick a preset'
      formSuccess.value = false
      return
    }

    const defaultCategory = resolveCategory(formData.value.category, formData.value.categoryCustom)

    saving.value = true
    formMessage.value = ''

    const payloads = rows.map((row) => ({
      urlName: row.urlName,
      url: row.url,
      category: String(row.category || '').trim() || defaultCategory,
      visibility,
      headers: defaultHeaderRows()
    }))

    const result = await addUrls(payloads)
    const savedCount = Array.isArray(result.saved) ? result.saved.length : 0
    if (result.success && savedCount > 0) {
      formMessage.value =
        savedCount < payloads.length
          ? `Saved ${savedCount} of ${payloads.length} URLs (${payloads.length - savedCount} skipped as invalid).`
          : `${savedCount} URL${savedCount === 1 ? '' : 's'} saved.`
      formSuccess.value = true
      actionMessage.value = formMessage.value
      actionSuccess.value = true
      await reloadUrlsAfterSave(result.saved)
      emit('urlUpdated')
      closeModal()
    } else {
      formMessage.value = result.error || 'Failed to save URLs'
      formSuccess.value = false
    }

    saving.value = false
    return
  }

  if (formData.value.category === 'Custom' && !formData.value.categoryCustom?.trim()) {
    formMessage.value = 'Enter a custom category, or pick a preset'
    formSuccess.value = false
    return
  }

  const category = resolveCategory(formData.value.category, formData.value.categoryCustom)

  const urlCheck = validateUrl(formData.value.url)
  if (!urlCheck.valid) {
    formMessage.value = urlCheck.error || 'Invalid URL'
    formSuccess.value = false
    return
  }

  const urlName = formData.value.urlName?.trim() || generateUrlName(urlCheck.url)
  if (!urlName) {
    formMessage.value = 'Please fill in name and URL'
    formSuccess.value = false
    return
  }

  saving.value = true
  formMessage.value = ''

  const payload = {
    urlName,
    url: urlCheck.url,
    category,
    visibility,
    headers: formData.value.headers
  }

  const result = isEditing.value
    ? await updateUrl(payload)
    : await addUrl(payload)

  const savedCount = Array.isArray(result.saved) ? result.saved.length : 0
  if (result.success && savedCount > 0) {
    formMessage.value = isEditing.value ? 'URL updated.' : 'URL added.'
    formSuccess.value = true
    actionMessage.value = formMessage.value
    actionSuccess.value = true
    await reloadUrlsAfterSave(result.saved)
    emit('urlUpdated')
    closeModal()
  } else {
    formMessage.value = result.error || 'An error occurred'
    formSuccess.value = false
  }

  saving.value = false
}

async function handleDelete(urlName) {
  if (!urlName) return
  if (!confirm(`Delete "${urlName}"?`)) return

  actionMessage.value = ''
  const result = await deleteUrl(urlName)
  if (result.success) {
    actionMessage.value = `"${urlName}" deleted.`
    actionSuccess.value = true
    const next = new Set(selectedNames.value)
    next.delete(urlName)
    selectedNames.value = next
    await loadUrls()
    emit('urlUpdated')
    setTimeout(() => { actionMessage.value = '' }, 5000)
  } else {
    actionMessage.value = result.error || `Failed to delete "${urlName}".`
    actionSuccess.value = false
  }
}

async function handleBulkDelete() {
  const names = [...selectedNames.value].filter(Boolean)
  if (names.length === 0) return
  if (!confirm(`Delete ${names.length} selected URL${names.length === 1 ? '' : 's'}?`)) return

  bulkDeleting.value = true
  actionMessage.value = ''
  const result = await deleteUrls(names)
  bulkDeleting.value = false

  if (result.deleted.length) {
    clearSelection()
    await loadUrls()
    emit('urlUpdated')
  }

  if (result.success) {
    actionMessage.value = `Deleted ${result.deleted.length} URL${result.deleted.length === 1 ? '' : 's'}.`
    actionSuccess.value = true
    setTimeout(() => { actionMessage.value = '' }, 5000)
  } else if (result.deleted.length) {
    actionMessage.value = `Deleted ${result.deleted.length}; ${result.failed.length} failed.`
    actionSuccess.value = false
  } else {
    actionMessage.value = result.failed[0]?.error || 'Failed to delete selected URLs'
    actionSuccess.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadUrls(), loadDomainProfiles()])
})
onUnmounted(() => lockBodyScroll(false))

defineExpose({ loadUrls, loadDomainProfiles })
</script>

<style scoped>
.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
}

.btn-danger-outline {
  border-color: var(--danger, #ef4444);
  color: var(--danger, #ef4444);
}

.btn-danger-outline:hover:not(:disabled) {
  background: color-mix(in srgb, var(--danger, #ef4444) 12%, transparent);
}

.url-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.85rem;
}

.url-filter-search {
  flex: 1 1 12rem;
  min-width: 10rem;
}

.url-filter-select {
  flex: 0 1 10rem;
  min-width: 8rem;
}

.url-filter-count {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  margin-left: auto;
}

.col-check {
  width: 2.25rem;
  text-align: center;
  vertical-align: middle;
}

.col-check input {
  cursor: pointer;
}

.empty-filtered {
  padding: 1.25rem 0;
}

.cat-pill,
.vis-pill {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.45rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  white-space: nowrap;
}

.vis-pill.is-public {
  border-color: var(--color-success, #22c55e);
  color: var(--color-success, #22c55e);
}

.vis-pill.is-private {
  color: var(--text-muted);
}

.vis-toggle {
  display: grid;
  gap: 0.5rem;
}

.vis-option {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 0.55rem;
  row-gap: 0.1rem;
  align-items: start;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: var(--bg-surface);
}

.vis-option input {
  grid-row: 1 / span 2;
  margin-top: 0.2rem;
}

.vis-option span {
  font-weight: 600;
  font-size: 0.875rem;
}

.vis-option small {
  grid-column: 2;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.headers-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.headers-show {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  cursor: pointer;
  margin: 0;
}

.headers-hint {
  margin: 0 0 0.55rem;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.headers-editor {
  display: grid;
  gap: 0.45rem;
}

.header-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.4rem;
  align-items: center;
}

.header-suggest-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.header-suggest-chip {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.3rem 0.5rem;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.header-suggest-chip:hover {
  border-color: var(--text-accent);
  color: var(--text-main);
}

.headers-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
  max-width: 16rem;
}

.header-chip {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  white-space: nowrap;
}

.header-chip.is-domain {
  border-style: dashed;
  color: var(--text-muted);
}

.header-chip.is-url {
  border-color: var(--text-accent, #888);
  color: var(--text-main);
}

.headers-none {
  font-size: 0.8rem;
}

.readonly-badge {
  margin-left: 0.4rem;
  font-family: var(--font-mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.12rem 0.35rem;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  vertical-align: middle;
}

.domain-match-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.inherited-editor .form-control {
  opacity: 0.85;
  cursor: default;
  background: var(--bg-surface, #0f0f0f);
}

.add-mode-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  padding: 0.25rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-surface, #0f0f0f);
}

.add-mode-tab {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.55rem 0.65rem;
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
}

.add-mode-tab.active {
  background: var(--bg-panel, #1a1a1a);
  color: var(--text-main);
  border: 1px solid var(--border-color);
}

.paste-textarea {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.45;
  min-height: 12rem;
  resize: vertical;
}

.paste-preview {
  display: flex;
  gap: 0.75rem;
  margin: 0.35rem 0 0;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.paste-ok {
  color: var(--color-success, #22c55e);
}

.paste-bad {
  color: var(--danger, #ef4444);
}

.paste-errors {
  margin: 0.4rem 0 0;
  padding-left: 1.1rem;
  color: var(--danger, #ef4444);
  font-size: 0.75rem;
}
</style>

<!-- Unscoped: Teleport-to-body must not depend on data-v-* for stacking / clicks -->
<style>
.url-modal-root {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  isolation: isolate;
}

.url-modal-backdrop {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.55);
  cursor: pointer;
  z-index: 0;
}

.url-modal-dialog {
  position: relative;
  z-index: 1;
  width: min(560px, 100%);
  max-height: min(90vh, 780px);
  overflow: auto;
  background: var(--bg-panel, #141414);
  border: 1px solid var(--border-color, #333);
  border-radius: var(--radius-md, 8px);
  color: var(--text-main, #f5f5f5);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
}

.url-modal-dialog-wide {
  width: min(680px, 100%);
}

.url-modal-dialog input,
.url-modal-dialog select,
.url-modal-dialog button,
.url-modal-dialog textarea,
.url-modal-dialog label {
  pointer-events: auto;
  position: relative;
  z-index: 2;
}

.url-modal-header,
.url-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.15rem;
  border-bottom: 1px solid var(--border-color, #333);
}

.url-modal-footer,
.url-modal-footer-inline {
  border-bottom: 0;
  border-top: 1px solid var(--border-color, #333);
  justify-content: flex-end;
}

.url-modal-body {
  padding: 1.15rem;
  margin: 0;
}

.url-modal-footer-inline {
  margin: 1rem -1.15rem -1.15rem;
  padding: 0.85rem 1.15rem;
}
</style>
