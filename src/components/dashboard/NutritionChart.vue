<template>
  <div class="nutrition-chart">
    <div class="chart-header">
      <h3>{{ title }}</h3>
      <div class="chart-period">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="{ 'active': selectedPeriod === period.value }"
          class="period-btn"
        >
          {{ period.label }}
        </button>
      </div>
    </div>
    <div class="chart-container" ref="chartContainer">
      <canvas ref="chartCanvas"></canvas>
    </div>
    <div class="chart-legend">
      <div
        v-for="(item, index) in props.data"
        :key="item.label"
        class="legend-item"
      >
        <div
          class="legend-color"
          :style="{ backgroundColor: item.color }"
        ></div>
        <span class="legend-label">{{ item.label }}</span>
        <span class="legend-value">{{ item.value }}{{ item.unit }}</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
interface ChartDataItem {
  label: string
  value: number
  color: string
  unit: string
}
interface Props {
  title: string
  type: 'doughnut' | 'line' | 'bar'
  data: ChartDataItem[]
}
const props = defineProps<Props>()
const chartContainer = ref<HTMLDivElement>()
const chartCanvas = ref<HTMLCanvasElement>()
const chart = ref<Chart | null>(null)
const selectedPeriod = ref('today')
const periods = [
  { label: 'Today', value: 'today' }
]
const chartData = ref({
  labels: props.data.map(item => item.label),
  datasets: [{
    data: props.data.map(item => item.value),
    backgroundColor: props.data.map(item => item.color),
    borderWidth: 0,
    cutout: props.type === 'doughnut' ? '70%' : undefined
  }]
})
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const item = props.data[context.dataIndex]
          return `${item.label}: ${item.value}${item.unit}`
        }
      }
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart' as const
  }
} as any)
const initChart = () => {
  if (!chartCanvas.value) return
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  if (chart.value) {
    chart.value.destroy()
  }
  try {
    chart.value = new Chart(ctx, {
      type: props.type,
      data: chartData.value,
      options: chartOptions.value
    })
  } catch (error) {
    console.error('Error initializing chart:', error)
  }
}
const updateChart = () => {
  if (!chart.value || !chartCanvas.value) {
    console.warn('Chart or canvas not available, reinitializing...')
    nextTick(() => initChart())
    return
  }
  try {
    chart.value.destroy()
    chart.value = null
    nextTick(() => {
      initChart()
    })
  } catch (error) {
    console.error('Error updating chart:', error)
    chart.value = null
    nextTick(() => {
      initChart()
    })
  }
}
watch(() => props.data, (newData) => {
  if (!newData || newData.length === 0) return
  chartData.value = {
    labels: newData.map(item => item.label),
    datasets: [{
      data: newData.map(item => item.value),
      backgroundColor: newData.map(item => item.color),
      borderWidth: 0,
      cutout: props.type === 'doughnut' ? '70%' : undefined
    }]
  }
  clearTimeout(updateChart.debounceTimer)
  updateChart.debounceTimer = setTimeout(() => {
    updateChart()
  }, 100)
}, { deep: true })
updateChart.debounceTimer = null
watch(selectedPeriod, () => {
  updateChart()
})
onMounted(() => {
  nextTick(() => {
    initChart()
  })
})
</script>
<style scoped>
.nutrition-chart {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.chart-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}
.chart-period {
  display: flex;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.25rem;
  border-radius: 8px;
}
.period-btn {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.period-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.period-btn:hover:not(.active) {
  color: #374151;
}
.chart-container {
  position: relative;
  height: 300px;
  margin-bottom: 1.5rem;
}
.chart-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 8px;
}
.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-label {
  font-size: 0.875rem;
  color: #6b7280;
  flex: 1;
}
.legend-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}
@media (max-width: 640px) {
  .chart-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  .chart-legend {
    grid-template-columns: 1fr;
  }
}
</style>