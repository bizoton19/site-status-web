<template>
  <span class="logo-mark" aria-hidden="true">
    <svg
      class="logo-mark-svg"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <defs>
        <linearGradient :id="beamId" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#fff8d6" stop-opacity="0" />
          <stop offset="35%" stop-color="#ffe066" stop-opacity="0.55" />
          <stop offset="78%" stop-color="#f0a820" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#ffcc44" stop-opacity="0.95" />
        </linearGradient>
        <radialGradient :id="lensId" cx="42%" cy="38%" r="68%">
          <stop offset="0%" stop-color="#fff8d6" />
          <stop offset="28%" stop-color="#ffe066" />
          <stop offset="62%" stop-color="#f0a820" />
          <stop offset="100%" stop-color="#8a5810" />
        </radialGradient>
        <linearGradient :id="bodyId" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#6a6a74" />
          <stop offset="45%" stop-color="#3a3a42" />
          <stop offset="100%" stop-color="#1c1c22" />
        </linearGradient>
        <linearGradient :id="bezelId" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8a8a96" />
          <stop offset="50%" stop-color="#4a4a54" />
          <stop offset="100%" stop-color="#2a2a32" />
        </linearGradient>
      </defs>

      <!-- Golden beam cone (flashlight facing left, on its side) -->
      <path
        d="M 11.2 16 L 1.2 9.4 L 1.2 22.6 Z"
        :fill="`url(#${beamId})`"
        opacity="0.92"
      />
      <path
        d="M 11.2 16 L 0.6 11.2 L 0.6 20.8 Z"
        fill="#fff6c8"
        opacity="0.35"
      />

      <!-- Soft outer glow near the lens -->
      <ellipse cx="10.2" cy="16" rx="3.4" ry="5.2" fill="#ffcc44" opacity="0.22" />

      <!-- Barrel / body -->
      <rect
        x="12.4"
        y="11.6"
        width="13.2"
        height="8.8"
        rx="2.2"
        :fill="`url(#${bodyId})`"
        stroke="#5a5a64"
        stroke-width="0.7"
      />
      <!-- Body highlight groove -->
      <path
        d="M 14.2 13.4 H 23.8"
        fill="none"
        stroke="#9a9aa6"
        stroke-width="0.55"
        opacity="0.55"
        stroke-linecap="round"
      />
      <path
        d="M 14.2 18.6 H 23.8"
        fill="none"
        stroke="#1a1a20"
        stroke-width="0.55"
        opacity="0.55"
        stroke-linecap="round"
      />

      <!-- End cap -->
      <rect
        x="25.2"
        y="12.4"
        width="3.2"
        height="7.2"
        rx="1.2"
        fill="#2a2a32"
        stroke="#6a6a74"
        stroke-width="0.65"
      />
      <circle cx="26.8" cy="16" r="1.05" fill="#141416" stroke="#55555f" stroke-width="0.45" />

      <!-- Head / bezel -->
      <rect
        x="10.1"
        y="10.4"
        width="3.1"
        height="11.2"
        rx="1.1"
        :fill="`url(#${bezelId})`"
        stroke="#7a7a86"
        stroke-width="0.55"
      />

      <!-- Lens glass (ON) -->
      <ellipse
        cx="10.5"
        cy="16"
        rx="1.55"
        ry="4.35"
        :fill="`url(#${lensId})`"
        stroke="#c9a227"
        stroke-width="0.45"
      />
      <ellipse cx="10.15" cy="14.2" rx="0.55" ry="1.1" fill="#ffffff" opacity="0.65" />
      <ellipse cx="10.55" cy="16" rx="0.45" ry="1.35" fill="#fff6c8" opacity="0.9" />

      <!-- Slide switch ON (toward the head / beam) -->
      <rect
        x="15.6"
        y="9.35"
        width="5.4"
        height="2.35"
        rx="1.15"
        fill="#1c1c22"
        stroke="#5a5a64"
        stroke-width="0.5"
      />
      <rect
        x="15.85"
        y="9.55"
        width="2.55"
        height="1.95"
        rx="0.9"
        fill="#ff3366"
        stroke="#ff6688"
        stroke-width="0.35"
      />
      <!-- Tiny ON tick -->
      <circle cx="17.1" cy="10.52" r="0.35" fill="#fff0f4" opacity="0.85" />
    </svg>
  </span>
</template>

<script setup>
import { useId } from 'vue'

const uid = useId().replace(/:/g, '')
const beamId = `outpost13-beam-${uid}`
const lensId = `outpost13-lens-${uid}`
const bodyId = `outpost13-body-${uid}`
const bezelId = `outpost13-bezel-${uid}`
</script>
