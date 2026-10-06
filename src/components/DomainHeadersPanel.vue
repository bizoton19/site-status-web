<template>
  <div class="dashboard-card domain-headers-card">
    <div class="dashboard-card-header">
      <div>
        <h3 class="dashboard-card-title">Domain headers</h3>
        <p class="card-sub">
          Optional. Shared request headers for every URL on a host when you need them
          (e.g. a special User-Agent). Skip this if the default poller is enough.
        </p>
      </div>
      <button class="btn btn-primary" type="button" @click="openAdd">
        Add domain
      </button>
    </div>
    <div class="dashboard-card-body">
      <div
        v-if="message"
        class="alert mb-3"
        :class="messageOk ? 'alert-success' : 'alert-danger'"
        role="alert"
      >
        {{ message }}
      </div>
      <div v-if="rows.length === 0" class="empty-state compact">
        <h4>No domain headers</h4>
        <p>Optional — only add when several endpoints on one host need the same headers.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Domain</th>
            <th>Label</th>
            <th>Headers</th>
            <th style="width: 120px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.domain">
            <td><strong>{{ row.domain }}</strong></td>
            <td>{{ row.label || '—' }}</td>
            <td>
              <span
                v-for="h in row.headerList"
                :key="`${row.domain}-${h.key}`"
                class="header-chip"
                :title="h.key"
              >{{ h.key }}</span>
              <span v-if="!row.headerList.length" class="text-muted">none</span>
            </td>
            <td>
              <div class="actions">
                <button class="btn-icon" type="button" title="Edit" @click="openEdit(row)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  class="btn-icon danger"
                  type="button"
                  title="Delete"
                  @click="remove(row.domain)"
                >
                  <i class="bi bi-trash3"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="modalOpen"
      class="url-modal-root"
      role="dialog"
      aria-modal="true"
      @keydown.escape.prevent="close"
    >
      <div class="url-modal-backdrop" aria-hidden="true" @click="close" />
      <div class="url-modal-dialog" @click.stop>
        <div class="url-modal-header">
          <h5 class="modal-title">{{ isEditing ? 'Edit domain headers' : 'Add domain headers' }}</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="close" />
        </div>
        <form class="url-modal-body" @submit.prevent="save">
          <div class="mb-3">
            <label class="form-label" for="dh-domain">Domain</label>
            <input
              id="dh-domain"
              v-model="form.domain"
              type="text"
              class="form-control"
              :readonly="isEditing"
              placeholder="e.g. bilomax.com or https://www.bilomax.com"
              autocomplete="off"
            >
          </div>
          <div class="mb-3">
            <label class="form-label" for="dh-label">Label (optional)</label>
            <input
              id="dh-label"
              v-model="form.label"
              type="text"
              class="form-control"
              placeholder="e.g. Bilomax sites"
              autocomplete="off"
            >
          </div>
          <div class="mb-3">
            <div class="headers-label-row">
              <label class="form-label mb-0">Headers</label>
              <label class="headers-show">
                <input v-model="showValues" type="checkbox">
                Show secrets
              </label>
            </div>
            <p class="headers-hint">
              Example: User-Agent → BilomaxBot/1.0 when a host expects a custom agent.
              Only Authorization / API keys are masked.
            </p>
            <div class="headers-editor">
              <div v-for="(h, i) in form.headers" :key="i" class="header-row">
                <input
                  v-model="h.key"
                  type="text"
                  class="form-control"
                  list="domain-header-suggestions"
                  placeholder="e.g. User-Agent"
                  autocomplete="off"
                >
                <input
                  v-model="h.value"
                  :type="headerValueInputType(h.key, !showValues)"
                  class="form-control"
                  :placeholder="suggestionForHeader(h.key)"
                  autocomplete="off"
                >
                <button type="button" class="btn-icon danger" @click="form.headers.splice(i, 1)">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
              <div class="header-suggest-row">
                <button
                  v-for="hint in unusedSuggestions(form.headers)"
                  :key="hint.name"
                  type="button"
                  class="header-suggest-chip"
                  @click="addSuggested(hint.name)"
                >
                  + {{ hint.name }}
                </button>
                <button type="button" class="btn btn-secondary btn-sm" @click="form.headers.push({ key: '', value: '' })">
                  + Custom
                </button>
              </div>
            </div>
            <datalist id="domain-header-suggestions">
              <option v-for="hint in SUGGESTED_HEADERS" :key="hint.name" :value="hint.name" />
            </datalist>
          </div>
          <div v-if="formError" class="small" style="color: var(--danger); margin-bottom: 0.75rem;">
            {{ formError }}
          </div>
          <div class="url-modal-footer url-modal-footer-inline">
            <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
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
import { onMounted, ref } from 'vue'
import { useApi } from '../composables/useApi'
import {
  headerValueInputType,
  normalizeDomain,
  parseHeadersJson,
  SUGGESTED_HEADERS,
  suggestionForHeader
} from '../utils/domainHeaders'

