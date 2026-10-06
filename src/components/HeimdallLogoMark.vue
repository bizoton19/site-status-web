<template>
  <span class="logo-mark" aria-hidden="true">
    <svg
      class="logo-mark-svg"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <defs>
        <radialGradient id="heimdall-eye" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ff6b88" />
          <stop offset="45%" stop-color="#ff2244" />
          <stop offset="100%" stop-color="#b80022" />
        </radialGradient>
      </defs>

      <!-- Two fierce red eyes — mark only, no face -->
      <ellipse cx="9.5" cy="16" rx="6.2" ry="5.4" fill="url(#heimdall-eye)" />
      <ellipse cx="22.5" cy="16" rx="6.2" ry="5.4" fill="url(#heimdall-eye)" />

      <!-- Dark pupils -->
      <ellipse cx="10.1" cy="16.2" rx="2.15" ry="2.45" fill="#1a0508" />
      <ellipse cx="23.1" cy="16.2" rx="2.15" ry="2.45" fill="#1a0508" />

      <!-- Hot core -->
      <circle cx="10.1" cy="16.2" r="0.95" fill="#ff2244" />
      <circle cx="23.1" cy="16.2" r="0.95" fill="#ff2244" />

      <!-- Specular highlight -->
      <circle cx="7.6" cy="13.6" r="1.15" fill="#fff5f5" opacity="0.9" />
      <circle cx="20.6" cy="13.6" r="1.15" fill="#fff5f5" opacity="0.9" />
    </svg>
  </span>
</template>
