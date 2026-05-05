/**
 * Normalize Azure Function JSON into an array of history rows.
 * Shape may vary; common fields: UrlName, Url, Status, Date / Timestamp.
 */
export function normalizeHistoryPayload(data) {
  if (data == null) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.value)) return data.value
  if (Array.isArray(data.records)) return data.records
  if (Array.isArray(data.data)) return data.data
  return []
}

export function historyRecordDate(row) {
  const v =
    row.Date ??
    row.Timestamp ??
    row.CheckedAt ??
    row.Time ??
    row.date ??
    row.timestamp
  return v
}

export function historyRecordStatus(row) {
  return row.Status ?? row.status ?? ''
}

/** Map API rows to the shape used by status cards / log. */
export function toDisplayHistoryRows(rows) {
  return rows
    .map((r, i) => {
      const date = historyRecordDate(r)
      const status = historyRecordStatus(r)
      return {
        rowKey: r.RowKey ?? r.rowKey ?? `${r.UrlName ?? i}-${date}`,
        urlName: r.UrlName ?? r.urlName ?? '—',
        url: r.Url ?? r.url ?? '',
        description: r.Description ?? r.description ?? '',
        status: typeof status === 'string' ? status : String(status),
        date
      }
    })
    .filter(r => r.date != null && r.date !== '')
}

/**
 * Per calendar day (local), % of rows with Status === 'OK' (case-sensitive as API).
 * Returns { labels: string[], values: number[] } sorted by day ascending.
 */
export function aggregateUptimeByDay(rows, maxDays = 14) {
  const byDay = new Map()
  for (const r of rows) {
    const raw = historyRecordDate(r)
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) continue
    const key = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-')
    if (!byDay.has(key)) {
      byDay.set(key, { ok: 0, total: 0 })
    }
    const b = byDay.get(key)
    b.total += 1
    if (historyRecordStatus(r) === 'OK') b.ok += 1
  }
  const sortedKeys = [...byDay.keys()].sort()
  const keys = sortedKeys.slice(-maxDays)
  const labels = keys.map(k => {
    const [y, m, d] = k.split('-')
    return `${m}/${d}`
  })
  const values = keys.map(k => {
    const { ok, total } = byDay.get(k)
    return total > 0 ? Math.round((ok / total) * 100) : 0
  })
  return { labels, values, keys }
}
