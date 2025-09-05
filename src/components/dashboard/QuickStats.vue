<template>
  <div class="quick-stats">
    <div class="stats-header">
      <h3>Quick Stats</h3>
      <div class="refresh-btn" @click="refreshStats">
        <span class="refresh-icon" :class="{ 'spinning': isRefreshing }">🔄</span>
      </div>
    </div>
    <div class="stats-grid">
      <div
        v-for="(stat, index) in stats"
        :key="stat.label"
        class="stat-card"
        :style="{ animationDelay: index * 100 + 'ms' }"
      >
        <div class="stat-icon-container">
          <div class="stat-icon" :style="{ backgroundColor: stat.color + '20', color: stat.color }">
            {{ stat.icon }}
          </div>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            <span class="value-number">{{ formatNumber(stat.value) }}</span>
            <span class="value-unit">{{ stat.unit }}</span>
          </div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-trend">
            <span
              class="trend-indicator"
              :class="{ 'positive': stat.trend > 0, 'negative': stat.trend < 0, 'neutral': stat.trend === 0 }"
            >
              {{ getTrendIcon(stat.trend) }}
            </span>
            <span class="trend-text">
              {{ Math.abs(stat.trend) }}% {{ getTrendText(stat.trend) }}
            </span>
          </div>
        </div>
        <div class="stat-visual">
          <div
            v-if="stat.type === 'progress'"
            class="mini-progress"
          >
            <div
              class="mini-progress-fill"
              :style="{
                width: stat.progress + '%',
                backgroundColor: stat.color,
                animationDelay: (index * 100 + 500) + 'ms'
              }"
            ></div>
          </div>
          <div
            v-else-if="stat.type === 'streak'"
            class="streak-indicator"
          >
            <span
              v-for="day in 7"
              :key="day"
              class="streak-day"
              :class="{ 'active': day <= (stat.streakDays || 0) }"
            ></span>
          </div>
        </div>
      </div>
    </div>
    <div class="weekly-summary">
      <h4>This Week</h4>
      <div class="weekly-stats">
        <div class="weekly-stat">
          <span class="weekly-label">Avg. Calories</span>
          <span class="weekly-value">{{ formatNumber(weeklyStats.avgCalories) }}</span>
        </div>
        <div class="weekly-stat">
          <span class="weekly-label">Days Logged</span>
          <span class="weekly-value">{{ weeklyStats.daysLogged }}/7</span>
        </div>
        <div class="weekly-stat">
          <span class="weekly-label">Goals Met</span>
          <span class="weekly-value">{{ weeklyStats.goalsMet }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNutritionStore } from '@/stores/nutrition'
