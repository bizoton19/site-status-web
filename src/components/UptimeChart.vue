<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Availability split</h3>
    </div>
    <div class="dashboard-card-body">
      <div class="chart-container">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend 
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  statuses: {
    type: Array,
    default: () => []
  }
})

const chartData = computed(() => {
  const online = props.statuses.filter(s => s.status === 'OK').length
  const offline = props.statuses.filter(s => s.status !== 'OK').length
  
  return {
    labels: ['Online', 'Offline'],
    datasets: [{
      data: [online || 1, offline],
      backgroundColor: ['#3d7a52', '#b54545'],
      borderColor: ['#2f6f44', '#a82a2a'],
      borderWidth: 2,
      hoverOffset: 4
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#5a6572',
        padding: 20,
        font: {
          size: 12
        },
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: '#ffffff',
      titleColor: '#1c2430',
      bodyColor: '#5a6572',
      borderColor: '#d9dde3',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: (context) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = Math.round((context.raw / total) * 100)
          return ` ${context.label}: ${context.raw} (${percentage}%)`
        }
      }
    }
  }
}
</script>
