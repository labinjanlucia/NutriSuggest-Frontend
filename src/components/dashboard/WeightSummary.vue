<template>
  <div class="weight-summary">
    <div class="widget-header">
      <h3>⚖️ Weight Progress</h3>
      <router-link to="/weight" class="view-all-link">View All</router-link>
    </div>
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading weight data...</span>
    </div>
    <div v-else-if="!analytics || analytics.totalEntries === 0" class="empty-state">
      <div class="empty-icon">⚖️</div>
      <p class="empty-message">No weight entries yet</p>
      <router-link to="/weight" class="start-tracking-btn">
        Start Tracking
      </router-link>
    </div>
    <div v-else class="weight-content">
      <div class="current-weight">
        <div class="weight-value">{{ formatWeight(analytics.latestWeight) }} kg</div>
        <div class="weight-label">Current Weight</div>
      </div>
      <div class="weight-change" :class="changeClass">
        <span class="change-icon">{{ changeIcon }}</span>
        <span class="change-value">
          {{ Math.abs(analytics.weightChange || 0).toFixed(1) }} kg
        </span>
        <span class="change-label">{{ changeLabel }}</span>
      </div>
      <div class="mini-chart" v-if="chartData.length > 1">
        <canvas ref="miniChartCanvas" width="200" height="60"></canvas>
      </div>
      <div class="quick-stats">
        <div class="stat-item">
          <span class="stat-value">{{ analytics.totalEntries }}</span>
          <span class="stat-label">Entries</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatWeight(analytics.averageWeight) }}</span>
          <span class="stat-label">Avg (kg)</span>
        </div>
      </div>
      <div class="quick-add-section">
        <form @submit.prevent="quickLogWeight" class="quick-add-form">
          <input
            type="number"
            v-model.number="quickWeight"
            step="0.1"
            min="20"
            max="500"
            placeholder="70.5"
            class="weight-input"
            :disabled="isSubmitting"
          />
          <button
            type="submit"
            class="add-btn"
            :disabled="!quickWeight || isSubmitting"
          >
            {{ isSubmitting ? '...' : 'Add' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Chart, CategoryScale, LinearScale, LineElement, PointElement, type ChartConfiguration } from 'chart.js'
Chart.register(CategoryScale, LinearScale, LineElement, PointElement)
const authStore = useAuthStore()
const isLoading = ref(true)
const isSubmitting = ref(false)
const analytics = ref<any>(null)
const quickWeight = ref<number | null>(null)
const miniChartCanvas = ref<HTMLCanvasElement>()
let miniChart: Chart | null = null
const chartData = computed(() => {
  if (!analytics.value?.chartData) return []
  return analytics.value.chartData.slice(-7)
})
const changeClass = computed(() => {
  if (!analytics.value?.weightChange) return 'neutral'
  return analytics.value.weightChange >= 0 ? 'positive' : 'negative'
})
const changeIcon = computed(() => {
  if (!analytics.value?.weightChange) return '➡️'
  return analytics.value.weightChange >= 0 ? '📈' : '📉'
})
const changeLabel = computed(() => {
  if (!analytics.value?.weightChange) return 'No change'
  return analytics.value.weightChange >= 0 ? 'Gained' : 'Lost'
})
const formatWeight = (weight: number | string | null | undefined) => {
  if (weight == null) return '0.0'
  const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight
  if (isNaN(numWeight)) return '0.0'
  return numWeight.toFixed(1)
}
const loadWeightAnalytics = async () => {
  isLoading.value = true
  try {
    const response = await fetch('http:
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      analytics.value = data.data
      nextTick(() => {
        updateMiniChart()
      })
    }
  } catch (error) {
    console.error('Error loading weight analytics:', error)
  } finally {
    isLoading.value = false
  }
}
const updateMiniChart = () => {
  if (!miniChartCanvas.value || chartData.value.length < 2) return
  if (miniChart) {
    miniChart.destroy()
  }
  const ctx = miniChartCanvas.value.getContext('2d')
  if (!ctx) return
  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels: chartData.value.map(() => ''),
      datasets: [{
        data: chartData.value.map((entry: any) => entry.weight),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        x: {
          display: false
        },
        y: {
          display: false,
          beginAtZero: false
        }
      },
      elements: {
        point: {
          radius: 0
        }
      }
    }
  }
  miniChart = new Chart(ctx, config)
}
const quickLogWeight = async () => {
  if (!quickWeight.value) return
  isSubmitting.value = true
  try {
    const response = await fetch('http:
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        weight_kg: quickWeight.value
      })
    })
    if (response.ok) {
      quickWeight.value = null
      await loadWeightAnalytics()
    }
  } catch (error) {
    console.error('Error logging weight:', error)
  } finally {
    isSubmitting.value = false
  }
}
watch(chartData, () => {
  nextTick(() => {
    updateMiniChart()
  })
})
onMounted(() => {
  loadWeightAnalytics()
})
</script>
<style scoped>
.weight-summary {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}
.widget-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
}
.widget-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}
.view-all-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}
.view-all-link:hover {
  text-decoration: underline;
}
.loading-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 0;
  justify-content: center;
  color: #6b7280;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: 2rem 0;
}
.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.empty-message {
  color: #6b7280;
  margin-bottom: 1rem;
}
.start-tracking-btn {
  display: inline-block;
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}
.start-tracking-btn:hover {
  background: #2563eb;
}
.weight-content {
  space-y: 1rem;
}
.current-weight {
  text-align: center;
  margin-bottom: 1rem;
}
.weight-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}
.weight-label {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
.weight-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.weight-change.positive {
  background: #fef3c7;
  color: #92400e;
}
.weight-change.negative {
  background: #dcfce7;
  color: #166534;
}
.weight-change.neutral {
  background: #f3f4f6;
  color: #374151;
}
.change-value {
  font-weight: 600;
}
.change-label {
  font-size: 0.875rem;
}
.mini-chart {
  height: 60px;
  margin-bottom: 1rem;
  position: relative;
}
.quick-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}
.stat-item {
  text-align: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}
.stat-value {
  display: block;
  font-weight: 600;
  color: #1f2937;
  font-size: 1.125rem;
}
.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}
.quick-add-form {
  display: flex;
  gap: 0.5rem;
}
.weight-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}
.weight-input:focus {
  outline: none;
  border-color: #3b82f6;
  ring: 1px;
  ring-color: #3b82f6;
}
.add-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.add-btn:hover:not(:disabled) {
  background: #2563eb;
}
.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>