const emit = defineEmits(['updated'])
const { fetchDomainHeaders, saveDomainHeader, deleteDomainHeader } = useApi()

const rows = ref([])
const message = ref('')
const messageOk = ref(false)
const modalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const formError = ref('')
const showValues = ref(true)
const form = ref({ domain: '', label: '', headers: [{ key: '', value: '' }] })

function mapRow(entity) {
  const domain = entity.Domain || entity.domain || entity.RowKey || entity.rowKey || ''
  const headersJson = entity.HeadersJson || entity.headersJson || ''
  return {
    domain,
    label: entity.Label || entity.label || '',
    headersJson,
    headerList: parseHeadersJson(headersJson)
  }
}

async function load() {
  const data = await fetchDomainHeaders()
  rows.value = data.map(mapRow)
}

function openAdd() {
  isEditing.value = false
  showValues.value = true
  form.value = {
    domain: '',
    label: '',
    headers: [{ key: '', value: '' }]
  }
  formError.value = ''
  modalOpen.value = true
}

function openEdit(row) {
  isEditing.value = true
  showValues.value = false
  form.value = {
    domain: row.domain,
    label: row.label,
    headers: row.headerList.length ? row.headerList.map((h) => ({ ...h })) : [{ key: '', value: '' }]
  }
  formError.value = ''
  modalOpen.value = true
}

function unusedSuggestions(rows) {
  const used = new Set((rows || []).map((r) => String(r.key || '').toLowerCase()).filter(Boolean))
  return SUGGESTED_HEADERS.filter((h) => !used.has(h.name.toLowerCase()))
}

function addSuggested(name) {
  const empty = form.value.headers.find((r) => !String(r.key || '').trim())
  if (empty) {
    empty.key = name
    return
  }
  form.value.headers.push({ key: name, value: '' })
}

function close() {
  modalOpen.value = false
}

async function save() {
  const domain = normalizeDomain(form.value.domain)
  if (!domain) {
    formError.value = 'Enter a domain (e.g. bilomax.com)'
    return
  }
  saving.value = true
  formError.value = ''
  const result = await saveDomainHeader(
    {
      domain,
      label: form.value.label,
      headers: form.value.headers
    },
    { isEdit: isEditing.value }
  )
  saving.value = false
  if (!result.success) {
    formError.value = result.error || 'Save failed'
    return
  }
  modalOpen.value = false
  message.value = `Domain headers saved for ${domain}.`
  messageOk.value = true
  await load()
  emit('updated')
  setTimeout(() => { message.value = '' }, 4000)
}

async function remove(domain) {
  if (!confirm(`Delete domain headers for ${domain}?`)) return
  const result = await deleteDomainHeader(domain)
  if (result.success) {
    message.value = `Removed ${domain}.`
    messageOk.value = true
    await load()
    emit('updated')
  } else {
    message.value = result.error || 'Delete failed'
    messageOk.value = false
  }
}

onMounted(load)
defineExpose({ load })
</script>

<style scoped>
.card-sub {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  max-width: 42rem;
}

.empty-state.compact {
  padding: 1rem 0;
}

.header-chip {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.4rem;
  margin: 0 0.25rem 0.25rem 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
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
</style>
