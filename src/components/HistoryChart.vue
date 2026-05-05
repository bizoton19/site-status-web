<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Uptime trend (sample)</h3>
    </div>
    <div class="dashboard-card-body">
      <div class="chart-container" style="height: 350px;">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps({
  statuses: {
    type: Array,
    default: () => []
  }
})

const chartData = computed(() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const total = props.statuses.length || 1
  const online = props.statuses.filter(s => s.status === 'OK').length
  const currentUptime = Math.round((online / total) * 100)
  
  const mockData = [
    Math.max(85, currentUptime - 5),
    Math.max(88, currentUptime - 3),
    Math.max(92, currentUptime - 2),
    Math.max(90, currentUptime - 4),
    Math.max(95, currentUptime - 1),
    Math.max(93, currentUptime - 2),
    currentUptime
  ]
  
  return {
    labels: days,
    datasets: [{
      label: 'Uptime %',
      data: mockData,
      fill: false,
      borderColor: '#154273',
      borderWidth: 2,
      tension: 0.2,
      pointBackgroundColor: '#154273',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 5
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#ffffff',
      titleColor: '#1c2430',
      bodyColor: '#5a6572',
      borderColor: '#d9dde3',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        label: (context) => ` Uptime: ${context.raw}%`
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: '#e8eaed',
        drawBorder: false
      },
      ticks: {
        color: '#5a6572',
        font: {
          size: 12
        }
      }
    },
    y: {
      min: 80,
      max: 100,
      grid: {
        color: '#e8eaed',
        drawBorder: false
      },
      ticks: {
        color: '#5a6572',
        font: {
          size: 12
        },
        callback: (value) => value + '%'
      }
    }
  }
}
</script>
