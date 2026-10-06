<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Availability (latest poll)</h3>
    </div>
    <div class="dashboard-card-body">
      <div class="chart-container">
        <Doughnut :key="theme" :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useTheme } from '../composables/useTheme.js'
import { getChartPalette, chartTooltipPlugin, chartLegendLabels } from '../utils/chartTheme.js'
import { isBlockedStatus, isDownStatus, isSuccessStatus } from '../utils/probeStatus'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  statuses: {
    type: Array,
    default: () => [],
  },
})

const { theme } = useTheme()

const chartData = computed(() => {
  const palette = getChartPalette()
  const online = props.statuses.filter((s) => isSuccessStatus(s)).length
  const offline = props.statuses.filter((s) => isDownStatus(s)).length
  const blocked = props.statuses.filter((s) => isBlockedStatus(s)).length

  return {
    labels: ['Online', 'Offline', 'Blocked'],
    datasets: [
      {
        data: [online || (offline + blocked === 0 ? 1 : 0), offline, blocked],
        backgroundColor: [palette.success, palette.danger, palette.danger],
        borderColor: [palette.successBorder, palette.dangerBorder, palette.dangerBorder],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  }
})

const chartOptions = computed(() => {
  const palette = getChartPalette()
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: chartLegendLabels(palette),
      },
      tooltip: {
        ...chartTooltipPlugin(palette),
        displayColors: true,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = Math.round((context.raw / total) * 100)
            return ` ${context.label}: ${context.raw} (${percentage}%)`
          },
        },
      },
    },
  }
})
</script>
