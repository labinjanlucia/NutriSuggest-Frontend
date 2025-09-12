<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="welcome-section">
        <h1>Welcome back, {{ getUserName() }}! 🙋‍♂️</h1>
        <p>Here's your nutrition overview for {{ formatDate(new Date()) }}</p>
      </div>
      <div class="header-actions">
        <button @click="refreshData" class="refresh-btn" :disabled="isLoading">
          <span class="refresh-icon" :class="{ 'spinning': isLoading }">🔄</span>
          Refresh
        </button>
        <div class="streak-badge">
          <span class="streak-icon">🔥</span>
          <span class="streak-text">{{ currentStreak }} day streak</span>
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="loading-container">
      <LoadingSpinner text="Loading your nutrition data..." />
    </div>
    <div v-else-if="nutritionStore.error" class="error-container">
      <div class="error-message">
        {{ nutritionStore.error }}
        <button @click="refreshData" class="retry-button">Try Again</button>
      </div>
    </div>
    <div v-else class="dashboard-content">
      <div class="dashboard-grid">
        <div class="main-content">
          <DailyProgress
            :calories="{ current: nutritionStore.todayTotal.calories, target: nutritionStore.todayTargets.calories }"
            :protein="{ current: nutritionStore.todayTotal.protein, target: nutritionStore.todayTargets.protein }"
            :carbs="{ current: nutritionStore.todayTotal.carbs, target: nutritionStore.todayTargets.carbs }"
            :fat="{ current: nutritionStore.todayTotal.fat, target: nutritionStore.todayTargets.fat }"
            @quick-add="showQuickAdd = true"
          />
          <NutritionChart
            title="Today's Macros"
            type="doughnut"
            :data="macroChartData"
          />
          <div class="meals-section">
            <div class="section-header">
              <h2>🍽️ Today's Meals</h2>
              <div class="quick-actions">
                <button @click="showQuickAdd = true" class="action-button primary">
                  <span>⚡</span> Quick Add
                </button>
                <router-link to="/foods" class="action-button">
                  <span>🍎</span> Add Food
                </router-link>
                <router-link to="/recipes" class="action-button">
                  <span>📝</span> Add Recipe
                </router-link>
              </div>
            </div>
            <div v-if="nutritionStore.todayIntakes.length === 0" class="empty-state">
              <div class="empty-animation">
                <div class="empty-icon">🍽️</div>
                <div class="empty-sparkles">✨</div>
              </div>
              <h3>No meals logged today</h3>
              <p>Start tracking your nutrition journey by adding your first meal!</p>
              <div class="empty-actions">
                <button @click="showQuickAdd = true" class="get-started-button primary">
                  ⚡ Quick Start
                </button>
                <router-link to="/foods" class="get-started-button">
                  🔍 Browse Foods
                </router-link>
              </div>
            </div>
            <div v-else class="meals-timeline">
              <div class="timeline-line"></div>
              <div
                v-for="(intake, index) in nutritionStore.todayIntakes"
                :key="intake.id"
                class="meal-card"
                :style="{ animationDelay: index * 100 + 'ms' }"
              >
                <div class="timeline-dot"></div>
                <div class="meal-header">
                  <div class="meal-info">
                    <div class="meal-icon-container">
                      <span class="meal-icon">
                        {{ getMealIcon(intake.meal_type) }}
                      </span>
                    </div>
                    <div class="meal-details">
                      <h4>{{ formatMealType(intake.meal_type) }}</h4>
                      <span class="meal-time">
                        {{ formatTime(intake.consumed_at) }}
                      </span>
                      <div class="meal-calories">
                        {{ calculateMealCalories(intake) }} kcal
                      </div>
                    </div>
                  </div>
                  <button @click="deleteIntake(intake.id)" class="delete-button" title="Delete meal">
                    🗑️
                  </button>
                </div>
                <div class="meal-items">
                  <div v-for="item in intake.items" :key="item.id" class="meal-item">
                    <div class="item-info">
                      <span class="item-name">
                        {{ item.food?.name || item.recipe?.name }}
                      </span>
                      <span class="item-type">
                        {{ item.food ? 'Food' : 'Recipe' }}
                      </span>
                    </div>
                    <span class="item-quantity">
                      {{ item.quantity_grams }}g
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="sidebar">
          <QuickStats
            :today-calories="nutritionStore.todayTotal.calories"
            :today-protein="nutritionStore.todayTotal.protein"
            :water-glasses="waterGlasses"
            :current-streak="currentStreak"
          />
          <WeightSummary />
          <div class="quick-actions-panel">
            <h3>🚀 Quick Actions</h3>
            <div class="actions-grid">
              <button @click="logWater" class="quick-action-btn water">
                <span class="action-icon">💧</span>
                <div class="action-content">
                  <span class="action-label">Log Water</span>
                  <span class="action-value">{{ todayWaterData.amount }}ml / {{ todayWaterData.goal }}ml</span>
                  <div class="water-progress-bar">
                    <div
                      class="water-progress-fill"
                      :style="{ width: Math.min((todayWaterData.amount / todayWaterData.goal) * 100, 100) + '%' }"
                    ></div>
                  </div>
                  <span class="progress-percentage">{{ Math.round((todayWaterData.amount / todayWaterData.goal) * 100) }}%</span>
                </div>
              </button>
              <button @click="weighIn" class="quick-action-btn weight">
                <span class="action-icon">⚖️</span>
                <span class="action-label">Weigh In</span>
                <span class="action-value">Log Today</span>
              </button>
              <router-link to="/nutrition" class="quick-action-btn analytics">
                <span class="action-icon">📈</span>
                <span class="action-label">View Trends</span>
                <span class="action-value">Analytics</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
    <QuickAddModal
      :is-visible="showQuickAdd"
      @close="showQuickAdd = false"
      @added="onQuickFoodAdded"
    />
    <WaterLogModal
      :show="showWaterModal"
      :today-amount="todayWaterData.amount"
      :water-goal="todayWaterData.goal"
      :today-entries="todayWaterData.entries"
      @close="showWaterModal = false"
      @addWater="addWater"
      @removeEntry="removeWaterEntry"
    />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNutritionStore } from '@/stores/nutrition'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import DailyProgress from '@/components/dashboard/DailyProgress.vue'
