<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Latest poll: online vs offline</h3>
    </div>
    <div class="dashboard-card-body">
      <div v-if="total === 0" class="chart-empty text-secondary" style="padding: 2rem; text-align: center;">
        No endpoint data for this poll.
      </div>
      <div v-else class="chart-container">
        <Bar :data="chartData" :options="chartOptions" />
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
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps({
  statuses: {
    type: Array,
    default: () => []
  }
})

const online = computed(() => props.statuses.filter(s => s.status === 'OK').length)
const offline = computed(() => props.statuses.filter(s => s.status !== 'OK').length)
const total = computed(() => props.statuses.length)

const chartData = computed(() => ({
  labels: ['Online', 'Offline'],
  datasets: [
    {
      label: 'Endpoints',
      data: [online.value, offline.value],
      backgroundColor: ['#2f6f44', '#c75a5a'],
      borderColor: ['#1b4d2e', '#a82a2a'],
      borderWidth: 1,
      borderRadius: 4
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#ffffff',
      titleColor: '#1c2430',
      bodyColor: '#5a6572',
      borderColor: '#d9dde3',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        label: (ctx) => ` ${ctx.raw} endpoint(s)`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#5a6572', font: { size: 12 } }
    },
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        color: '#5a6572',
        font: { size: 12 },
        precision: 0
      },
      grid: { color: '#e8eaed' }
    }
  }
}
</script>
