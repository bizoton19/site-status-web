<template>
  <span class="logo-mark" aria-hidden="true">
    <svg
      class="logo-mark-svg"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <defs>
        <!-- Headlight beam: bright core → amber glass → deep gold edge -->
        <radialGradient :id="lensId" cx="40%" cy="36%" r="68%">
          <stop offset="0%" stop-color="#fff8d6" />
          <stop offset="22%" stop-color="#ffe066" />
          <stop offset="55%" stop-color="#f0a820" />
          <stop offset="100%" stop-color="#8a5810" />
        </radialGradient>
        <!-- Soft flashlight cone outside the rim -->
        <radialGradient :id="glowId" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffcc44" stop-opacity="0.5" />
          <stop offset="50%" stop-color="#e8a020" stop-opacity="0.16" />
          <stop offset="100%" stop-color="#c08010" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Outer beam glow (flashlight cones) -->
      <circle cx="9.5" cy="16" r="8" :fill="`url(#${glowId})`" />
      <circle cx="22.5" cy="16" r="8" :fill="`url(#${glowId})`" />

      <!-- Metallic / dark rims -->
      <circle
        cx="9.5"
        cy="16"
        r="5.55"
        fill="#141416"
        stroke="#5a5a64"
        stroke-width="1.05"
      />
      <circle
        cx="22.5"
        cy="16"
        r="5.55"
        fill="#141416"
        stroke="#5a5a64"
        stroke-width="1.05"
      />
      <!-- Inner rim ring -->
      <circle cx="9.5" cy="16" r="4.7" fill="none" stroke="#2a2a30" stroke-width="0.55" />
      <circle cx="22.5" cy="16" r="4.7" fill="none" stroke="#2a2a30" stroke-width="0.55" />

      <!-- Lens glass / golden beam -->
      <circle cx="9.5" cy="16" r="4.25" :fill="`url(#${lensId})`" />
      <circle cx="22.5" cy="16" r="4.25" :fill="`url(#${lensId})`" />

      <!-- Hot filament core -->
      <circle cx="9.5" cy="16" r="1.2" fill="#fff6c8" opacity="0.95" />
      <circle cx="22.5" cy="16" r="1.2" fill="#fff6c8" opacity="0.95" />

      <!-- Specular highlight on glass -->
      <circle cx="7.85" cy="14.15" r="0.8" fill="#ffffff" opacity="0.7" />
      <circle cx="20.85" cy="14.15" r="0.8" fill="#ffffff" opacity="0.7" />
    </svg>
  </span>
</template>

<script setup>
import { useId } from 'vue'

const uid = useId().replace(/:/g, '')
const lensId = `heimdall-lens-${uid}`
const glowId = `heimdall-glow-${uid}`
</script>
