<template>
  <div class="weight-view">
    <div class="page-header">
      <div class="header-content">
        <h1>⚖️ Weight Tracking</h1>
        <p>Track your daily weight and monitor your progress over time</p>
      </div>
      <div class="header-actions">
        <router-link to="/dashboard" class="back-button">
          <span>⬅️</span> Dashboard
        </router-link>
      </div>
    </div>
    <div class="weight-entry-section">
      <h2>📝 Log Weight Entry</h2>
      <form @submit.prevent="logWeight" class="weight-entry-form">
        <div class="form-group">
          <label for="date">Date</label>
          <input
            type="date"
            id="date"
            v-model="weightForm.date"
            :max="todayDate"
            required
          />
          <small class="form-help">Weight entries cannot be added for future dates</small>
        </div>
        <div class="form-group">
          <label for="weight">Weight (kg)</label>
          <input
            type="number"
            id="weight"
            v-model.number="weightForm.weight_kg"
            step="0.1"
            min="20"
            max="500"
            placeholder="70.5"
            required
          />
        </div>
        <div class="form-group">
          <label for="notes">Notes (optional)</label>
          <input
            type="text"
            id="notes"
            v-model="weightForm.notes"
            placeholder="Morning, after workout..."
          />
        </div>
        <button
          type="submit"
          :disabled="isLoading"
          class="log-weight-btn"
        >
          <span v-if="isLoading">⏳ Saving...</span>
          <span v-else>✅ Log Weight</span>
        </button>
      </form>
    </div>
    <div v-if="analytics && analytics.totalEntries > 0" class="analytics-section">
      <h2>📊 Weight Analytics</h2>
      <div class="analytics-grid">
        <div class="analytics-card">
          <h3>Current Weight</h3>
          <p class="stat-value current">{{ formatWeight(analytics.latestWeight) }} kg</p>
        </div>
        <div class="analytics-card">
          <h3>Total Change</h3>
          <p class="stat-value" :class="getChangeColorClass(analytics.weightChange)">
            {{ formatWeightChange(analytics.weightChange) }} kg
          </p>
        </div>
        <div class="analytics-card">
          <h3>Total Entries</h3>
          <p class="stat-value entries">{{ analytics.totalEntries || 0 }}</p>
        </div>
      </div>
    </div>
    <div v-if="analytics && analytics.chartData?.length > 0" class="chart-section">
      <h2>📈 Weight Progress Chart</h2>
      <div class="chart-container">
        <canvas ref="chartCanvas" width="400" height="200"></canvas>
      </div>
    </div>
    <div class="recent-entries-section">
      <h2>🕐 Recent Entries</h2>
      <div v-if="weightHistory.length === 0" class="empty-state">
        <div class="empty-icon">⚖️</div>
        <p class="empty-message">No weight entries yet.</p>
        <p class="empty-submessage">Start tracking your weight to see your progress!</p>
      </div>
      <div v-else class="entries-list">
        <div
          v-for="entry in weightHistory"
          :key="entry.date"
          class="entry-item"
        >
          <div class="entry-info">
            <div class="entry-date">{{ formatDate(entry.date) }}</div>
            <div v-if="entry.notes" class="entry-notes">{{ entry.notes }}</div>
          </div>
          <div class="entry-actions">
            <span class="entry-weight">{{ entry.weight_kg }} kg</span>
            <button
              @click="deleteEntry(entry.date)"
              class="delete-btn"
              title="Delete entry"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Chart, CategoryScale, LinearScale, LineElement, PointElement, LineController, Title, Tooltip, Legend, type ChartConfiguration } from 'chart.js'
