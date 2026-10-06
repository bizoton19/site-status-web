/**
 * Probe result classification for Outpost13 status UI.
 * Keep in sync with Functions ProbeStatuses / PollUrlActivity.
 */

function rowFields(row) {
  if (row == null || typeof row !== 'object') {
    return { status: '', statusCode: NaN }
  }
  return {
    status: String(row.status ?? row.Status ?? '').trim(),
    statusCode: Number(row.statusCode ?? row.StatusCode)
  }
}

/** HTTP 401/403 or Status=BLOCKED (also legacy Forbidden/Unauthorized strings). */
export function isBlockedStatus(rowOrStatus) {
  if (typeof rowOrStatus === 'string') {
    const s = rowOrStatus.trim().toUpperCase()
    return s === 'BLOCKED' || s === 'FORBIDDEN' || s === 'UNAUTHORIZED' || s === '401' || s === '403'
  }
  const { status, statusCode } = rowFields(rowOrStatus)
  if (statusCode === 401 || statusCode === 403) return true
  const s = status.toUpperCase()
  return s === 'BLOCKED' || s === 'FORBIDDEN' || s === 'UNAUTHORIZED' || s === '401' || s === '403'
}

/** Successful probe — NOT blocked, even if StatusCode looks odd. */
export function isSuccessStatus(rowOrStatus) {
  if (isBlockedStatus(rowOrStatus)) return false
  if (typeof rowOrStatus === 'string') {
    const s = rowOrStatus.trim().toUpperCase()
    return s === 'OK' || s === 'CREATED' || s === '200' || s === '201' || s === 'UP'
  }
  const { status, statusCode } = rowFields(rowOrStatus)
  if (statusCode === 200 || statusCode === 201) return true
  const s = status.toUpperCase()
  return s === 'OK' || s === 'CREATED' || s === '200' || s === '201' || s === 'UP'
}

export function isUp(rowOrStatus) {
  return isSuccessStatus(rowOrStatus)
}

/** True downtime / transport failure (excludes BLOCKED). */
export function isDownStatus(rowOrStatus) {
  return !isSuccessStatus(rowOrStatus) && !isBlockedStatus(rowOrStatus)
}

/** Needs operator attention: down or blocked. */
export function needsAttention(rowOrStatus) {
  return !isSuccessStatus(rowOrStatus)
}

/** Short badge label for cards / pills. */
export function formatStatusLabel(rowOrStatus) {
  if (isSuccessStatus(rowOrStatus)) return 'OK'
  if (isBlockedStatus(rowOrStatus)) return 'Blocked'
  return 'Failed'
}

/** Public directory / landing pill label. */
export function formatPublicStatusLabel(rowOrStatus) {
  if (isSuccessStatus(rowOrStatus)) return 'Up'
  if (isBlockedStatus(rowOrStatus)) return 'Blocked'
  const raw = typeof rowOrStatus === 'string'
    ? rowOrStatus
    : rowFields(rowOrStatus).status
  const s = String(raw || '').trim().toLowerCase()
  if (!s || s === 'pending') return 'Pending'
  if (s === 'degraded') return 'Degraded'
  return 'Down'
}

/** CSS modifier for public pills — blocked uses same attention styling as down. */
export function publicStatusClass(rowOrStatus) {
  if (isSuccessStatus(rowOrStatus)) return 'is-up'
  if (isBlockedStatus(rowOrStatus)) return 'is-down'
  const raw = typeof rowOrStatus === 'string'
    ? rowOrStatus
    : rowFields(rowOrStatus).status
  const s = String(raw || '').trim().toLowerCase()
  if (!s || s === 'pending') return 'is-pending'
  if (s === 'degraded') return 'is-degraded'
  return 'is-down'
}
