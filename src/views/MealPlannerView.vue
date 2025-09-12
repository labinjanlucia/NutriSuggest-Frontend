<template>
  <div class="meal-planner-view">
    <div class="page-header">
      <div class="header-content">
        <h1>🗓️ Meal Planner</h1>
        <p>Plan your meals for the week ahead</p>
      </div>
      <div class="header-actions">
        <button @click="showShoppingList = true" class="shopping-list-btn">
          <span>🛒</span> Shopping List
        </button>
        <router-link to="/dashboard" class="back-button">
          <span>⬅️</span> Dashboard
        </router-link>
      </div>
    </div>
    <div class="week-navigation">
      <button @click="previousWeek" class="nav-btn">
        <span>‹</span> Previous Week
      </button>
      <div class="current-week">
        <h2>{{ formatWeekRange(currentWeekStart) }}</h2>
      </div>
      <button @click="nextWeek" class="nav-btn">
        Next Week <span>›</span>
      </button>
    </div>
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading your meal plans...</div>
      </div>
    </div>
    <div v-if="successMessage && !isLoading" class="success-message">
      <div class="success-content">
        <span class="success-icon">✅</span>
        <div class="success-text">{{ successMessage }}</div>
        <button @click="clearMessages" class="close-button">×</button>
      </div>
    </div>
    <div v-if="error && !isLoading" class="error-message">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div class="error-text">{{ error }}</div>
        <button @click="loadMealPlans" class="retry-button">Try Again</button>
      </div>
    </div>
    <div class="calendar-grid" :class="{ 'loading': isLoading }">
      <div class="calendar-header">
        <div class="day-header">Time</div>
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="day-header"
          :class="{ 'today': isToday(day.date) }"
        >
          <div class="day-name">{{ day.name }}</div>
          <div class="day-date">{{ day.date }}</div>
        </div>
      </div>
      <div class="meal-row" v-for="mealType in mealTypes" :key="mealType">
        <div class="meal-label">
          <div class="meal-icon">{{ getMealIcon(mealType) }}</div>
          <div class="meal-name">{{ formatMealType(mealType) }}</div>
        </div>
        <div
          v-for="day in weekDays"
          :key="`${day.date}-${mealType}`"
          class="meal-cell"
          :class="{ 'today': isToday(day.date) }"
          @click="openAddMealModal(day.date, mealType)"
        >
          <div v-if="isLoading" class="meal-loading">
            <div class="skeleton-item" v-for="n in 2" :key="n">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-subtitle"></div>
            </div>
          </div>
          <div v-else-if="getMealPlans(day.date, mealType).length === 0" class="empty-meal">
            <span class="add-icon">+</span>
            <span class="add-text">Add meal</span>
          </div>
          <div v-else class="meal-items">
            <div
              v-for="mealPlan in getMealPlans(day.date, mealType)"
              :key="mealPlan.id"
              class="meal-item"
              :class="{
                'completed': mealPlan.is_completed,
                'smart-suggestion': isSmartSuggestion(mealPlan)
              }"
              @click.stop="toggleMealCompletion(mealPlan)"
            >
              <div class="meal-content">
                <div class="meal-name">
                  {{ getMealItemName(mealPlan) }}
                </div>
                <div class="meal-details">
                  {{ getMealItemDetails(mealPlan) }}
                </div>
                <div class="meal-nutrition">
                  {{ Math.round(mealPlan.nutrition?.calories || 0) }} cal
                </div>
              </div>
              <div class="meal-actions">
                <button
                  class="completion-btn"
                  :class="{ 'completed': mealPlan.is_completed }"
                  @click.stop="toggleMealCompletion(mealPlan)"
                >
                  {{ mealPlan.is_completed ? '✓' : '○' }}
                </button>
                <button
                  class="delete-btn"
                  @click.stop="deleteMealPlan(mealPlan)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <AddMealModal
      :show="showAddMealModal"
      :date="selectedDate"
      :meal-type="selectedMealType"
      @close="closeAddMealModal"
      @meal-added="onMealAdded"
    />
    <ShoppingListModal
      :show="showShoppingList"
      :start-date="formatDate(currentWeekStart)"
      :end-date="formatDate(getWeekEnd(currentWeekStart))"
      @close="showShoppingList = false"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNutritionStore } from '@/stores/nutrition'