import NutritionChart from '@/components/dashboard/NutritionChart.vue'
import QuickStats from '@/components/dashboard/QuickStats.vue'
import WeightSummary from '@/components/dashboard/WeightSummary.vue'
import QuickAddModal from '@/components/dashboard/QuickAddModal.vue'
import WaterLogModal from '@/components/dashboard/WaterLogModal.vue'
const router = useRouter()
const authStore = useAuthStore()
const nutritionStore = useNutritionStore()
const showQuickAdd = ref(false)
const showWaterModal = ref(false)
const isLoading = ref(false)
const waterGlasses = ref(0)
const currentStreak = ref(0)
const todayWaterData = ref({
  amount: 0,
  goal: 2000,
  entries: [] as Array<{ id: number, amount: number, logged_at: string }>
})
const macroChartData = computed(() => {
  const totals = nutritionStore.todayTotal
  return [
    {
      label: 'Protein',
      value: Math.max(0, totals.protein || 0),
      color: '#3b82f6',
      unit: 'g'
    },
    {
      label: 'Carbs',
      value: Math.max(0, totals.carbs || 0),
      color: '#f59e0b',
      unit: 'g'
    },
    {
      label: 'Fat',
      value: Math.max(0, totals.fat || 0),
      color: '#10b981',
      unit: 'g'
    }
  ]
})
const getUserName = () => {
  const email = authStore.user?.email
  if (!email) return 'User'
  return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
}
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}
const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}
const formatMealType = (mealType: string) => {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1)
}
const getMealIcon = (mealType: string) => {
  const icons: Record<string, string> = {
    breakfast: '🍳',
    lunch: '🍲',
    dinner: '🍽️',
    snack: '🍎'
  }
  return icons[mealType] || '🍽️'
}
const calculateMealCalories = (intake: any) => {
  if (!intake?.items) return 0
  return intake.items.reduce((total: number, item: any) => {
    const calories = item.food
      ? (item.food.calories_per_100g * item.quantity_grams / 100)
      : 0
    return total + calories
  }, 0)
}
const refreshData = async () => {
  isLoading.value = true
  await nutritionStore.fetchTodayNutrition()
  isLoading.value = false
}
const deleteIntake = async (intakeId: number) => {
  if (confirm('Are you sure you want to delete this meal entry?')) {
    await nutritionStore.deleteIntake(intakeId)
  }
}
const logWater = () => {
  showWaterModal.value = true
}
const addWater = async (amount: number) => {
  try {
    const response = await fetch('' + import.meta.env.VITE_API_URL + '/water/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        amount_ml: amount,
        date: new Date().toISOString().split('T')[0]
      })
    })
    if (response.ok) {
      await fetchWaterData()
    }
  } catch (error) {
    console.error('Error logging water:', error)
  }
}
const removeWaterEntry = async (id: number) => {
  try {
    const response = await fetch(`/api/water/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      await fetchWaterData()
    }
  } catch (error) {
    console.error('Error removing water entry:', error)
  }
}
const fetchWaterData = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const response = await fetch(`/api/water/daily?date=${today}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      todayWaterData.value = {
        amount: data.data.total_ml,
        goal: data.data.target_ml,
        entries: data.data.intakes
      }
      waterGlasses.value = Math.floor(data.data.total_ml / 250)
    }
  } catch (error) {
    console.error('Error fetching water data:', error)
  }
}
const weighIn = () => {
  router.push('/weight')
}
const onQuickFoodAdded = (data: { food: any; grams: number; mealType: string }) => {
  console.log('Quick food added:', data)
}
onMounted(async () => {
  await nutritionStore.initialize()
  await calculateStreak()
  await fetchWaterData()
})
const calculateStreak = async () => {
  try {
    const today = new Date()
    let streak = 0
    let currentDate = new Date(today)
    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      try {
        if (i === 0 && nutritionStore.todayIntakes.length > 0) {
          streak++
        } else if (i === 0 && nutritionStore.todayIntakes.length === 0) {
          break
        } else {
          break
        }
      } catch (error) {
        break
      }
      currentDate.setDate(currentDate.getDate() - 1)
    }
    currentStreak.value = streak
  } catch (error) {
    console.error('Error calculating streak:', error)
    currentStreak.value = 0
  }
}
</script>
<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes bounce {
  0%, 20%, 60%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  80% { transform: translateY(-5px); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  animation: fadeInUp 0.6s ease;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}
.welcome-section h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.welcome-section p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}
.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}
.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
.refresh-icon {
  font-size: 1rem;
  transition: transform 0.3s ease;
}
.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}
.streak-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.streak-icon {
  font-size: 1.25rem;
  animation: pulse 2s infinite;
}
.streak-text {
  font-weight: 600;
  font-size: 0.875rem;
}
.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
.error-message {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 500;
}
.retry-button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}
.retry-button:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
  align-items: start;
}
.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: sticky;
  top: 2rem;
}
.meals-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}
.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}
.quick-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: #374151;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}
.action-button.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
}
.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.action-button.primary:hover {
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
  animation: fadeInUp 0.6s ease;
}
.empty-animation {
  position: relative;
  display: inline-block;
  margin-bottom: 2rem;
}
.empty-icon {
  font-size: 4rem;
  animation: bounce 2s infinite;
}
.empty-sparkles {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 1.5rem;
  animation: pulse 2s infinite;
}
.empty-state h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
}
.empty-state p {
  color: #6b7280;
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
}
.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.get-started-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  font-size: 1rem;
}
.get-started-button.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}
.get-started-button:not(.primary) {
  background: white;
  color: #374151;
  border: 2px solid #e5e7eb;
}
.get-started-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.get-started-button.primary:hover {
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}
.meals-timeline {
  position: relative;
  padding-left: 2rem;
}
.timeline-line {
  position: absolute;
  left: 1rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 1px;
}
.meal-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  animation: slideInLeft 0.6s ease both;
}
.meal-card:hover {
  transform: translateX(4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.timeline-dot {
  position: absolute;
  left: -2.25rem;
  top: 1.5rem;
  width: 12px;
  height: 12px;
  background: white;
  border: 3px solid #3b82f6;
  border-radius: 50%;
  z-index: 1;
}
.meal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.meal-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}
.meal-icon-container {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #bfdbfe;
}
.meal-icon {
  font-size: 1.5rem;
}
.meal-details h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}
.meal-time {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  display: block;
  margin-bottom: 0.25rem;
}
.meal-calories {
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 600;
  background: #eff6ff;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  display: inline-block;
}
.delete-button {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #dc2626;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.delete-button:hover {
  background: #fecaca;
  transform: scale(1.1);
}
.meal-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}
.meal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}
.meal-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}
.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.item-name {
  color: #1f2937;
  font-weight: 600;
  font-size: 0.95rem;
}
.item-type {
  color: #6b7280;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}
.item-quantity {
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 700;
  background: #eff6ff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
.quick-actions-panel {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}
.quick-actions-panel h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
}
.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  background: #fafbfc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  text-decoration: none;
  color: #374151;
  transition: all 0.3s ease;
  cursor: pointer;
  text-align: center;
}
.quick-action-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.quick-action-btn.water {
  border-left: 4px solid #06b6d4;
}
.quick-action-btn.weight {
  border-left: 4px solid #10b981;
}
.quick-action-btn.analytics {
  border-left: 4px solid #8b5cf6;
}
.action-icon {
  font-size: 1.5rem;
}
.action-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}
.action-value {
  font-size: 0.75rem;
  color: #6b7280;
}
.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
}
.water-progress-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin: 0.25rem 0;
}
.water-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #0891b2);
  border-radius: 2px;
  transition: width 0.6s ease;
}
.progress-percentage {
  font-size: 0.625rem;
  color: #0891b2;
  font-weight: 600;
}
@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .sidebar {
    position: static;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  .welcome-section h1 {
    font-size: 1.75rem;
  }
  .sidebar {
    grid-template-columns: 1fr;
  }
  .meals-timeline {
    padding-left: 1rem;
  }
  .timeline-line {
    left: 0.5rem;
  }
  .timeline-dot {
    left: -0.25rem;
  }
  .actions-grid {
    grid-template-columns: 1fr;
  }
  .empty-actions {
    flex-direction: column;
    align-items: center;
  }
}
@media (max-width: 480px) {
  .quick-actions {
    justify-content: center;
  }
  .action-button {
    flex: 1;
    min-width: auto;
    justify-content: center;
  }
  .meal-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  .delete-button {
    align-self: flex-end;
  }
}
</style>