<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Latest poll: online / offline / blocked</h3>
    </div>
    <div class="dashboard-card-body">
      <div
        v-if="total === 0"
        class="chart-empty text-secondary"
        style="padding: 2rem; text-align: center"
      >
        No endpoint data for this poll.
      </div>
      <div v-else class="chart-container">
        <Bar :key="theme" :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useTheme } from '../composables/useTheme.js'
import { getChartPalette, chartTooltipPlugin } from '../utils/chartTheme.js'
import { isBlockedStatus, isDownStatus, isSuccessStatus } from '../utils/probeStatus'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps({
  statuses: {
    type: Array,
    default: () => [],
  },
})

const { theme } = useTheme()

const online = computed(() => props.statuses.filter((s) => isSuccessStatus(s)).length)
const offline = computed(() => props.statuses.filter((s) => isDownStatus(s)).length)
const blocked = computed(() => props.statuses.filter((s) => isBlockedStatus(s)).length)
const total = computed(() => props.statuses.length)

const chartData = computed(() => {
  const palette = getChartPalette()
  return {
    labels: ['Online', 'Offline', 'Blocked'],
    datasets: [
      {
        label: 'Endpoints',
        data: [online.value, offline.value, blocked.value],
        backgroundColor: [palette.success, palette.danger, palette.danger],
        borderColor: [palette.successBorder, palette.dangerBorder, palette.dangerBorder],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }
})

const chartOptions = computed(() => {
  const palette = getChartPalette()
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...chartTooltipPlugin(palette),
        callbacks: {
          label: (ctx) => ` ${ctx.raw} endpoint(s)`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: palette.textMuted, font: { family: '"JetBrains Mono", monospace', size: 11 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: palette.textMuted,
          font: { family: '"JetBrains Mono", monospace', size: 11 },
          precision: 0,
        },
        grid: { color: palette.grid },
      },
    },
  }
})
</script>