interface Stat {
  label: string
  icon: string
  value: number
  unit: string
  color: string
  trend: number
  type: 'progress' | 'streak' | 'simple'
  progress?: number
  streakDays?: number
}
interface Props {
  todayCalories: number
  todayProtein: number
  waterGlasses: number
  currentStreak: number
}
const props = withDefaults(defineProps<Props>(), {
  todayCalories: 0,
  todayProtein: 0,
  waterGlasses: 0,
  currentStreak: 0
})
const nutritionStore = useNutritionStore()
const isRefreshing = ref(false)
const stats = computed<Stat[]>(() => [
  {
    label: 'Today\'s Calories',
    icon: '🔥',
    value: props.todayCalories,
    unit: 'kcal',
    color: '#ef4444',
    trend: 0,
    type: 'progress',
    progress: (props.todayCalories / 2000) * 100
  },
  {
    label: 'Protein Intake',
    icon: '💪',
    value: props.todayProtein,
    unit: 'g',
    color: '#3b82f6',
    trend: 0,
    type: 'progress',
    progress: (props.todayProtein / 150) * 100
  },
  {
    label: 'Water Intake',
    icon: '💧',
    value: props.waterGlasses,
    unit: 'glasses',
    color: '#06b6d4',
    trend: 0,
    type: 'progress',
    progress: (props.waterGlasses / 8) * 100
  },
  {
    label: 'Current Streak',
    icon: '🔥',
    value: props.currentStreak,
    unit: 'days',
    color: '#f59e0b',
    trend: 0,
    type: 'streak',
    streakDays: Math.min(props.currentStreak, 7)
  },
])
const weeklyStats = computed(() => {
  const weeklyData = nutritionStore.weeklyData
  if (!weeklyData || weeklyData.length === 0) {
    return {
      avgCalories: 0,
      daysLogged: 0,
      goalsMet: 0
    }
  }
  const daysWithData = weeklyData.filter(day => day.total && day.total.calories > 0)
  const totalCalories = daysWithData.reduce((sum, day) => sum + (day.total?.calories || 0), 0)
  const avgCalories = daysWithData.length > 0 ? Math.round(totalCalories / daysWithData.length) : 0
  const daysLogged = daysWithData.length
  let goalsMetCount = 0
  daysWithData.forEach(day => {
    if (day.total && day.targets) {
      const caloriesProgress = (day.total.calories / day.targets.calories) * 100
      const proteinProgress = (day.total.protein / day.targets.protein) * 100
      const carbsProgress = (day.total.carbs / day.targets.carbs) * 100
      const fatProgress = (day.total.fat / day.targets.fat) * 100
      if (caloriesProgress >= 80 && proteinProgress >= 80 && carbsProgress >= 80 && fatProgress >= 80) {
        goalsMetCount++
      }
    }
  })
  const goalsMet = daysWithData.length > 0 ? Math.round((goalsMetCount / daysWithData.length) * 100) : 0
  return {
    avgCalories,
    daysLogged,
    goalsMet
  }
})
const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toFixed(0)
}
const getTrendIcon = (trend: number) => {
  if (trend > 0) return '↗️'
  if (trend < 0) return '↘️'
  return '➡️'
}
const getTrendText = (trend: number) => {
  if (trend > 0) return 'from last week'
  if (trend < 0) return 'from last week'
  return 'no change'
}
const refreshStats = async () => {
  isRefreshing.value = true
  try {
    const today = new Date()
    const mondayOfWeek = new Date(today)
    mondayOfWeek.setDate(today.getDate() - today.getDay() + 1)
    const startDate = mondayOfWeek.toISOString().split('T')[0]
    await nutritionStore.fetchWeeklyNutrition(startDate)
  } catch (error) {
    console.error('Error refreshing weekly stats:', error)
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 1000)
  }
}
onMounted(async () => {
  const today = new Date()
  const mondayOfWeek = new Date(today)
  mondayOfWeek.setDate(today.getDate() - today.getDay() + 1)
  const startDate = mondayOfWeek.toISOString().split('T')[0]
  await nutritionStore.fetchWeeklyNutrition(startDate)
})
</script>
<style scoped>
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@keyframes fillMini {
  from { width: 0%; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.quick-stats {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.stats-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}
.refresh-btn {
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.refresh-btn:hover {
  background: #f3f4f6;
}
.refresh-icon {
  font-size: 1.25rem;
  display: inline-block;
  transition: transform 0.3s ease;
}
.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #fafbfc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  animation: fadeInScale 0.6s ease both;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  background: white;
}
.stat-icon-container {
  flex-shrink: 0;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
}
.stat-content {
  flex: 1;
  min-width: 0;
}
.stat-value {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}
.value-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1f2937;
}
.value-unit {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}
.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.5rem;
}
.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
}
.trend-indicator {
  font-size: 0.875rem;
}
.trend-text {
  color: #6b7280;
  font-weight: 500;
}
.trend-indicator.positive {
  color: #10b981;
}
.trend-indicator.negative {
  color: #ef4444;
}
.trend-indicator.neutral {
  color: #6b7280;
}
.stat-visual {
  flex-shrink: 0;
  width: 60px;
}
.mini-progress {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}
.mini-progress-fill {
  height: 100%;
  border-radius: 2px;
  animation: fillMini 1s ease-out forwards;
}
.streak-indicator {
  display: flex;
  gap: 2px;
  justify-content: center;
}
.streak-day {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e5e7eb;
  transition: all 0.3s ease;
}
.streak-day.active {
  background: #f59e0b;
  animation: pulse 2s infinite;
}
.weekly-summary {
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}
.weekly-summary h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}
.weekly-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.weekly-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}
.weekly-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.weekly-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .stat-card {
    padding: 1rem;
  }
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
  .value-number {
    font-size: 1.25rem;
  }
  .weekly-stats {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
@media (max-width: 480px) {
  .stats-grid {
    gap: 1rem;
  }
  .stat-visual {
    width: 50px;
  }
}
</style>