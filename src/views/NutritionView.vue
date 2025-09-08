<template>
  <div class="nutrition-view">
    <div class="page-header">
      <div class="header-content">
        <h1>📊 Nutrition Analysis</h1>
        <p>Detailed insights into your nutrition patterns and trends</p>
      </div>
      <div class="header-actions">
        <div class="date-selector">
          <button
            v-for="period in periods"
            :key="period.value"
            @click="selectedPeriod = period.value"
            :class="{ active: selectedPeriod === period.value }"
            class="period-btn"
          >
            {{ period.label }}
          </button>
        </div>
        <router-link to="/dashboard" class="back-button">
          ← Dashboard
        </router-link>
      </div>
    </div>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading analytics...</p>
    </div>
    <div v-else class="analytics-content">
      <div class="overview-grid">
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-content">
            <div class="stat-value">{{ overviewStats.avgCalories }}</div>
            <div class="stat-label">Avg Daily Calories</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💪</div>
          <div class="stat-content">
            <div class="stat-value">{{ overviewStats.avgProtein }}g</div>
            <div class="stat-label">Avg Daily Protein</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-value">{{ overviewStats.daysTracked }}</div>
            <div class="stat-label">Days Tracked</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ overviewStats.goalsMet }}%</div>
            <div class="stat-label">Goals Met</div>
          </div>
        </div>
      </div>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3>📈 Nutrition Trends</h3>
            <p>Your daily macro intake over time</p>
          </div>
          <div class="chart-container">
            <NutritionChart
              title="Weekly Nutrition Trends"
              type="line"
              :data="weeklyTrendData"
            />
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3>🥗 Macros Distribution</h3>
            <p>Average breakdown of your macronutrients</p>
          </div>
          <div class="chart-container">
            <NutritionChart
              title="Macros Distribution"
              type="doughnut"
              :data="macrosDistributionData"
            />
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3>⏰ Meal Patterns</h3>
            <p>When and how much you typically eat</p>
          </div>
          <div class="chart-container">
            <NutritionChart
              title="Daily Meal Distribution"
              type="bar"
              :data="mealPatternsData"
            />
          </div>
        </div>
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>📊 Progress Tracking</h3>
            <p>How well you're meeting your nutrition goals over time</p>
          </div>
          <div class="chart-container large">
            <NutritionChart
              title="Goal Achievement Over Time"
              type="line"
              :data="progressData"
            />
          </div>
        </div>
      </div>
      <div class="insights-section">
        <h2>🔍 Nutrition Insights</h2>
        <div class="insights-grid">
          <div
            v-for="insight in insights"
            :key="insight.id"
            class="insight-card"
            :class="insight.type"
          >
            <div class="insight-icon">{{ insight.icon }}</div>
            <div class="insight-content">
              <h4>{{ insight.title }}</h4>
              <p>{{ insight.description }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="actions-section">
        <h2>⚡ Quick Actions</h2>
        <div class="actions-grid">
          <button @click="exportData" class="action-card">
            <div class="action-icon">📥</div>
            <div class="action-content">
              <h4>Export Data</h4>
              <p>Download your nutrition data</p>
            </div>
          </button>
          <button @click="setGoals" class="action-card">
            <div class="action-icon">🎯</div>
            <div class="action-content">
              <h4>Update Goals</h4>
              <p>Adjust your nutrition targets</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNutritionStore } from '@/stores/nutrition'
