/**
 * Shared helpers for the status views (public /allstatuses and signed-in /statuses, /dashboard).
 * Items passed to StatusBoard are normalized by each page to:
 *   { key, urlName, url, domain, group, status, statusCode, durationMs, description, date, ... }
 */
import { isBlockedStatus, isSuccessStatus } from './probeStatus.js'

export const UNGROUPED = 'Ungrouped'
export const NARROW_QUERY = '(max-width: 992px)'

/** Board columns when grouping by status (display order). */
export const STATUS_COLUMNS = [
  { key: 'up', label: 'Up' },
  { key: 'degraded', label: 'Degraded' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'down', label: 'Down' },
  { key: 'unknown', label: 'Unknown' },
]

/** Sort rank for "status" ascending: attention first (matches the old signed-in ordering). */
const STATUS_RANK = { down: 0, blocked: 1, degraded: 2, unknown: 3, up: 4 }

const ITEM_LABEL = { up: 'Up', degraded: 'Degraded', blocked: 'Blocked', down: 'Down', unknown: 'Pending' }

/** up | degraded | blocked | down | unknown */
export function statusBucket(item) {
  if (isSuccessStatus(item)) return 'up'
  if (isBlockedStatus(item)) return 'blocked'
  const s = String(item?.status ?? '').trim().toLowerCase()
  if (!s || s === 'pending' || s === 'unknown') return 'unknown'
  if (s === 'degraded') return 'degraded'
  return 'down'
}

export function statusLabel(item) {
  return ITEM_LABEL[statusBucket(item)]
}

export function groupLabel(item) {
  const g = String(item?.group ?? '').trim()
  return g || UNGROUPED
}

export function sameGroup(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()
}

/** Distinct group labels (sorted; Ungrouped last). */
export function distinctGroups(items) {
  const names = new Map()
  for (const item of items || []) {
    const label = groupLabel(item)
    const k = label.toLowerCase()
    if (!names.has(k)) names.set(k, label)
  }
  return [...names.values()].sort((a, b) => {
    if (a === UNGROUPED) return 1
    if (b === UNGROUPED) return -1
    return a.localeCompare(b)
  })
}

export const SORT_OPTIONS = [
  { key: 'status', label: 'Status', defaultDir: 'asc' },
  { key: 'name', label: 'Name', defaultDir: 'asc' },
  { key: 'group', label: 'Group', defaultDir: 'asc' },
  { key: 'checked', label: 'Last checked', defaultDir: 'desc' },
  { key: 'response', label: 'Response time', defaultDir: 'desc' },
]

export function defaultSortDir(key) {
  return SORT_OPTIONS.find((o) => o.key === key)?.defaultDir || 'asc'
}

function timeOf(date) {
  const t = date ? new Date(date).getTime() : NaN
  return Number.isNaN(t) ? null : t
}

function displayName(item) {
  return String(item?.urlName || item?.url || '').toLowerCase()
}

export function hasResponseTimes(items) {
  return (items || []).some((i) => typeof i?.durationMs === 'number' && i.durationMs > 0)
}

/** Stable comparator; missing values always sort last regardless of direction. */
export function compareItems(key, dir = 'asc') {
  const sign = dir === 'desc' ? -1 : 1
  const pick = {
    status: (i) => STATUS_RANK[statusBucket(i)],
    name: (i) => displayName(i),
    group: (i) => (groupLabel(i) === UNGROUPED ? null : groupLabel(i).toLowerCase()),
    checked: (i) => timeOf(i.date),
    response: (i) => (typeof i.durationMs === 'number' && i.durationMs > 0 ? i.durationMs : null),
  }[key] || ((i) => displayName(i))

  return (a, b) => {
    const va = pick(a)
    const vb = pick(b)
    if (va == null && vb == null) return displayName(a).localeCompare(displayName(b))
    if (va == null) return 1
    if (vb == null) return -1
    let c = typeof va === 'string' ? va.localeCompare(vb) : va - vb
    if (c === 0) c = displayName(a).localeCompare(displayName(b)) * sign
    return c * sign
  }
}

export function hrefForUrl(url) {
  if (!url || typeof url !== 'string') return '#'
  const t = url.trim()
  if (!t) return '#'
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

export function formatChecked(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatDuration(ms) {
  if (typeof ms !== 'number' || ms <= 0) return '—'
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`
}

export function formatErrorDescription(desc) {
  if (!desc) return 'Error'
  const clean = String(desc).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (clean.includes('Site Status Dashboard') && clean.includes('site-status-theme')) {
    return 'Received dashboard HTML (check monitored URL or API base).'
  }
  return clean.length > 120 ? `${clean.slice(0, 120)}…` : clean
}

/* ---------- View preferences (localStorage) ---------- */
export const VIEW_KEYS = ['table', 'cards', 'board']
export const BOARD_BY_KEYS = ['group', 'status']

export function loadViewPrefs(storageKey) {
  if (!storageKey || typeof localStorage === 'undefined') return {}
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || '{}')
    return {
      view: VIEW_KEYS.includes(raw?.view) ? raw.view : undefined,
      boardBy: BOARD_BY_KEYS.includes(raw?.boardBy) ? raw.boardBy : undefined,
    }
  } catch {
    return {}
  }
}

export function saveViewPrefs(storageKey, prefs) {
  if (!storageKey || typeof localStorage === 'undefined') return
  try {
    const current = loadViewPrefs(storageKey)
    localStorage.setItem(storageKey, JSON.stringify({ ...current, ...prefs }))
  } catch {
    /* storage full / disabled — preference just won't persist */
  }
}

export function isNarrowViewport() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(NARROW_QUERY).matches
}
