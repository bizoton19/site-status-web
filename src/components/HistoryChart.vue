<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Uptime by day (from history)</h3>
      <span v-if="hasData" class="text-secondary" style="font-size: 0.8rem;">
        {{ pointCount }} day(s) with data
      </span>
    </div>
    <div class="dashboard-card-body">
      <div v-if="!hasData" class="history-chart-empty">
        <p><strong>No history yet.</strong></p>
        <p class="text-secondary small">
          Trends use rows from <code>statusHistoryTable</code> via
          <code>statushistoryreader</code>. After polls write history, daily OK rates appear here.
        </p>
      </div>
      <div v-else class="chart-container" style="height: 320px;">
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
import { aggregateUptimeByDay } from '../utils/statusHistory'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps({
  /** Raw history rows from fetchStatusHistory (array of objects). */
  history: {
    type: Array,
    default: () => []
  }
})

const aggregated = computed(() => aggregateUptimeByDay(props.history, 14))

const hasData = computed(() => aggregated.value.labels.length > 0)

const pointCount = computed(() => aggregated.value.labels.length)

const chartData = computed(() => {
  const { labels, values } = aggregated.value
  return {
    labels,
    datasets: [
      {
        label: '% checks OK',
        data: values,
        fill: false,
        borderColor: '#154273',
        borderWidth: 2,
        tension: 0.15,
        pointBackgroundColor: '#154273',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5
      }
    ]
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
        label: (ctx) => ` ${ctx.raw}% OK`
      }
    }
  },
  scales: {
    x: {
      grid: { color: '#e8eaed', drawBorder: false },
      ticks: { color: '#5a6572', font: { size: 11 } }
    },
    y: {
      min: 0,
      max: 100,
      grid: { color: '#e8eaed', drawBorder: false },
      ticks: {
        color: '#5a6572',
        font: { size: 11 },
        callback: (value) => value + '%'
      }
    }
  }
}
</script>

<style scoped>
.history-chart-empty {
  padding: 1.5rem 1rem;
  max-width: 36rem;
}

.history-chart-empty code {
  font-size: 0.8em;
  background: var(--surface-muted, #f7f8fa);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
}
</style>
