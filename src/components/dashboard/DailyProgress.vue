<template>
  <div class="daily-progress">
    <div class="progress-header">
      <h3>Daily Progress</h3>
      <div class="date-info">
        <span>{{ formatDate(new Date()) }}</span>
      </div>
    </div>
    <div class="progress-grid">
      <div
        v-for="item in progressItems"
        :key="item.label"
        class="progress-item"
        :class="{ 'completed': item.percentage >= 100 }"
      >
        <div class="progress-info">
          <div class="progress-label">
            <span class="label-icon">{{ item.icon }}</span>
            <span class="label-text">{{ item.label }}</span>
          </div>
          <div class="progress-values">
            <span class="current-value">{{ item.current }}</span>
            <span class="separator">/</span>
            <span class="target-value">{{ item.target }} {{ item.unit }}</span>
          </div>
        </div>
        <div class="progress-bar-container">
          <div
            class="progress-bar"
            :style="{ backgroundColor: item.color + '20' }"
          >
            <div
              class="progress-fill"
              :style="{
                width: Math.min(item.percentage, 100) + '%',
                backgroundColor: item.color,
                animationDelay: item.animationDelay + 'ms'
              }"
            ></div>
          </div>
          <div class="progress-percentage">
            <span
              :style="{ color: item.color }"
              class="percentage-value"
            >
              {{ Math.round(item.percentage) }}%
            </span>
          </div>
        </div>
        <div class="progress-status">
          <div
            v-if="item.percentage >= 100"
            class="status-badge completed"
          >
            ✓ Goal reached!
          </div>
          <div
            v-else-if="item.percentage >= 80"
            class="status-badge almost"
          >
            Almost there!
          </div>
          <div
            v-else-if="item.percentage >= 50"
            class="status-badge halfway"
          >
            Halfway there
          </div>
          <div
            v-else
            class="status-badge start"
          >
            Keep going!
          </div>
        </div>
      </div>
    </div>
    <div class="daily-summary">
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-label">Goals completed</span>
          <span class="stat-value">{{ completedGoals }}/{{ progressItems.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Average progress</span>
          <span class="stat-value">{{ averageProgress }}%</span>
        </div>
      </div>
      <div class="summary-actions">
        <button @click="logMeal" class="action-btn log-meal">
          <span>📝</span>
          Log Meal
        </button>
        <button @click="quickAdd" class="action-btn quick-add">
          <span>⚡</span>
          Quick Add
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
interface ProgressItem {
  label: string
  icon: string
  current: number
  target: number
  unit: string
  color: string
  percentage: number
  animationDelay: number
}
interface Props {
  calories: { current: number; target: number }
  protein: { current: number; target: number }
  carbs: { current: number; target: number }
  fat: { current: number; target: number }
}
const props = withDefaults(defineProps<Props>(), {
  calories: () => ({ current: 0, target: 2000 }),
  protein: () => ({ current: 0, target: 150 }),
  carbs: () => ({ current: 0, target: 250 }),
  fat: () => ({ current: 0, target: 67 })
})
const progressItems = computed<ProgressItem[]>(() => [
  {
    label: 'Calories',
    icon: '🔥',
    current: props.calories.current,
    target: props.calories.target,
    unit: 'kcal',
    color: '#ef4444',
    percentage: (props.calories.current / props.calories.target) * 100,
    animationDelay: 0
  },
  {
    label: 'Protein',
    icon: '💪',
    current: props.protein.current,
    target: props.protein.target,
    unit: 'g',
    color: '#3b82f6',
    percentage: (props.protein.current / props.protein.target) * 100,
    animationDelay: 200
  },
  {
    label: 'Carbs',
    icon: '🌾',
    current: props.carbs.current,
    target: props.carbs.target,
    unit: 'g',
    color: '#f59e0b',
    percentage: (props.carbs.current / props.carbs.target) * 100,
    animationDelay: 400
  },
  {
    label: 'Fat',
    icon: '🥑',
    current: props.fat.current,
    target: props.fat.target,
    unit: 'g',
    color: '#10b981',
    percentage: (props.fat.current / props.fat.target) * 100,
    animationDelay: 600
  }
])
const completedGoals = computed(() => {
  return progressItems.value.filter(item => item.percentage >= 100).length
})
const averageProgress = computed(() => {
  const totalProgress = progressItems.value.reduce((sum, item) => sum + item.percentage, 0)
  return Math.round(totalProgress / progressItems.value.length)
})
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
const router = useRouter()
const emit = defineEmits<{
  quickAdd: []
}>()
const logMeal = () => {
  router.push('/foods')
}
const quickAdd = () => {
  emit('quickAdd')
}
</script>
<style scoped>
@keyframes fillProgress {
  from { width: 0%; }
  to { width: 100%; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes bounce {
  0%, 20%, 60%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  80% { transform: translateY(-5px); }
}
.daily-progress {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  animation: fadeInUp 0.6s ease;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.progress-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}
.date-info {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}
.progress-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.progress-item {
  padding: 1rem;
  background: #fafbfc;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease;
}
.progress-item.completed {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border-color: #10b981;
}
.progress-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.progress-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.label-icon {
  font-size: 1.25rem;
}
.label-text {
  font-weight: 600;
  color: #374151;
}
.progress-values {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}
.current-value {
  font-weight: 700;
  color: #1f2937;
}
.separator {
  color: #9ca3af;
}
.target-value {
  color: #6b7280;
}
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.progress-bar {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}
.progress-fill {
  height: 100%;
  border-radius: 4px;
  position: relative;
  transition: width 0.8s ease-out;
}
.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: -2px;
  bottom: 0;
  width: 4px;
  background: white;
  border-radius: 2px;
}
.progress-percentage {
  min-width: 48px;
  text-align: right;
}
.percentage-value {
  font-size: 0.875rem;
  font-weight: 700;
}
.progress-status {
  display: flex;
  justify-content: flex-end;
}
.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-badge.completed {
  background: #dcfce7;
  color: #166534;
  animation: bounce 0.6s ease;
}
.status-badge.almost {
  background: #fef3c7;
  color: #92400e;
}
.status-badge.halfway {
  background: #dbeafe;
  color: #1e40af;
}
.status-badge.start {
  background: #f3f4f6;
  color: #6b7280;
}
.daily-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}
.summary-stats {
  display: flex;
  gap: 1.5rem;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}
.summary-actions {
  display: flex;
  gap: 0.5rem;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.action-btn:hover {
  background: #f8fafc;
  border-color: #d1d5db;
  transform: translateY(-1px);
}
.action-btn span {
  font-size: 1rem;
}
@media (max-width: 640px) {
  .daily-summary {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  .summary-stats {
    justify-content: space-around;
  }
  .summary-actions {
    justify-content: center;
  }
}
</style>