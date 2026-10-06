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

      <!--
        Möbius / figure-eight band — back lobes under the eyes.
        Clean outline stroke; muted metal + soft accent for Trinity theme.
      -->
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path :d="mobiusLeft" stroke="#ff3366" stroke-width="2.4" opacity="0.16" />
        <path :d="mobiusRight" stroke="#ff3366" stroke-width="2.4" opacity="0.16" />
        <path :d="mobiusLeft" stroke="#55555f" stroke-width="1.45" />
        <path :d="mobiusRight" stroke="#55555f" stroke-width="1.45" />
        <path :d="mobiusLeft" stroke="#9a9aa6" stroke-width="0.75" />
        <path :d="mobiusRight" stroke="#9a9aa6" stroke-width="0.75" />
      </g>

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

      <!--
        Half-twist crossing drawn over the mid-gap — sells the Möbius wrap
        without covering the golden lenses.
      -->
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path :d="mobiusTwistUnder" stroke="#ff3366" stroke-width="2.1" opacity="0.2" />
        <path :d="mobiusTwistUnder" stroke="#4a4a54" stroke-width="1.4" />
        <path :d="mobiusTwistOver" stroke="#ff3366" stroke-width="2.1" opacity="0.28" />
        <path :d="mobiusTwistOver" stroke="#7a7a86" stroke-width="1.4" />
        <path :d="mobiusTwistOver" stroke="#c4c4ce" stroke-width="0.7" />
        <path :d="mobiusTwistAccent" stroke="#ff3366" stroke-width="0.7" opacity="0.9" />
      </g>
    </svg>
  </span>
</template>

<script setup>
import { useId } from 'vue'

const uid = useId().replace(/:/g, '')
const lensId = `heimdall-lens-${uid}`
const glowId = `heimdall-glow-${uid}`

/*
  Figure-eight lobes wrapping each headlight (centers 9.5 / 22.5).
  Loops sit just outside the metallic rims; they meet at mid (16,16)
  where the half-twist strands cross.
*/
const mobiusLeft =
  'M 16 16' +
  'C 16 11.2 12.2 9.1 9.5 9.1' +
  'C 5.6 9.1 2.9 12.2 2.9 16' +
  'C 2.9 19.8 5.6 22.9 9.5 22.9' +
  'C 12.2 22.9 16 20.8 16 16'

const mobiusRight =
  'M 16 16' +
  'C 16 11.2 19.8 9.1 22.5 9.1' +
  'C 26.4 9.1 29.1 12.2 29.1 16' +
  'C 29.1 19.8 26.4 22.9 22.5 22.9' +
  'C 19.8 22.9 16 20.8 16 16'

/* Under / over strands of the half-twist between the eyes */
const mobiusTwistUnder =
  'M 12.4 13.2 C 14.2 14.8 14.8 17.4 16 18.6 C 17.2 17.4 17.8 14.8 19.6 13.2'

const mobiusTwistOver =
  'M 12.4 18.8 C 14.2 17.2 14.8 14.6 16 13.4 C 17.2 14.6 17.8 17.2 19.6 18.8'

const mobiusTwistAccent =
  'M 14.2 14.8 C 15.1 15.9 15.5 16.8 16 17.4 C 16.5 16.8 16.9 15.9 17.8 14.8'
</script>