import NutritionChart from '@/components/dashboard/NutritionChart.vue'
const router = useRouter()
const nutritionStore = useNutritionStore()
const isLoading = ref(true)
const selectedPeriod = ref('7days')
const periods = [
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: '90 Days', value: '90days' }
]
const overviewStats = computed(() => {
  const todayTotal = nutritionStore.todayTotal
  const weeklyData = nutritionStore.weeklyData
  if (!weeklyData || weeklyData.length === 0) {
    return {
      avgCalories: Math.round(todayTotal.calories || 0),
      avgProtein: Math.round(todayTotal.protein || 0),
      daysTracked: todayTotal.calories > 0 ? 1 : 0,
      goalsMet: 0
    }
  }
  const validDays = weeklyData.filter(day => day.total && day.total.calories > 0)
  const avgCalories = validDays.length > 0
    ? Math.round(validDays.reduce((sum, day) => sum + day.total.calories, 0) / validDays.length)
    : Math.round(todayTotal.calories || 0)
  const avgProtein = validDays.length > 0
    ? Math.round(validDays.reduce((sum, day) => sum + day.total.protein, 0) / validDays.length)
    : Math.round(todayTotal.protein || 0)
  const goalsMetCount = validDays.filter(day =>
    day.total.calories >= (day.targets?.calories || 2000) * 0.8
  ).length
  const goalsMet = validDays.length > 0
    ? Math.round((goalsMetCount / validDays.length) * 100)
    : 0
  return {
    avgCalories,
    avgProtein,
    daysTracked: validDays.length || (todayTotal.calories > 0 ? 1 : 0),
    goalsMet
  }
})
const weeklyTrendData = computed(() => {
  const todayTotal = nutritionStore.todayTotal
  return [
    { label: 'Calories', value: Math.round(todayTotal.calories || 0), color: '#3b82f6', unit: '' },
    { label: 'Protein', value: Math.round(todayTotal.protein || 0), color: '#10b981', unit: 'g' },
    { label: 'Carbs', value: Math.round(todayTotal.carbs || 0), color: '#f59e0b', unit: 'g' },
    { label: 'Fat', value: Math.round(todayTotal.fat || 0), color: '#ef4444', unit: 'g' }
  ]
})
const macrosDistributionData = computed(() => {
  const total = nutritionStore.todayTotal
  const proteinCals = (total.protein || 0) * 4
  const carbsCals = (total.carbs || 0) * 4
  const fatCals = (total.fat || 0) * 9
  const totalCals = proteinCals + carbsCals + fatCals
  if (totalCals === 0) {
    return [
      { label: 'Protein', value: 25, color: '#10b981', unit: '%' },
      { label: 'Carbohydrates', value: 50, color: '#f59e0b', unit: '%' },
      { label: 'Fat', value: 25, color: '#ef4444', unit: '%' }
    ]
  }
  return [
    { label: 'Protein', value: Math.round((proteinCals / totalCals) * 100), color: '#10b981', unit: '%' },
    { label: 'Carbohydrates', value: Math.round((carbsCals / totalCals) * 100), color: '#f59e0b', unit: '%' },
    { label: 'Fat', value: Math.round((fatCals / totalCals) * 100), color: '#ef4444', unit: '%' }
  ]
})
const mealPatternsData = computed(() => {
  const mealDistribution = nutritionStore.mealDistribution
  if (!mealDistribution || Object.keys(mealDistribution).length === 0) {
    return [
      { label: 'Breakfast', value: 0, color: '#fbbf24', unit: ' cal' },
      { label: 'Lunch', value: 0, color: '#34d399', unit: ' cal' },
      { label: 'Dinner', value: 0, color: '#60a5fa', unit: ' cal' },
      { label: 'Snacks', value: 0, color: '#a78bfa', unit: ' cal' }
    ]
  }
  return [
    { label: 'Breakfast', value: Math.round(mealDistribution.breakfast?.calories || 0), color: '#fbbf24', unit: ' cal' },
    { label: 'Lunch', value: Math.round(mealDistribution.lunch?.calories || 0), color: '#34d399', unit: ' cal' },
    { label: 'Dinner', value: Math.round(mealDistribution.dinner?.calories || 0), color: '#60a5fa', unit: ' cal' },
    { label: 'Snacks', value: Math.round(mealDistribution.snack?.calories || 0), color: '#a78bfa', unit: ' cal' }
  ]
})
const progressData = computed(() => {
  const todayProgress = nutritionStore.todayProgress
  return [
    { label: 'Calories', value: Math.round(todayProgress.calories || 0), color: '#3b82f6', unit: '%' },
    { label: 'Protein', value: Math.round(todayProgress.protein || 0), color: '#10b981', unit: '%' },
    { label: 'Carbs', value: Math.round(todayProgress.carbs || 0), color: '#f59e0b', unit: '%' },
    { label: 'Fat', value: Math.round(todayProgress.fat || 0), color: '#ef4444', unit: '%' }
  ]
})
const insights = computed(() => {
  const todayProgress = nutritionStore.todayProgress
  const todayTotal = nutritionStore.todayTotal
  const insights = []
  if (todayProgress.calories < 80) {
    insights.push({
      id: 'calories-low',
      type: 'warning',
      icon: '⚠️',
      title: 'Low Calorie Intake',
      description: 'You\'re consuming fewer calories than your target. Consider adding nutrient-dense foods.'
    })
  } else if (todayProgress.calories > 110) {
    insights.push({
      id: 'calories-high',
      type: 'info',
      icon: '📊',
      title: 'High Calorie Intake',
      description: 'You\'re above your calorie target. Consider portion control or lighter meals.'
    })
  } else {
    insights.push({
      id: 'calories-good',
      type: 'success',
      icon: '✅',
      title: 'Great Calorie Balance',
      description: 'Your calorie intake is well balanced with your goals!'
    })
  }
  if (todayProgress.protein < 80) {
    insights.push({
      id: 'protein-low',
      type: 'warning',
      icon: '💪',
      title: 'Increase Protein',
      description: 'Consider adding lean meats, fish, eggs, or legumes to meet your protein goals.'
    })
  } else {
    insights.push({
      id: 'protein-good',
      type: 'success',
      icon: '🥩',
      title: 'Excellent Protein',
      description: 'You\'re meeting your protein targets well. Great for muscle health!'
    })
  }
  const macroData = macrosDistributionData.value
  const proteinPercent = macroData.find(item => item.label === 'Protein')?.value || 0
  if (proteinPercent < 15) {
    insights.push({
      id: 'macro-balance',
      type: 'info',
      icon: '⚖️',
      title: 'Macro Balance',
      description: 'Try to include more protein-rich foods for better macro distribution.'
    })
  } else {
    insights.push({
      id: 'macro-balanced',
      type: 'success',
      icon: '🎯',
      title: 'Balanced Macros',
      description: 'Your macronutrient distribution looks well balanced!'
    })
  }
  return insights
})
const exportData = async () => {
  try {
    const exportButton = document.querySelector('.action-card') as HTMLButtonElement
    const exportContent = exportButton?.querySelector('.action-content h4')
    if (exportContent) {
      exportContent.textContent = 'Exporting...'
    }
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    const { get } = await import('@/api/client')
    const exportData = {
      export_info: {
        date: new Date().toISOString(),
        app: 'NutriSuggest',
        version: '1.0',
        exported_from: 'analytics_page'
      },
      account: {
        email: authStore.user?.email,
        created_at: authStore.user?.created_at
      },
      nutrition_data: {},
      weight_data: {},
      water_data: {},
      custom_foods: [],
      custom_recipes: [],
      meal_plans: []
    }
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const requests = [
      get(`/nutrition/history?start_date=${startDate}&end_date=${endDate}`).then(r => { exportData.nutrition_data = r.data }).catch(() => {}),
      get('/weight/history?limit=100').then(r => { exportData.weight_data = r.data }).catch(() => {}),
      get(`/water/weekly?startDate=${startDate}`).then(r => { exportData.water_data = r.data }).catch(() => {}),
      get('/foods/search?my_foods=true&show_public=false&limit=100').then(r => { exportData.custom_foods = r.data.data.foods || [] }).catch(() => {}),
      get('/recipes/search?my_recipes=true&show_public=false&limit=100').then(r => { exportData.custom_recipes = r.data.data.recipes || [] }).catch(() => {}),
      get(`/meal-plans?start_date=${startDate}&end_date=${endDate}`).then(r => { exportData.meal_plans = r.data.data || [] }).catch(() => {})
    ]
    await Promise.all(requests)
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nutrisuggest-complete-data-${endDate}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    alert('Complete data exported successfully!')
  } catch (error) {
    console.error('Export failed:', error)
    alert('Export failed. Please try again.')
  } finally {
    const exportContent = document.querySelector('.action-card .action-content h4')
    if (exportContent) {
      exportContent.textContent = 'Export Data'
    }
  }
}
const setGoals = () => {
  router.push('/profile#goals')
}
const loadAnalyticsData = async () => {
  isLoading.value = true
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    await nutritionStore.fetchWeeklyNutrition(startDate.toISOString().split('T')[0])
  } catch (error) {
    console.error('Error loading analytics data:', error)
  } finally {
    isLoading.value = false
  }
}
onMounted(async () => {
  await loadAnalyticsData()
})
</script>
<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.nutrition-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  animation: fadeInUp 0.6s ease;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}
.header-content h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.header-content p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.date-selector {
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.period-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.period-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
.period-btn.active {
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 500;
  transition: all 0.3s ease;
}
.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  align-items: stretch;
}
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
}
.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  background: #f8fafc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-content {
  flex: 1;
}
.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 0.25rem;
}
.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2rem;
  align-items: start;
}
.chart-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  overflow: hidden;
  min-height: 600px;
}
.chart-card.full-width {
  grid-column: 1 / -1;
}
.chart-header {
  margin-bottom: 1.5rem;
}
.chart-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}
.chart-header p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}
.chart-container {
  height: 500px;
  max-height: 520px;
  overflow: visible;
}
.chart-container.large {
  height: 550px;
  max-height: 580px;
  overflow: visible;
}
.insights-section,
.actions-section {
  margin-top: 1rem;
}
.insights-section h2,
.actions-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}
.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  align-items: start;
}
.insight-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #e5e7eb;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}
.insight-card.success {
  border-left-color: #10b981;
  background: #f0fdf4;
}
.insight-card.warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}
.insight-card.info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}
.insight-icon {
  font-size: 1.5rem;
}
.insight-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}
.insight-content p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.action-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}
.action-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.action-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  background: #f8fafc;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}
.action-content p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}
@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .chart-card {
    min-height: 520px;
  }
  .chart-container {
    height: 450px;
    max-height: 480px;
  }
  .chart-container.large {
    height: 480px;
    max-height: 520px;
  }
}
@media (max-width: 768px) {
  .nutrition-view {
    padding: 1rem;
  }
  .page-header {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
    text-align: center;
    padding: 1.5rem;
  }
  .header-content h1 {
    font-size: 2rem;
  }
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .chart-container,
  .chart-container.large {
    height: 380px;
    max-height: 400px;
  }
  .chart-card {
    min-height: 460px;
  }
  .insights-grid {
    grid-template-columns: 1fr;
  }
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-card {
    padding: 1rem;
  }
}
@media (max-width: 480px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
  .actions-grid {
    grid-template-columns: 1fr;
  }
  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }
  .insight-card {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }
  .action-card {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }
  .date-selector {
    flex-wrap: wrap;
    justify-content: center;
  }
  .page-header {
    padding: 1rem;
  }
  .header-content h1 {
    font-size: 1.8rem;
  }
  .chart-container,
  .chart-container.large {
    height: 220px;
  }
}
</style>