import AddMealModal from '@/components/meal/AddMealModal.vue'
import ShoppingListModal from '@/components/meal/ShoppingListModal.vue'
interface MealPlan {
  id: number
  user_id: number
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_id?: number
  recipe_id?: number
  quantity_grams?: number
  servings?: number
  is_completed: boolean
  notes?: string
  food?: {
    id: number
    name: string
    brand?: string
    calories_per_100g: number
    protein_per_100g: number
    carbs_per_100g: number
    fat_per_100g: number
    fiber_per_100g?: number
  }
  recipe?: {
    id: number
    name: string
    servings: number
    instructions?: string
    prep_time_minutes?: number
  }
  nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}
interface WeekDay {
  name: string
  date: string
  fullDate: Date
}
const router = useRouter()
const authStore = useAuthStore()
const nutritionStore = useNutritionStore()
const mealPlans = ref<MealPlan[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const currentWeekStart = ref<Date>(getWeekStart(new Date()))
const showAddMealModal = ref(false)
const showShoppingList = ref(false)
const selectedDate = ref('')
const selectedMealType = ref<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack']
const weekDays = computed((): WeekDay[] => {
  const days: WeekDay[] = []
  const startDate = new Date(currentWeekStart.value)
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    days.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: formatDate(date),
      fullDate: date
    })
  }
  return days
})
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}
function getWeekEnd(startDate: Date): Date {
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  return endDate
}
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
function formatWeekRange(startDate: Date): string {
  const endDate = getWeekEnd(startDate)
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })
  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`
  } else {
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${startDate.getFullYear()}`
  }
}
function isToday(dateString: string): boolean {
  return dateString === formatDate(new Date())
}
function getMealIcon(mealType: string): string {
  const icons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎'
  }
  return icons[mealType as keyof typeof icons] || '🍽️'
}
function formatMealType(mealType: string): string {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1)
}
function getMealPlans(date: string, mealType: string): MealPlan[] {
  return mealPlans.value.filter(plan =>
    plan.date === date && plan.meal_type === mealType
  )
}
function getMealItemName(mealPlan: MealPlan): string {
  if (mealPlan.food) {
    return mealPlan.food.brand ? `${mealPlan.food.brand} ${mealPlan.food.name}` : mealPlan.food.name
  } else if (mealPlan.recipe) {
    return mealPlan.recipe.name
  }
  return 'Unknown meal'
}
function getMealItemDetails(mealPlan: MealPlan): string {
  if (mealPlan.food && mealPlan.quantity_grams) {
    return `${mealPlan.quantity_grams}g`
  } else if (mealPlan.recipe && mealPlan.servings) {
    return `${mealPlan.servings} serving${mealPlan.servings !== 1 ? 's' : ''}`
  }
  return ''
}
function isSmartSuggestion(mealPlan: MealPlan): boolean {
  return mealPlan.notes?.includes('⭐ Smart Suggestion') || false
}
function showSuccessMessage(message: string) {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}
function clearMessages() {
  error.value = null
  successMessage.value = null
}
function previousWeek() {
  const newDate = new Date(currentWeekStart.value)
  newDate.setDate(newDate.getDate() - 7)
  currentWeekStart.value = newDate
  loadMealPlans()
}
function nextWeek() {
  const newDate = new Date(currentWeekStart.value)
  newDate.setDate(newDate.getDate() + 7)
  currentWeekStart.value = newDate
  loadMealPlans()
}
function openAddMealModal(date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') {
  selectedDate.value = date
  selectedMealType.value = mealType
  showAddMealModal.value = true
}
function closeAddMealModal() {
  showAddMealModal.value = false
  selectedDate.value = ''
  selectedMealType.value = 'breakfast'
}
function onMealAdded() {
  closeAddMealModal()
  showSuccessMessage('Meal added to your plan! 🍽️')
  loadMealPlans()
}
async function loadMealPlans() {
  if (!authStore.token) return
  isLoading.value = true
  error.value = null
  try {
    const startDate = formatDate(currentWeekStart.value)
    const endDate = formatDate(getWeekEnd(currentWeekStart.value))
    const response = await fetch(`/api/meal-plans?start_date=${startDate}&end_date=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      mealPlans.value = data.data.meal_plans || []
    } else {
      throw new Error('Failed to load meal plans')
    }
  } catch (err) {
    console.error('Error loading meal plans:', err)
    error.value = 'Failed to load meal plans'
  } finally {
    isLoading.value = false
  }
}
async function toggleMealCompletion(mealPlan: MealPlan) {
  if (!authStore.token) {
    error.value = 'Authentication required. Please log in again.'
    return
  }
  const originalState = mealPlan.is_completed
  try {
    mealPlan.is_completed = !mealPlan.is_completed
    const response = await fetch(`/api/meal-plans/${mealPlan.id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        is_completed: mealPlan.is_completed
      })
    })
    if (!response.ok) {
      mealPlan.is_completed = originalState
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `Server error: ${response.status}`
      throw new Error(errorMessage)
    }
    if (mealPlan.is_completed) {
      try {
        let intakeAdded = false
        if (mealPlan.food && mealPlan.quantity_grams) {
          intakeAdded = await nutritionStore.addFoodToMeal({
            food: mealPlan.food,
            quantity_grams: mealPlan.quantity_grams,
            meal_type: mealPlan.meal_type
          })
        } else if (mealPlan.recipe && mealPlan.servings) {
          intakeAdded = await nutritionStore.addRecipeToMeal({
            recipe: mealPlan.recipe,
            servings: mealPlan.servings,
            meal_type: mealPlan.meal_type
          })
        }
        if (intakeAdded) {
          showSuccessMessage('Meal completed and added to daily nutrition! 🎉')
        } else {
          showSuccessMessage('Meal marked as completed! 🎉')
        }
      } catch (intakeError) {
        console.error('Error adding meal to nutrition intake:', intakeError)
        showSuccessMessage('Meal marked as completed! (Note: Could not add to daily nutrition)')
      }
    } else {
      showSuccessMessage('Meal marked as pending')
    }
  } catch (err: any) {
    mealPlan.is_completed = originalState
    console.error('Error updating meal completion:', err)
    error.value = err.message || 'Failed to update meal status. Please try again.'
    setTimeout(() => {
      error.value = null
    }, 5000)
  }
}
async function deleteMealPlan(mealPlan: MealPlan) {
  if (!authStore.token) {
    error.value = 'Authentication required. Please log in again.'
    return
  }
  const mealName = getMealItemName(mealPlan)
  if (!confirm(`Are you sure you want to delete "${mealName}" from your meal plan?`)) return
  const originalIndex = mealPlans.value.findIndex(plan => plan.id === mealPlan.id)
  const originalMealPlan = { ...mealPlan }
  try {
    if (originalIndex !== -1) {
      mealPlans.value.splice(originalIndex, 1)
    }
    const response = await fetch(`/api/meal-plans/${mealPlan.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (!response.ok) {
      if (originalIndex !== -1) {
        mealPlans.value.splice(originalIndex, 0, originalMealPlan)
      }
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `Server error: ${response.status}`
      throw new Error(errorMessage)
    }
    showSuccessMessage(`"${mealName}" removed from meal plan`)
  } catch (err: any) {
    if (originalIndex !== -1 && !mealPlans.value.find(plan => plan.id === mealPlan.id)) {
      mealPlans.value.splice(originalIndex, 0, originalMealPlan)
    }
    console.error('Error deleting meal plan:', err)
    error.value = err.message || 'Failed to delete meal plan. Please try again.'
    setTimeout(() => {
      error.value = null
    }, 5000)
  }
}
const handleMealPlannerRefresh = () => {
  console.log('Refreshing meal planner calendar data...')
  loadMealPlans()
  showSuccessMessage('Calendar updated with your new meal suggestion! 🎉')
}
onMounted(() => {
  loadMealPlans()
  window.addEventListener('refresh-meal-planner', handleMealPlannerRefresh)
})
onUnmounted(() => {
  window.removeEventListener('refresh-meal-planner', handleMealPlannerRefresh)
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
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.meal-planner-view {
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
  padding: 1.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
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
.shopping-list-btn, .back-button {
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
.shopping-list-btn:hover, .back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
.week-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-btn:hover {
  background: #e2e8f0;
  color: #334155;
}
.current-week h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}
.calendar-grid {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}
.calendar-header {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}
.day-header {
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: #374151;
  border-right: 1px solid #e5e7eb;
}
.day-header.today {
  background: #ddd6fe;
  color: #5b21b6;
}
.day-header:last-child {
  border-right: none;
}
.day-name {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}
.day-date {
  font-size: 1.25rem;
  font-weight: 700;
}
.meal-row {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
  border-bottom: 1px solid #f1f5f9;
  min-height: 100px;
}
.meal-row:last-child {
  border-bottom: none;
}
.meal-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #f8fafc;
  border-right: 1px solid #e5e7eb;
  gap: 0.5rem;
}
.meal-icon {
  font-size: 1.5rem;
}
.meal-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}
.meal-cell {
  border-right: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  min-height: 100px;
}
.meal-cell:hover {
  background: #f8fafc;
}
.meal-cell.today {
  background: #faf5ff;
}
.meal-cell:last-child {
  border-right: none;
}
.empty-meal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 0.875rem;
  gap: 0.25rem;
}
.add-icon {
  font-size: 1.5rem;
  font-weight: 300;
}
.meal-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.meal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}
.meal-item:hover {
  background: #f1f5f9;
  border-color: #d1d5db;
}
.meal-item.completed {
  background: #d1fae5;
  border-color: #10b981;
}
.meal-item.smart-suggestion {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  position: relative;
}
.meal-item.smart-suggestion::before {
  content: '⭐';
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.meal-item.smart-suggestion.completed {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #10b981;
}
.meal-item.smart-suggestion.completed::before {
  background: #10b981;
}
.meal-content {
  flex: 1;
}
.meal-name {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.125rem;
}
.meal-details {
  color: #6b7280;
  font-size: 0.625rem;
}
.meal-nutrition {
  color: #8b5cf6;
  font-weight: 600;
  font-size: 0.625rem;
  margin-top: 0.125rem;
}
.meal-actions {
  display: flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
}
.completion-btn, .delete-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.completion-btn {
  background: #f3f4f6;
  color: #6b7280;
}
.completion-btn.completed {
  background: #10b981;
  color: white;
}
.delete-btn {
  background: #fee2e2;
  color: #ef4444;
}
.delete-btn:hover {
  background: #fecaca;
}
@media (max-width: 1024px) {
  .calendar-grid {
    overflow-x: auto;
    min-width: 800px;
  }
  .meal-planner-view {
    padding: 1rem;
  }
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  .header-actions {
    justify-content: center;
  }
}
@media (max-width: 768px) {
  .calendar-header {
    grid-template-columns: 100px repeat(7, 120px);
  }
  .meal-row {
    grid-template-columns: 100px repeat(7, 120px);
  }
  .day-header {
    padding: 0.75rem 0.5rem;
  }
  .meal-cell {
    padding: 0.5rem;
    min-height: 80px;
  }
  .meal-item {
    font-size: 0.625rem;
    padding: 0.375rem;
  }
  .week-navigation {
    flex-direction: column;
    gap: 1rem;
  }
}
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.loading-content {
  text-align: center;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
.loading-text {
  color: #6b7280;
  font-weight: 500;
}
.calendar-grid.loading {
  opacity: 0.6;
  pointer-events: none;
}
.success-message {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  margin: 1rem 0;
  animation: fadeInUp 0.4s ease;
}
.success-content {
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 0.75rem;
}
.success-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}
.success-text {
  flex: 1;
  color: #059669;
  font-weight: 500;
}
.close-button {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-button:hover {
  background: #059669;
  transform: scale(1.1);
}
.error-message {
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin: 1rem 0;
  animation: fadeInUp 0.4s ease;
}
.error-content {
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 0.75rem;
}
.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}
.error-text {
  flex: 1;
  color: #b91c1c;
  font-weight: 500;
}
.retry-button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.retry-button:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}
.meal-loading {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
}
.skeleton-item {
  animation: pulse 1.5s infinite;
}
.skeleton-line {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  background-repeat: no-repeat;
  border-radius: 4px;
  animation: shimmer 2s infinite;
}
.skeleton-title {
  height: 12px;
  width: 80%;
  margin-bottom: 0.25rem;
}
.skeleton-subtitle {
  height: 8px;
  width: 60%;
}
.meal-item {
  animation: slideIn 0.3s ease forwards;
  transform: translateX(-10px);
  opacity: 0;
}
.meal-item:nth-child(1) { animation-delay: 0.1s; }
.meal-item:nth-child(2) { animation-delay: 0.2s; }
.meal-item:nth-child(3) { animation-delay: 0.3s; }
.empty-meal {
  transition: all 0.3s ease;
}
.empty-meal:hover {
  transform: scale(1.05);
  color: #8b5cf6;
}
.meal-cell:hover .empty-meal {
  background: rgba(139, 92, 246, 0.05);
  border-radius: 8px;
  padding: 0.5rem;
}
</style>