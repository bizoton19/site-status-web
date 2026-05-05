<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Endpoints (latest poll)</h3>
    </div>
    <div class="dashboard-card-body">
      <div class="chart-container">
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

const chartData = computed(() => {
  const labels = props.statuses.slice(0, 8).map(s => 
    s.urlName.length > 12 ? s.urlName.substring(0, 12) + '...' : s.urlName
  )
  
  const data = props.statuses.slice(0, 8).map(s => s.status === 'OK' ? 100 : 0)
  
  const backgroundColors = props.statuses.slice(0, 8).map(s =>
    s.status === 'OK' ? '#5a9b6d' : '#c75a5a'
  )

  const borderColors = props.statuses.slice(0, 8).map(s =>
    s.status === 'OK' ? '#2f6f44' : '#a82a2a'
  )
  
  return {
    labels,
    datasets: [{
      label: 'Status',
      data,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 2,
      borderRadius: 2,
      borderSkipped: false
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
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
        label: (context) => {
          return context.raw === 100 ? ' Online' : ' Offline'
        }
      }
    }
  },
  scales: {
    x: {
      display: false,
      max: 100
    },
    y: {
      grid: {
        display: false
      },
      ticks: {
        color: '#5a6572',
        font: {
          size: 11
        }
      }
    }
  }
}
</script>