Chart.register(CategoryScale, LinearScale, LineElement, PointElement, LineController, Title, Tooltip, Legend)
const authStore = useAuthStore()
const isLoading = ref(false)
const weightHistory = ref<any[]>([])
const analytics = ref<any>(null)
const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null
const weightForm = ref({
  date: new Date().toISOString().split('T')[0],
  weight_kg: null as number | null,
  notes: ''
})
const todayDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
const formatWeight = (weight: number | string | null | undefined) => {
  if (weight == null) return '0.0'
  const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight
  if (isNaN(numWeight)) return '0.0'
  return numWeight.toFixed(1)
}
const formatWeightChange = (change: number | null | undefined) => {
  if (change == null) return '0.0'
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}`
}
const getChangeColorClass = (change: number | null | undefined) => {
  if (change == null) return 'text-gray-600'
  return change >= 0 ? 'text-green-600' : 'text-red-600'
}
const logWeight = async () => {
  if (!weightForm.value.weight_kg) return
  const selectedDate = new Date(weightForm.value.date)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (selectedDate > today) {
    alert('Weight entries cannot be added for future dates. Please select today or a past date.')
    return
  }
  isLoading.value = true
  try {
    const response = await fetch('' + import.meta.env.VITE_API_URL + '/weights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(weightForm.value)
    })
    if (response.ok) {
      weightForm.value = {
        date: new Date().toISOString().split('T')[0],
        weight_kg: null,
        notes: ''
      }
      await loadWeightData()
    } else {
      console.error('Failed to log weight')
    }
  } catch (error) {
    console.error('Error logging weight:', error)
  } finally {
    isLoading.value = false
  }
}
const loadWeightHistory = async () => {
  try {
    const response = await fetch('' + import.meta.env.VITE_API_URL + '/weights', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      weightHistory.value = data.data.weightEntries
    }
  } catch (error) {
    console.error('Error loading weight history:', error)
  }
}
const loadWeightAnalytics = async () => {
  try {
    const response = await fetch('' + import.meta.env.VITE_API_URL + '/weights/analytics', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      analytics.value = data.data
      nextTick(() => {
        updateChart()
      })
    }
  } catch (error) {
    console.error('Error loading weight analytics:', error)
  }
}
const updateChart = () => {
  if (!chartCanvas.value || !analytics.value?.chartData?.length) return
  if (chart) {
    chart.destroy()
  }
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  const chartData = analytics.value.chartData.slice(-30)
  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels: chartData.map((entry: any) => new Date(entry.date).toLocaleDateString()),
      datasets: [{
        label: 'Weight (kg)',
        data: chartData.map((entry: any) => entry.weight),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Weight (kg)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      }
    }
  }
  chart = new Chart(ctx, config)
}
const deleteEntry = async (date: string) => {
  if (!confirm('Are you sure you want to delete this weight entry?')) return
  try {
    const response = await fetch(`/api/weights/${date}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      await loadWeightData()
    } else {
      console.error('Failed to delete weight entry')
    }
  } catch (error) {
    console.error('Error deleting weight entry:', error)
  }
}
const loadWeightData = async () => {
  await Promise.all([
    loadWeightHistory(),
    loadWeightAnalytics()
  ])
}
onMounted(async () => {
  await loadWeightData()
})
</script>
<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
.weight-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 4rem);
  background-color: #f9fafb;
  animation: fadeInUp 0.6s ease;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
}
.header-content h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.header-content p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}
.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}
.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
.weight-entry-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  animation: slideIn 0.6s ease;
}
.weight-entry-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}
.weight-entry-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  align-items: end;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}
.form-group input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  color: #111827;
  transition: all 0.2s ease;
}
.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.form-help {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}
.log-weight-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
.log-weight-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}
.log-weight-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
.analytics-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  animation: slideIn 0.6s ease;
}
.analytics-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}
.analytics-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}
.analytics-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.analytics-card h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}
.stat-value {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  line-height: 1;
}
.stat-value.current {
  color: #3b82f6;
}
.stat-value.average {
  color: #6b7280;
}
.stat-value.entries {
  color: #8b5cf6;
}
.stat-value.text-green-600 {
  color: #059669;
}
.stat-value.text-red-600 {
  color: #dc2626;
}
.stat-value.text-gray-600 {
  color: #6b7280;
}
.chart-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  animation: slideIn 0.6s ease;
}
.chart-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}
.recent-entries-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  animation: slideIn 0.6s ease;
}
.recent-entries-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}
.empty-state {
  text-align: center;
  padding: 3rem 0;
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.empty-message {
  color: #6b7280;
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}
.empty-submessage {
  color: #9ca3af;
  margin: 0;
}
.entries-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.entry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}
.entry-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}
.entry-info {
  flex: 1;
}
.entry-date {
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
}
.entry-notes {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
.entry-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.entry-weight {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}
.delete-btn {
  color: #dc2626;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}
.delete-btn:hover {
  background: #fef2f2;
  color: #b91c1c;
}
@media (max-width: 768px) {
  .weight-view {
    padding: 1rem;
  }
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  .header-content h1 {
    font-size: 1.75rem;
  }
  .weight-entry-form {
    grid-template-columns: 1fr;
  }
  .analytics-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }
  .chart-container {
    height: 250px;
  }
  .entry-item {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  .entry-actions {
    justify-content: center;
  }
}
@media (max-width: 480px) {
  .analytics-grid {
    grid-template-columns: 1fr 1fr;
  }
  .analytics-card {
    padding: 1rem;
  }
  .stat-value {
    font-size: 1.5rem;
  }
}
</style>