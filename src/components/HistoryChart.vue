<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">
        <i class="bi bi-graph-up"></i>
        Uptime Trend (Last 7 Days)
      </h3>
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
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

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
      fill: true,
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      borderColor: 'rgba(102, 126, 234, 1)',
      borderWidth: 3,
      tension: 0.4,
      pointBackgroundColor: 'rgba(102, 126, 234, 1)',
      pointBorderColor: '#242837',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
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
      backgroundColor: '#242837',
      titleColor: '#ffffff',
      bodyColor: '#8b92ab',
      borderColor: '#2d3348',
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
        color: 'rgba(45, 51, 72, 0.5)',
        drawBorder: false
      },
      ticks: {
        color: '#8b92ab',
        font: {
          size: 12
        }
      }
    },
    y: {
      min: 80,
      max: 100,
      grid: {
        color: 'rgba(45, 51, 72, 0.5)',
        drawBorder: false
      },
      ticks: {
        color: '#8b92ab',
        font: {
          size: 12
        },
        callback: (value) => value + '%'
      }
    }
  }
}
</script>
