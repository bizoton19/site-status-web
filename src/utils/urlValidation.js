/**
 * URL validation for Watchtower monitoring.
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
 * Parse paste input into URL rows.
 * Supported lines:
 *   https://example.com/health
 *   name | https://example.com/health
 *   name, https://example.com/health
 *   name\thttps://example.com/health
 * Skips blank lines and # comments.
 * @param {string} text
 * @returns {{ rows: { urlName: string, url: string }[], errors: string[] }}
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

    if (line.includes('|')) {
      const [left, ...rest] = line.split('|')
      urlName = left.trim()
      urlPart = rest.join('|').trim()
    } else if (line.includes('\t')) {
      const [left, ...rest] = line.split('\t')
      urlName = left.trim()
      urlPart = rest.join('\t').trim()
    } else if (line.includes(',') && !line.startsWith('http')) {
      const comma = line.indexOf(',')
      urlName = line.slice(0, comma).trim()
      urlPart = line.slice(comma + 1).trim()
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

    rows.push({
      urlName: urlName || generateUrlName(validation.url),
      url: validation.url
    })
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
 * Parse CSV content for URL import.
 * Expected format: name,url (header row required)
 * @param {string} csvContent - Raw CSV text
 * @returns {{ rows: object[], errors: string[] }}
 */
export function parseCsvUrls(csvContent) {
  const errors = []
  const rows = []
  
  const lines = csvContent.split(/[\r\n]+/).filter(l => l.trim())
  if (lines.length === 0) {
    return { rows: [], errors: ['CSV is empty'] }
  }
  
  // Parse header
  const header = lines[0].toLowerCase().split(',').map(h => h.trim())
  const urlIndex = header.indexOf('url')
  const nameIndex = header.indexOf('name')
  
  if (urlIndex === -1) {
    return { rows: [], errors: ['CSV must have a "url" column'] }
  }
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim())
    const url = cols[urlIndex] || ''
    const name = nameIndex !== -1 ? cols[nameIndex] : ''
    
    if (!url) {
      errors.push(`Row ${i + 1}: Missing URL`)
      continue
    }
    
    const validation = validateUrl(url)
    if (!validation.valid) {
      errors.push(`Row ${i + 1}: ${validation.error}`)
      continue
    }
    
    rows.push({
      urlName: name || generateUrlName(url),
      url: validation.url
    })
  }
  
  return { rows, errors }
}
