<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-card" @click.stop>
      <div class="modal-header">
        <h3>⚡ Quick Add</h3>
        <button @click="closeModal" class="close-button">✕</button>
      </div>
      <div class="modal-content">
        <div class="section">
          <h4>🔥 Common Foods</h4>
          <div v-if="loadingFoods" class="loading-foods">
            <div class="loading-spinner"></div>
            <p>Loading foods...</p>
          </div>
          <div v-else class="food-grid">
            <div
              v-for="food in commonFoods"
              :key="food.id"
              class="food-item"
              @click="selectFood(food)"
            >
              <div class="food-emoji">{{ food.emoji }}</div>
              <div class="food-name">{{ food.name }}</div>
              <div class="food-calories">{{ Math.round(food.calories) }}/100g</div>
            </div>
          </div>
        </div>
        <div class="section">
          <h4>⏱️ Quick Portions</h4>
          <p class="section-description">Select a food above, then choose your portion:</p>
          <div v-if="selectedFood" class="selected-food-info">
            <div class="food-preview">
              <span class="food-emoji">{{ selectedFood.emoji }}</span>
              <span class="food-name">{{ selectedFood.name }}</span>
            </div>
            <div class="portion-grid">
              <div
                v-for="portion in quickPortions"
                :key="portion.label"
                class="portion-item"
                @click="addFoodWithPortion(portion)"
                :disabled="isLoading"
              >
                <div class="portion-amount">{{ portion.grams }}g</div>
                <div class="portion-label">{{ portion.label }}</div>
                <div class="portion-calories">{{ Math.round(selectedFood.calories * portion.grams / 100) }} cal</div>
              </div>
            </div>
            <div class="meal-selector">
              <h5>Add to meal:</h5>
              <div class="meal-buttons">
                <button
                  v-for="meal in mealTypes"
                  :key="meal.value"
                  @click="selectedMealType = meal.value"
                  :class="{ active: selectedMealType === meal.value }"
                  class="meal-btn"
                >
                  <span>{{ meal.icon }}</span>
                  <span>{{ meal.label }}</span>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="select-food-prompt">
            <div class="prompt-icon">☝️</div>
            <p>Select a food above to see portion options</p>
          </div>
        </div>
      </div>
      <div class="success-message" v-if="successMessage">
        <div class="success-icon">✅</div>
        {{ successMessage }}
      </div>
      <div class="error-message" v-if="errorMessage">
        <div class="error-icon">❌</div>
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useNutritionStore } from '@/stores/nutrition'
import { foodsApi } from '@/api/endpoints/foods'
interface Props {
  isVisible: boolean
}
interface QuickFood {
  name: string
  emoji: string
  calories: number
  protein: number
  carbs: number
  fat: number
  id: number
}
interface Portion {
  label: string
  grams: number
}
const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  added: [{ food: QuickFood; grams: number; mealType: string }]
}>()
const nutritionStore = useNutritionStore()
const isLoading = ref(false)
const loadingFoods = ref(false)
const selectedFood = ref<QuickFood | null>(null)
const selectedMealType = ref('')
const successMessage = ref('')
const errorMessage = ref('')
const commonFoods = ref<QuickFood[]>([])
const foodEmojis: Record<string, string> = {
  'banana': '🍌',
  'apple': '🍎',
  'chicken': '🍗',
  'rice': '🍚',
  'salmon': '🐟',
  'yogurt': '🥛',
  'oat': '🌾',
  'avocado': '🥑',
  'egg': '🥚',
  'almond': '🥜',
  'potato': '🍠',
  'broccoli': '🥦',
  'beef': '🥩',
  'cheese': '🧀',
  'milk': '🥛',
  'bread': '🍞',
  'pasta': '🍝',
  'fish': '🐟',
  'chicken breast': '🍗'
}
const getEmojiForFood = (name: string): string => {
  const lowerName = name.toLowerCase()
  for (const [key, emoji] of Object.entries(foodEmojis)) {
    if (lowerName.includes(key)) {
      return emoji
    }
  }
  return '🍽️'
}
const quickPortions: Portion[] = [
  { label: 'Small', grams: 50 },
  { label: 'Medium', grams: 100 },
  { label: 'Large', grams: 150 },
  { label: 'XL', grams: 200 }
]
const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' }
]
const selectFood = (food: QuickFood) => {
  selectedFood.value = food
  clearMessages()
  const hour = new Date().getHours()
  if (hour < 11) {
    selectedMealType.value = 'breakfast'
  } else if (hour < 15) {
    selectedMealType.value = 'lunch'
  } else if (hour < 19) {
    selectedMealType.value = 'dinner'
  } else {
    selectedMealType.value = 'snack'
  }
}
const addFoodWithPortion = async (portion: Portion) => {
  if (!selectedFood.value || !selectedMealType.value) {
    errorMessage.value = 'Please select a meal type'
    return
  }
  isLoading.value = true
  clearMessages()
  try {
    const success = await nutritionStore.addFoodToMeal({
      food: selectedFood.value,
      quantity_grams: portion.grams,
      meal_type: selectedMealType.value
    })
    if (success) {
      const calories = Math.round(selectedFood.value.calories * portion.grams / 100)
      successMessage.value = `Added ${portion.grams}g ${selectedFood.value.name} (${calories} cal) to ${selectedMealType.value}!`
      emit('added', {
        food: selectedFood.value,
        grams: portion.grams,
        mealType: selectedMealType.value
      })
      setTimeout(() => {
        selectedFood.value = null
        clearMessages()
      }, 2000)
    } else {
      errorMessage.value = 'Failed to add food. Please try again.'
    }
  } catch (error) {
    console.error('Error adding food:', error)
    errorMessage.value = 'Error adding food. Please try again.'
  } finally {
    isLoading.value = false
  }
}
const clearMessages = () => {
  successMessage.value = ''
  errorMessage.value = ''
}
const closeModal = () => {
  if (!isLoading.value) {
    emit('close')
  }
}
const resetModal = () => {
  selectedFood.value = null
  selectedMealType.value = ''
  clearMessages()
  isLoading.value = false
}
const loadCommonFoods = async () => {
  try {
    loadingFoods.value = true
    const response = await foodsApi.searchFoods({ limit: 12 })
    if (response.success && response.data) {
      commonFoods.value = response.data.foods.map(food => ({
        id: food.id,
        name: food.name,
        emoji: getEmojiForFood(food.name),
        calories: food.calories_per_100g,
        protein: food.protein_per_100g,
        carbs: food.carbs_per_100g,
        fat: food.fat_per_100g
      }))
    }
  } catch (error) {
    console.error('Error loading common foods:', error)
    errorMessage.value = 'Could not load foods. Using limited selection.'
  } finally {
    loadingFoods.value = false
  }
}
watch(() => props.isVisible, (visible) => {
  if (visible) {
    resetModal()
    if (commonFoods.value.length === 0) {
      loadCommonFoods()
    }
  }
})
onMounted(() => {
  if (props.isVisible) {
    loadCommonFoods()
  }
})
</script>
<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
  padding: 1rem;
}
.modal-card {
  background: white;
  border-radius: 16px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  border-radius: 16px 16px 0 0;
}
.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}
.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}
.modal-content {
  padding: 0 2rem 2rem 2rem;
}
.section {
  margin-bottom: 2rem;
}
.section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.section-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
}
.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.food-item {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.food-item:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.food-emoji {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.food-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}
.food-calories {
  font-size: 0.75rem;
  color: #6b7280;
}
.selected-food-info {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}
.food-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.food-preview .food-emoji {
  font-size: 1.5rem;
  margin: 0;
}
.food-preview .food-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}
.portion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.portion-item {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.portion-item:hover:not([disabled]) {
  border-color: #10b981;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.portion-item[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
.portion-amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}
.portion-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}
.portion-calories {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 600;
}
.meal-selector h5 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}
.meal-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
}
.meal-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}
.meal-btn:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}
.meal-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
}
.select-food-prompt {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}
.prompt-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.success-message,
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  animation: slideUp 0.3s ease;
}
.success-message {
  color: #059669;
  background: #ecfdf5;
  border-top-color: #bbf7d0;
}
.error-message {
  color: #dc2626;
  background: #fef2f2;
  border-top-color: #fecaca;
}
.loading-foods {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
}
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.5rem;
}
.loading-foods p {
  margin: 0;
  font-size: 0.875rem;
}
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  .modal-header,
  .modal-content {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  .food-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .portion-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .meal-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .food-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .portion-grid {
    grid-template-columns: 1fr;
  }
  .meal-buttons {
    grid-template-columns: 1fr;
  }
}
</style>