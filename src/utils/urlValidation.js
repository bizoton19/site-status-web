/**
 * URL validation for Outpost13 monitoring.
 * Client-side validation with detailed error messages.
 */

// Private/internal IP patterns (RFC 1918 + localhost + link-local)
const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // Loopback
  /^10\./,                           // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./,      // Class B private
  /^192\.168\./,                     // Class C private
  /^169\.254\./,                     // Link-local
  /^0\./,                            // "This" network
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 unique local
  /^fe80:/i,                         // IPv6 link-local
]

// Cloud metadata endpoints (SSRF protection)
const BLOCKED_HOSTS = [
  '169.254.169.254',                 // AWS/Azure/GCP metadata
  'metadata.google.internal',
  'metadata.azure.com',
  'metadata.gcp.internal',
  '169.254.170.2',                   // AWS ECS metadata
]

// Blocked hostname patterns
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^localhost\./i,
  /\.localhost$/i,
  /\.local$/i,
  /\.internal$/i,
]

/**
 * Validate a single URL for monitoring.
 * @param {string} input - Raw URL string
 * @returns {{ valid: boolean, url?: string, error?: string, warnings?: string[] }}
 */
export function validateUrl(input) {
  const warnings = []
  
  // Trim and check empty
  const trimmed = (input || '').trim()
  if (!trimmed) {
    return { valid: false, error: 'URL is required' }
  }
  
  // Length check
  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL too long (max 2048 characters)' }
  }
  
  // Parse URL
  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
  
  // Protocol check (HTTPS only)
  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS URLs are supported' }
  }
  
  // No embedded credentials
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'URLs with embedded credentials are not allowed' }
  }
  
  // Port check (443 or default only)
  if (parsed.port && parsed.port !== '443') {
    return { valid: false, error: 'Only port 443 (default HTTPS) is supported' }
  }
  
  const hostname = parsed.hostname.toLowerCase()
  
  // Blocked hostnames (localhost, .local, etc.)
  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Private/localhost URLs cannot be monitored' }
    }
  }
  
  // Blocked hosts (metadata endpoints)
  if (BLOCKED_HOSTS.includes(hostname)) {
    return { valid: false, error: 'This URL cannot be monitored (blocked endpoint)' }
  }
  
  // IP address check
  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipMatch) {
    // Check if it's a private IP
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Private IP addresses cannot be monitored' }
      }
    }
    // Warn about IP-based URLs (not blocked, but discouraged)
    warnings.push('Consider using a domain name instead of an IP address')
  }
  
  // Check for suspicious patterns
  if (trimmed.includes('\\')) {
    return { valid: false, error: 'Invalid URL (contains backslash)' }
  }
  
  // Normalize URL (remove trailing slash for consistency)
  const normalized = parsed.origin + parsed.pathname.replace(/\/$/, '') + parsed.search
  
  return {
    valid: true,
    url: normalized,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Validate multiple URLs (batch).
 * @param {string[]} inputs - Array of raw URL strings
 * @returns {{ valid: object[], invalid: object[], total: number }}
 */
export function validateUrls(inputs) {
  const results = inputs.map((input, index) => {
    const result = validateUrl(input)
    return { ...result, original: input, index }
  })
  
  return {
    valid: results.filter(r => r.valid),
    invalid: results.filter(r => !r.valid),
    total: results.length
  }
}

/**
 * Split a simple CSV line (unquoted fields; commas inside URLs are not supported).
 * @param {string} line
 * @returns {string[]}
 */
function splitCsvFields(line) {
  return String(line || '').split(',').map((c) => c.trim())
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function looksLikeHttpsUrl(value) {
  return /^https:\/\//i.test(String(value || '').trim())
}

/**
 * True when a line looks like a CSV header that declares a url column.
 * @param {string} line
 * @returns {boolean}
 */
function isCsvHeaderLine(line) {
  const cols = splitCsvFields(line).map((c) => c.toLowerCase())
  if (!cols.includes('url') || cols.length < 2) return false
  // Header must not itself be a data row with a live URL
  return !cols.some(looksLikeHttpsUrl)
}

/**
 * True when a line looks like name,https://...,group (3+ fields, one HTTPS URL).
 * @param {string} line
 * @returns {boolean}
 */
function looksLikeCsvDataRow(line) {
  const cols = splitCsvFields(line)
  if (cols.length < 3) return false
  return cols.some(looksLikeHttpsUrl)
}

/**
 * Content lines only (trim; skip blanks and # comments). Preserves original line numbers.
 * @param {string} text
 * @returns {{ line: string, lineNumber: number }[]}
 */
function getContentLines(text) {
  return String(text || '')
    .split(/[\r\n]+/)
    .map((raw, index) => ({ line: raw.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line && !line.startsWith('#'))
}

/**
 * Build a validated import row from CSV field cells.
 * Group comes from the `group` column, falling back to legacy `category`.
 * @param {string[]} cols
 * @param {{ nameIndex: number, urlIndex: number, groupIndex: number, categoryIndex: number }} indexes
 * @param {number} lineNumber
 * @param {{ requireGroup?: boolean }} [options]
 * @returns {{ row?: { urlName: string, url: string, group?: string }, error?: string }}
 */
function rowFromCsvCols(cols, indexes, lineNumber, options = {}) {
  const { nameIndex, urlIndex, groupIndex = -1, categoryIndex = -1 } = indexes
  const requireGroup = options.requireGroup !== false
  const url = (urlIndex >= 0 ? cols[urlIndex] : '') || ''
  const name = nameIndex >= 0 ? (cols[nameIndex] || '') : ''
  const fromGroup = groupIndex >= 0 ? (cols[groupIndex] || '').trim() : ''
  const fromCategory = categoryIndex >= 0 ? (cols[categoryIndex] || '').trim() : ''
  const group = fromGroup || fromCategory

  if (!url) {
    return { error: `Row ${lineNumber}: Missing URL` }
  }

  if (requireGroup && !group) {
    return { error: `Row ${lineNumber}: Missing group` }
  }

  const validation = validateUrl(url)
  if (!validation.valid) {
    return { error: `Row ${lineNumber}: ${validation.error || 'Invalid URL'}` }
  }

  const row = {
    urlName: name || generateUrlName(validation.url),
    url: validation.url
  }
  if (group) {
    row.group = group
  }
  return { row }
}

/**
 * Parse paste input into URL rows.
 * Supported lines:
 *   https://example.com/health
 *   name | https://example.com/health
 *   name, https://example.com/health
 *   name\thttps://example.com/health
 * Skips blank lines and # comments.
 * For `name,url,group` CSV (header or headerless), use parseUrlImport instead.
 * @param {string} text
 * @returns {{ rows: { urlName: string, url: string, group?: string }[], errors: string[] }}
 */
export function parsePasteInput(text) {
  const rows = []
  const errors = []
  const lines = (text || '').split(/[\r\n]+/)

  lines.forEach((raw, index) => {
    const line = raw.trim()
    if (!line || line.startsWith('#')) return

    let urlName = ''
    let urlPart = line
    let group = ''

    if (line.includes('|')) {
      const [left, ...rest] = line.split('|')
      urlName = left.trim()
      urlPart = rest.join('|').trim()
    } else if (line.includes('\t')) {
      const parts = line.split('\t').map((p) => p.trim())
      if (parts.length >= 3 && parts.some(looksLikeHttpsUrl)) {
        const urlIndex = parts.findIndex(looksLikeHttpsUrl)
        urlName = parts[0] && !looksLikeHttpsUrl(parts[0]) ? parts[0] : ''
        urlPart = parts[urlIndex] || ''
        const afterUrl = parts.slice(urlIndex + 1).filter(Boolean)
        group = afterUrl[0] || ''
        if (!urlName && parts[0] !== urlPart) {
          urlName = parts[0] || ''
        }
      } else {
        const [left, ...rest] = parts
        urlName = left
        urlPart = rest.join('\t').trim()
      }
    } else if (line.includes(',') && !line.startsWith('http')) {
      const cols = splitCsvFields(line)
      // Avoid gluing group onto URL when 3+ CSV fields are present
      if (cols.length >= 3 && cols.some(looksLikeHttpsUrl)) {
        const urlIndex = cols.findIndex(looksLikeHttpsUrl)
        const nameIndex = urlIndex === 0 ? -1 : 0
        urlName = nameIndex >= 0 ? cols[nameIndex] : ''
        urlPart = cols[urlIndex] || ''
        group = (cols[urlIndex + 1] || '').trim()
      } else {
        const comma = line.indexOf(',')
        urlName = line.slice(0, comma).trim()
        urlPart = line.slice(comma + 1).trim()
      }
    }

    // Line that is only a URL (possibly with spaces around)
    if (!urlPart && /^https?:\/\//i.test(line)) {
      urlPart = line
    }

    const validation = validateUrl(urlPart)
    if (!validation.valid) {
      errors.push(`Line ${index + 1}: ${validation.error || 'Invalid URL'} (${line.slice(0, 60)})`)
      return
    }

    const row = {
      urlName: urlName || generateUrlName(validation.url),
      url: validation.url
    }
    if (group) {
      row.group = group
    }
    rows.push(row)
  })

  return { rows, errors }
}

/**
 * Generate a URL name from a URL.
 * @param {string} url - Valid URL
 * @returns {string} - Slug-style name
 */
export function generateUrlName(url) {
  try {
    const parsed = new URL(url)
    const base = (parsed.hostname + parsed.pathname)
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 50)
    return base || `url-${Date.now()}`
  } catch {
    return `url-${Date.now()}`
  }
}

/**
 * Group label from a URL record. Prefers `group`, then legacy `category`.
 * @param {object} record
 * @returns {string}
 */
export function readGroup(record) {
  if (!record || typeof record !== 'object') return ''
  const raw = record.group ?? record.Group ?? record.category ?? record.Category
  return raw == null ? '' : String(raw).trim()
}

/**
 * Parse CSV content for URL import.
 * Columns: name, url, group. A legacy `category` header is accepted when `group`
 * is missing or blank. Header row with a "url" column is detected automatically, or
 * pass { hasHeader: false } to treat rows as name,url,group (URL column auto-detected).
 * Rows without a group are rejected unless { requireGroup: false } (the Paste list UI
 * then applies its default group).
 * @param {string} csvContent - Raw CSV text
 * @param {{ hasHeader?: boolean, requireGroup?: boolean }} [options]
 * @returns {{ rows: { urlName: string, url: string, group?: string }[], errors: string[] }}
 */
export function parseCsvUrls(csvContent, options = {}) {
  const errors = []
  const rows = []
  const content = getContentLines(csvContent)

  if (content.length === 0) {
    return { rows: [], errors: ['CSV is empty'] }
  }

  let hasHeader = options.hasHeader
  if (hasHeader === undefined) {
    hasHeader = isCsvHeaderLine(content[0].line)
  }

  let nameIndex = 0
  let urlIndex = 1
  let groupIndex = 2
  let categoryIndex = -1
  let dataStart = 0

  if (hasHeader) {
    const header = splitCsvFields(content[0].line).map((h) => h.toLowerCase())
    urlIndex = header.indexOf('url')
    nameIndex = header.indexOf('name')
    groupIndex = header.indexOf('group')
    categoryIndex = header.indexOf('category')
    if (urlIndex === -1) {
      return { rows: [], errors: ['CSV must have a "url" column'] }
    }
    dataStart = 1
  } else {
    // Headerless: prefer name,url,group; otherwise find the HTTPS column
    const sample = splitCsvFields(content[0].line)
    const detectedUrl = sample.findIndex(looksLikeHttpsUrl)
    if (detectedUrl >= 0) {
      urlIndex = detectedUrl
      nameIndex = detectedUrl === 0 ? -1 : 0
      groupIndex = detectedUrl + 1 < sample.length ? detectedUrl + 1 : -1
    }
  }

  for (let i = dataStart; i < content.length; i++) {
    const { line, lineNumber } = content[i]
    const cols = splitCsvFields(line)
    const result = rowFromCsvCols(
      cols,
      { nameIndex, urlIndex, groupIndex, categoryIndex },
      lineNumber,
      { requireGroup: options.requireGroup }
    )
    if (result.error) {
      errors.push(result.error)
      continue
    }
    rows.push(result.row)
  }

  return { rows, errors }
}

/**
 * Smart import parser for Paste list / CSV paste.
 * - CSV header with a `url` column → CSV parser (name, url, group; legacy category ok)
 * - Headerless rows like `name,https://...,group` → CSV without header
 * - Otherwise one-URL-per-line / `name | url` paste behavior
 * Never leaves a group suffix on the URL string. Rows may omit group; the caller
 * applies its default group.
 * @param {string} text
 * @returns {{ rows: { urlName: string, url: string, group?: string }[], errors: string[] }}
 */
export function parseUrlImport(text) {
  const content = getContentLines(text)
  if (content.length === 0) {
    return { rows: [], errors: [] }
  }

  if (isCsvHeaderLine(content[0].line)) {
    return parseCsvUrls(text, { hasHeader: true, requireGroup: false })
  }

  const csvLikeCount = content.filter(({ line }) => looksLikeCsvDataRow(line)).length
  if (csvLikeCount > 0 && csvLikeCount >= Math.ceil(content.length * 0.5)) {
    return parseCsvUrls(text, { hasHeader: false, requireGroup: false })
  }

  return parsePasteInput(text)
}
