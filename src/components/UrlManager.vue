<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Monitored URLs</h3>
      <button class="btn btn-primary" type="button" @click="openAddModal">
        Add URL
      </button>
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
      <div class="url-toolbar">
        <label class="form-label" for="url-group-filter">Group</label>
        <select
          id="url-group-filter"
          v-model="groupFilter"
          class="form-control"
          aria-label="Filter by group"
        >
          <option value="">All groups</option>
          <option v-for="name in knownGroups" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>
      <p v-if="filteredUrls.length === 0" class="empty-state compact">
        No URLs in this group.
      </p>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Group</th>
            <th>Visibility</th>
            <th>URL</th>
            <th style="width: 120px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="url in filteredUrls" :key="url.UrlName || url.urlName">
            <td>
              <strong>{{ url.UrlName || url.urlName }}</strong>
            </td>
            <td>
              <span class="group-pill">{{ displayGroup(url) || '—' }}</span>
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
              <div class="actions">
                <button class="btn-icon" type="button" title="Edit" @click="openEditModal(url)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  class="btn-icon danger"
                  type="button"
                  title="Delete"
                  @click="handleDelete(url.UrlName || url.urlName)"
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
      <div class="url-modal-dialog" @click.stop tabindex="-1">
        <div class="url-modal-header">
          <h5 id="url-modal-title" class="modal-title">
            {{ isEditing ? 'Edit URL' : 'Add URL' }}
          </h5>
          <button type="button" class="btn-close" aria-label="Close" @click="closeModal" />
        </div>
        <form class="url-modal-body" @submit.prevent="handleSave">
          <div class="mb-3">
            <label class="form-label" for="url-name">Site / endpoint name</label>
            <input
              id="url-name"
              ref="nameInput"
              v-model="formData.urlName"
              type="text"
              class="form-control"
              :readonly="isEditing"
              placeholder="e.g., API Health"
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
          <div class="mb-3">
            <label class="form-label" for="url-group">Group</label>
            <input
              id="url-group"
              v-model="formData.group"
              type="text"
              class="form-control"
              list="url-group-options"
              placeholder="bilomax-api"
              maxlength="64"
              required
              autocomplete="off"
            >
            <p class="headers-hint">
              Required. This label groups URLs when you view them. Example: bilomax-api.
            </p>
            <datalist id="url-group-options">
              <option v-for="name in knownGroups" :key="name" :value="name" />
            </datalist>
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
          <div v-if="inheritedHeaders.length" class="mb-3 inherited-headers">
            <label class="form-label">From domain ({{ matchedDomain }}) — optional defaults</label>
            <p class="headers-hint">
              Inherited if you set domain headers. Override any key below on this URL only.
            </p>
            <ul class="inherited-list">
              <li v-for="h in inheritedHeaders" :key="h.key">
                <code>{{ h.key }}</code>
                <span>{{ showHeaderValues ? h.value : '••••••••' }}</span>
              </li>
            </ul>
          </div>
          <div class="mb-3">
            <div class="headers-label-row">
              <label class="form-label mb-0">Per-URL headers (optional)</label>
              <label class="headers-show">
                <input v-model="showHeaderValues" type="checkbox">
                Show values
              </label>
            </div>
            <p class="headers-hint">
              Optional. Only for this endpoint (e.g. API key). Leave blank to use domain defaults or the Watchtower User-Agent.
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
                  list="watchtower-header-suggestions"
                  placeholder="e.g. Authorization"
                  autocomplete="off"
                  spellcheck="false"
                >
                <input
                  v-model="row.value"
                  :type="showHeaderValues ? 'text' : 'password'"
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
            <datalist id="watchtower-header-suggestions">
              <option v-for="hint in SUGGESTED_HEADERS" :key="hint.name" :value="hint.name" />
            </datalist>
          </div>
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
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save' }}
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
import { matchDomain, parseHeadersJson, SUGGESTED_HEADERS, suggestionForHeader } from '../utils/domainHeaders'
import { readGroup } from '../utils/urlValidation.js'

const emit = defineEmits(['urlUpdated'])

const { fetchUrls, addUrl, updateUrl, deleteUrl, fetchDomainHeaders } = useApi()
const domainProfiles = ref([])

const urls = ref([])
const isEditing = ref(false)
const modalOpen = ref(false)
const saving = ref(false)
const formMessage = ref('')
const formSuccess = ref(false)
const actionMessage = ref('')
const actionSuccess = ref(false)
const nameInput = ref(null)
const showHeaderValues = ref(true)
const groupFilter = ref('')

const emptyHeaderRow = () => ({ key: '', value: '' })

const emptyForm = () => ({
  urlName: '',
  url: '',
  group: '',
  visibility: 'private',
  headers: [emptyHeaderRow()]
})

const formData = ref(emptyForm())

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

function displayGroup(url) {
  return readGroup(url)
}

const knownGroups = computed(() => {
  const names = new Set()
  for (const url of urls.value) {
    const group = displayGroup(url)
    if (group) names.add(group)
  }
  return [...names].sort((a, b) => a.localeCompare(b))
})

const filteredUrls = computed(() => {
  const selected = groupFilter.value
  if (!selected) return urls.value
  return urls.value.filter((url) => displayGroup(url) === selected)
})

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

async function loadUrls() {
  const data = await fetchUrls()
  urls.value = Array.isArray(data) ? data : []
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
  showHeaderValues.value = true
  formData.value = emptyForm()
  formMessage.value = ''
  modalOpen.value = true
  lockBodyScroll(true)
  await nextTick()
  nameInput.value?.focus({ preventScroll: true })
}

async function openEditModal(url) {
  isEditing.value = true
  showHeaderValues.value = false
  formData.value = {
    urlName: url.UrlName || url.urlName || '',
    url: url.Url || url.url || '',
    group: displayGroup(url),
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
  if (!formData.value.urlName?.trim() || !formData.value.url?.trim()) {
    formMessage.value = 'Please fill in name and URL'
    formSuccess.value = false
    return
  }

  const group = formData.value.group?.trim() || ''
  if (!group) {
    formMessage.value = 'Enter a group. It groups URLs when you view them.'
    formSuccess.value = false
    return
  }

  saving.value = true
  formMessage.value = ''

  const payload = {
    urlName: formData.value.urlName.trim(),
    url: formData.value.url.trim(),
    group,
    visibility: formData.value.visibility === 'public' ? 'public' : 'private',
    headers: formData.value.headers
  }

  const result = isEditing.value
    ? await updateUrl(payload)
    : await addUrl(payload)

  if (result.success) {
    formMessage.value = isEditing.value ? 'URL updated.' : 'URL added.'
    formSuccess.value = true
    await loadUrls()
    emit('urlUpdated')
    setTimeout(closeModal, 600)
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
    await loadUrls()
    emit('urlUpdated')
    setTimeout(() => { actionMessage.value = '' }, 5000)
  } else {
    actionMessage.value = result.error || `Failed to delete "${urlName}".`
    actionSuccess.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadUrls(), loadDomainProfiles()])
})
onUnmounted(() => lockBodyScroll(false))
</script>

<style scoped>
.url-toolbar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.9rem;
}

.url-toolbar .form-label {
  margin-bottom: 0;
}

.url-toolbar .form-control {
  max-width: 220px;
}

.group-pill,
.vis-pill {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.45rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  white-space: nowrap;
}

.vis-pill {
  text-transform: uppercase;
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

.inherited-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
}

.inherited-list li {
  display: grid;
  grid-template-columns: minmax(7rem, 0.4fr) 1fr;
  gap: 0.5rem;
  padding: 0.4rem 0.55rem;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.inherited-list code {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
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
