<template>
  <Teleport to="body">
    <div
      v-if="status"
      class="probe-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="probe-modal-title"
    >
      <div class="probe-modal-backdrop" @click="emit('close')" />
      <div class="probe-modal-dialog" @click.stop>
        <div class="probe-modal-header">
          <h5 id="probe-modal-title" class="modal-title">
            Probe details — {{ status.urlName }}
          </h5>
          <button ref="closeBtn" type="button" class="btn-icon" title="Close" aria-label="Close" @click="emit('close')">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div class="probe-modal-body">
          <p class="probe-meta">
            <span class="probe-pill fail">{{ detailStatusLabel }}</span>
            <span v-if="status.durationMs != null" class="text-secondary">
              {{ status.durationMs }} ms
            </span>
            <span class="text-secondary">{{ formatDate(status.date) }}</span>
          </p>

          <section class="probe-section">
            <h6>Request</h6>
            <dl class="probe-dl">
              <dt>Method</dt>
              <dd>{{ detailRequest.method || 'GET' }}</dd>
              <dt>URL</dt>
              <dd class="mono wrap">{{ detailRequest.url || status.url }}</dd>
            </dl>
            <div class="probe-block-label">Headers</div>
            <pre class="probe-pre">{{ formatHeaders(detailRequest.headers) }}</pre>
          </section>

          <section class="probe-section">
            <h6>Response</h6>
            <dl class="probe-dl">
              <dt>Status</dt>
              <dd>{{ detailResponse.statusCode ?? status.statusCode ?? status.status }}</dd>
              <dt v-if="detailResponse.reasonPhrase">Reason</dt>
              <dd v-if="detailResponse.reasonPhrase">{{ detailResponse.reasonPhrase }}</dd>
              <dt v-if="detailResponse.error">Error</dt>
              <dd v-if="detailResponse.error" class="err">{{ detailResponse.error }}</dd>
            </dl>
            <div class="probe-block-label">Headers</div>
            <pre class="probe-pre">{{ formatHeaders(detailResponse.headers) }}</pre>
            <div class="probe-block-label">Body snippet</div>
            <pre class="probe-pre body">{{ detailResponse.bodySnippet || status.description || '—' }}</pre>
          </section>
        </div>
        <div class="probe-modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" @click="emit('close')">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { formatStatusLabel, isBlockedStatus } from '../utils/probeStatus'
import { formatChecked as formatDate } from '../utils/statusView.js'

/** Owner-only probe request/response details for a failed or blocked endpoint. */
const props = defineProps({
  /** Normalized status item, or null when closed. */
  status: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const closeBtn = ref(null)

function parseJsonSafe(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

const detailRequest = computed(() => parseJsonSafe(props.status?.lastRequestJson))
const detailResponse = computed(() => parseJsonSafe(props.status?.lastResponseJson))

const detailStatusLabel = computed(() => {
  const s = props.status
  if (!s) return ''
  if (isBlockedStatus(s)) {
    const code = s.statusCode != null && s.statusCode !== '' ? String(s.statusCode) : ''
    return code ? `Blocked (${code})` : formatStatusLabel(s)
  }
  if (s.statusCode != null && s.statusCode !== '') return String(s.statusCode)
  return String(s.status || 'Failed')
})

function formatHeaders(headers) {
  if (!headers || typeof headers !== 'object') return '(none)'
  const entries = Object.entries(headers)
  if (!entries.length) return '(none)'
  return entries.map(([k, v]) => `${k}: ${v}`).join('\n')
}

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.status,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      document.addEventListener('keydown', onKeydown)
      nextTick(() => closeBtn.value?.focus())
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  }
)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.probe-modal-root {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.probe-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}

.probe-modal-dialog {
  position: relative;
  z-index: 1;
  width: min(640px, 100%);
  max-height: min(88vh, 900px);
  overflow: auto;
  background: var(--surface, #12141a);
  color: var(--text, #e8eaed);
  border: 1px solid var(--border, #2a2f3a);
  border-radius: 10px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
}

.probe-modal-header,
.probe-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border, #2a2f3a);
}

.probe-modal-footer {
  border-bottom: none;
  border-top: 1px solid var(--border, #2a2f3a);
  justify-content: flex-end;
}

.probe-modal-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.probe-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
  margin: 0;
  font-size: 0.85rem;
}

.probe-pill {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
}

.probe-pill.fail {
  background: color-mix(in srgb, var(--danger, #ef4444) 18%, transparent);
  color: var(--danger, #ef4444);
}

.probe-section h6 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.probe-dl {
  display: grid;
  grid-template-columns: 6rem 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0 0 0.65rem;
  font-size: 0.85rem;
}

.probe-dl dt {
  color: var(--text-muted, #9aa0a6);
  margin: 0;
}

.probe-dl dd {
  margin: 0;
}

.probe-dl dd.err {
  color: var(--danger, #ef4444);
}

.probe-dl .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
}

.probe-dl .wrap {
  word-break: break-all;
}

.probe-block-label {
  font-size: 0.75rem;
  color: var(--text-muted, #9aa0a6);
  margin-bottom: 0.25rem;
}

.probe-pre {
  margin: 0 0 0.75rem;
  padding: 0.65rem 0.75rem;
  background: var(--surface-muted, #0c0e12);
  border: 1px solid var(--border, #2a2f3a);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 10rem;
  overflow: auto;
}

.probe-pre.body {
  max-height: 14rem;
}

.btn-icon {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.35rem;
  line-height: 1;
  border-radius: 4px;
}

.btn-icon:hover {
  color: var(--text);
  background: var(--surface-muted, #0c0e12);
}
</style>
