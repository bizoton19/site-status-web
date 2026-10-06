<template>
  <span
    class="logo-mark"
    :class="{ 'logo-mark--wordmark': showWordmark }"
    :style="markStyle"
    aria-hidden="true"
  >
    <svg
      class="logo-mark-svg"
      :viewBox="viewBox"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      role="img"
    >
      <defs>
        <radialGradient :id="spaceId" cx="48%" cy="38%" r="72%">
          <stop offset="0%" stop-color="#12182a" />
          <stop offset="55%" stop-color="#080b14" />
          <stop offset="100%" stop-color="#040508" />
        </radialGradient>
        <linearGradient :id="planetId" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3d8f9e" />
          <stop offset="18%" stop-color="#1a4f5c" />
          <stop offset="52%" stop-color="#0d2a36" />
          <stop offset="100%" stop-color="#07151c" />
        </linearGradient>
        <linearGradient :id="limbId" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#a8f0ff" stop-opacity="0.95" />
          <stop offset="35%" stop-color="#5eead4" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#5eead4" stop-opacity="0" />
        </linearGradient>
        <linearGradient :id="steelId" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#e8eef6" />
          <stop offset="40%" stop-color="#9aa8bc" />
          <stop offset="100%" stop-color="#5a6678" />
        </linearGradient>
        <linearGradient :id="goldId" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f3e2a0" />
          <stop offset="45%" stop-color="#d4af37" />
          <stop offset="100%" stop-color="#8a6a14" />
        </linearGradient>
        <linearGradient :id="arcId" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#5eead4" stop-opacity="0.15" />
          <stop offset="40%" stop-color="#5eead4" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#f0d878" stop-opacity="0.95" />
        </linearGradient>
        <clipPath :id="clipId">
          <circle cx="32" cy="32" r="27.2" />
        </clipPath>
      </defs>

      <!-- Double mission-patch border -->
      <circle
        cx="32"
        cy="32"
        r="31"
        fill="none"
        :stroke="`url(#${goldId})`"
        stroke-width="1.15"
      />
      <circle
        cx="32"
        cy="32"
        r="28.65"
        fill="none"
        stroke="#7a8ca3"
        stroke-width="0.7"
        opacity="0.95"
      />

      <!-- Patch face -->
      <circle cx="32" cy="32" r="27.2" :fill="`url(#${spaceId})`" />

      <g :clip-path="`url(#${clipId})`">
        <!-- Stars -->
        <g fill="#e8f4ff">
          <circle cx="14" cy="12" r="0.55" opacity="0.9" />
          <circle cx="22" cy="8.5" r="0.4" opacity="0.65" />
          <circle cx="41" cy="10" r="0.5" opacity="0.85" />
          <circle cx="49" cy="15" r="0.35" opacity="0.55" />
          <circle cx="52" cy="24" r="0.45" opacity="0.7" />
          <circle cx="11" cy="22" r="0.35" opacity="0.5" />
          <circle cx="18" cy="18" r="0.3" opacity="0.4" />
          <circle cx="46" cy="20" r="0.3" opacity="0.45" />
          <circle cx="27" cy="11" r="0.28" opacity="0.55" />
          <circle cx="37" cy="7.5" r="0.32" opacity="0.6" />
        </g>
        <g fill="#5eead4">
          <circle cx="44.5" cy="13.5" r="0.35" opacity="0.7" />
          <circle cx="16.5" cy="15.5" r="0.28" opacity="0.55" />
        </g>

        <!-- Planet horizon -->
        <ellipse
          cx="32"
          cy="54.5"
          rx="34"
          ry="18.5"
          :fill="`url(#${planetId})`"
        />
        <!-- Atmospheric limb -->
        <path
          d="M 2 46.2 Q 32 36.8 62 46.2"
          fill="none"
          :stroke="`url(#${limbId})`"
          stroke-width="2.1"
          stroke-linecap="round"
          opacity="0.9"
        />
        <!-- Subtle surface bands -->
        <path
          d="M 6 50.5 Q 32 44 58 50.5"
          fill="none"
          stroke="#2a6a78"
          stroke-width="0.6"
          opacity="0.45"
        />
        <path
          d="M 10 55 Q 32 50 54 55"
          fill="none"
          stroke="#154048"
          stroke-width="0.55"
          opacity="0.5"
        />

        <!-- Three sensor arcs radiating above the station -->
        <g
          fill="none"
          :stroke="`url(#${arcId})`"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M 20.5 28.2 A 12.2 12.2 0 0 1 43.5 28.2"
            stroke-width="1.05"
            opacity="0.95"
          />
          <path
            d="M 17.2 25.4 A 16.2 16.2 0 0 1 46.8 25.4"
            stroke-width="0.9"
            opacity="0.78"
          />
          <path
            d="M 14.2 22.2 A 20.2 20.2 0 0 1 49.8 22.2"
            stroke-width="0.75"
            opacity="0.58"
          />
        </g>
        <!-- Arc tip ticks (scan markers) -->
        <g fill="#f0d878">
          <circle cx="20.5" cy="28.2" r="0.55" opacity="0.9" />
          <circle cx="43.5" cy="28.2" r="0.55" opacity="0.9" />
          <circle cx="17.2" cy="25.4" r="0.45" opacity="0.7" />
          <circle cx="46.8" cy="25.4" r="0.45" opacity="0.7" />
          <circle cx="14.2" cy="22.2" r="0.4" opacity="0.55" />
          <circle cx="49.8" cy="22.2" r="0.4" opacity="0.55" />
        </g>

        <!-- Orbital station silhouette -->
        <g transform="translate(32 34.2)">
          <!-- Solar arrays -->
          <rect
            x="-13.2"
            y="-1.15"
            width="7.4"
            height="2.3"
            rx="0.35"
            :fill="`url(#${steelId})`"
            opacity="0.92"
          />
          <rect
            x="5.8"
            y="-1.15"
            width="7.4"
            height="2.3"
            rx="0.35"
            :fill="`url(#${steelId})`"
            opacity="0.92"
          />
          <!-- Array grid lines -->
          <g stroke="#4a5566" stroke-width="0.25" opacity="0.7">
            <line x1="-11.4" y1="-1.15" x2="-11.4" y2="1.15" />
            <line x1="-9.2" y1="-1.15" x2="-9.2" y2="1.15" />
            <line x1="-7.1" y1="-1.15" x2="-7.1" y2="1.15" />
            <line x1="7.1" y1="-1.15" x2="7.1" y2="1.15" />
            <line x1="9.2" y1="-1.15" x2="9.2" y2="1.15" />
            <line x1="11.4" y1="-1.15" x2="11.4" y2="1.15" />
          </g>
          <!-- Boom -->
          <rect x="-5.9" y="-0.45" width="11.8" height="0.9" rx="0.25" fill="#6a7688" />
          <!-- Central hub -->
          <circle cx="0" cy="0" r="2.85" :fill="`url(#${steelId})`" />
          <circle cx="0" cy="0" r="1.55" fill="#1a2030" stroke="#5eead4" stroke-width="0.45" />
          <circle cx="0" cy="0" r="0.55" fill="#f0d878" />
          <!-- Mast / antenna -->
          <rect x="-0.35" y="-7.6" width="0.7" height="4.9" rx="0.2" fill="#8a96a8" />
          <circle cx="0" cy="-8.05" r="0.85" fill="#d4af37" />
          <circle cx="0" cy="-8.05" r="0.35" fill="#fff6c8" />
          <!-- Docking ring -->
          <ellipse
            cx="0"
            cy="3.35"
            rx="2.1"
            ry="0.7"
            fill="none"
            stroke="#9aa8bc"
            stroke-width="0.55"
          />
          <!-- Status lights -->
          <circle cx="-1.7" cy="0.15" r="0.35" fill="#5eead4" opacity="0.95" />
          <circle cx="1.7" cy="0.15" r="0.35" fill="#ff3366" opacity="0.9" />
        </g>

        <!-- Wordmark band (inside patch, bottom) -->
        <g v-if="showWordmark">
          <path
            d="M 12 48 Q 32 53.2 52 48"
            fill="none"
            stroke="#040508"
            stroke-width="6.8"
            opacity="0.62"
          />
          <text
            x="32"
            y="50.4"
            text-anchor="middle"
            fill="#eef2f7"
            font-family="JetBrains Mono, ui-monospace, monospace"
            font-size="4.6"
            font-weight="600"
            letter-spacing="0.95"
          >
            OUTPOST 13
          </text>
        </g>
      </g>

      <!-- Inner ring highlight over clipped content -->
      <circle
        cx="32"
        cy="32"
        r="27.2"
        fill="none"
        stroke="#c5d0de"
        stroke-width="0.35"
        opacity="0.25"
      />
    </svg>
  </span>
</template>

<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  size: {
    type: [Number, String],
    default: 28,
  },
  showWordmark: {
    type: Boolean,
    default: false,
  },
})

const uid = useId().replace(/:/g, '')
const spaceId = `o13-space-${uid}`
const planetId = `o13-planet-${uid}`
const limbId = `o13-limb-${uid}`
const steelId = `o13-steel-${uid}`
const goldId = `o13-gold-${uid}`
const arcId = `o13-arc-${uid}`
const clipId = `o13-clip-${uid}`

const viewBox = '0 0 64 64'

const markStyle = computed(() => {
  const px = typeof props.size === 'number' ? `${props.size}px` : String(props.size)
  return {
    width: px,
    height: px,
  }
})
</script>
