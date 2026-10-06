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
        <clipPath :id="clipId">
          <circle cx="32" cy="32" r="26" />
        </clipPath>
      </defs>

      <!-- Double mission-patch border -->
      <circle
        cx="32"
        cy="32"
        r="30.5"
        fill="none"
        stroke="#d4af37"
        stroke-width="2.4"
      />
      <circle
        cx="32"
        cy="32"
        r="27.4"
        fill="none"
        stroke="#8a96a8"
        stroke-width="1.5"
      />

      <!-- Flat patch face -->
      <circle cx="32" cy="32" r="26" fill="#0a0e16" />

      <g :clip-path="`url(#${clipId})`">
        <!-- Planet horizon (solid geometric fill) -->
        <ellipse cx="32" cy="55" rx="30" ry="16" fill="#1a5560" />
        <path
          d="M 4 46 Q 32 38 60 46"
          fill="none"
          stroke="#5eead4"
          stroke-width="2"
          stroke-linecap="round"
        />

        <!-- Three sensor arcs -->
        <g
          fill="none"
          stroke="#5eead4"
          stroke-linecap="round"
          stroke-width="1.8"
        >
          <path d="M 20 28 A 12.5 12.5 0 0 1 44 28" />
          <path d="M 16.5 24.5 A 17 17 0 0 1 47.5 24.5" opacity="0.75" />
          <path d="M 13.5 20.5 A 21.5 21.5 0 0 1 50.5 20.5" opacity="0.5" />
        </g>

        <!-- Orbital station silhouette -->
        <g transform="translate(32 35)" fill="#d8dee8" stroke="none">
          <!-- Solar arrays -->
          <rect x="-14" y="-1.4" width="8" height="2.8" rx="0.4" />
          <rect x="6" y="-1.4" width="8" height="2.8" rx="0.4" />
          <!-- Boom -->
          <rect x="-6" y="-0.7" width="12" height="1.4" rx="0.3" />
          <!-- Central hub -->
          <circle cx="0" cy="0" r="3.2" />
          <circle cx="0" cy="0" r="1.6" fill="#0a0e16" />
          <circle cx="0" cy="0" r="0.7" fill="#d4af37" />
          <!-- Mast -->
          <rect x="-0.55" y="-8.2" width="1.1" height="5.2" rx="0.3" />
          <circle cx="0" cy="-8.6" r="1.15" fill="#d4af37" />
        </g>

        <!-- Wordmark band (footer / large sizes) -->
        <g v-if="showWordmark">
          <path
            d="M 10 49 Q 32 55 54 49"
            fill="none"
            stroke="#0a0e16"
            stroke-width="7.2"
            opacity="0.85"
          />
          <text
            x="32"
            y="51.2"
            text-anchor="middle"
            fill="#f0d878"
            font-family="JetBrains Mono, ui-monospace, monospace"
            font-size="5.4"
            font-weight="700"
            letter-spacing="0.85"
          >
            OUTPOST 13
          </text>
        </g>
      </g>
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
