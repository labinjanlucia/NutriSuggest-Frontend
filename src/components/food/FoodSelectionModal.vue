<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-card" @click.stop>
      <div class="modal-header">
        <h3>Add {{ food.name }} to Meal</h3>
        <button @click="closeModal" class="close-button">✕</button>
      </div>
      <div class="food-info">
        <div class="food-details">
          <h4>{{ food.name }}</h4>
          <p v-if="food.brand" class="food-brand">{{ food.brand }}</p>
          <div class="nutrition-preview">
            <div class="nutrition-item">
              <span class="nutrition-label">Calories</span>
              <span class="nutrition-value">{{ food.calories_per_100g }}/100g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Protein</span>
              <span class="nutrition-value">{{ food.protein_per_100g }}g/100g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Carbs</span>
              <span class="nutrition-value">{{ food.carbs_per_100g }}g/100g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Fat</span>
              <span class="nutrition-value">{{ food.fat_per_100g }}g/100g</span>
            </div>
          </div>
        </div>
      </div>
      <div class="quantity-section">
        <h4>Serving Size</h4>
        <div class="quantity-input-group">
          <label for="quantity">Quantity (grams)</label>
          <input
            id="quantity"
            v-model.number="quantity"
            type="number"
            min="1"
            max="1000"
            step="1"
            class="quantity-input"
            @input="updateCalculatedNutrition"
          />
        </div>
        <div class="common-portions">
          <span class="portions-label">Common portions:</span>
          <button
            v-for="portion in commonPortions"
            :key="portion.label"
            @click="setQuantity(portion.grams)"
            class="portion-btn"
            :class="{ active: quantity === portion.grams }"
          >
            {{ portion.label }}
          </button>
        </div>
      </div>
      <div class="calculated-nutrition">
        <h4>Nutrition for {{ quantity }}g</h4>
        <div class="calculated-grid">
          <div class="calc-item calories">
            <span class="calc-value">{{ calculatedNutrition.calories }}</span>
            <span class="calc-label">calories</span>
          </div>
          <div class="calc-item">
            <span class="calc-value">{{ calculatedNutrition.protein }}g</span>
            <span class="calc-label">protein</span>
          </div>
          <div class="calc-item">
            <span class="calc-value">{{ calculatedNutrition.carbs }}g</span>
            <span class="calc-label">carbs</span>
          </div>
          <div class="calc-item">
            <span class="calc-value">{{ calculatedNutrition.fat }}g</span>
            <span class="calc-label">fat</span>
          </div>
        </div>
      </div>
      <div class="meal-selection">
        <h4>Add to Meal</h4>
        <div class="meal-buttons">
          <button
            v-for="mealType in mealTypes"
            :key="mealType.value"
            @click="selectedMeal = mealType.value"
            class="meal-btn"
            :class="{ active: selectedMeal === mealType.value }"
          >
            <span class="meal-icon">{{ mealType.icon }}</span>
            <span class="meal-label">{{ mealType.label }}</span>
          </button>
        </div>
      </div>
      <div class="modal-actions">
        <button @click="closeModal" class="btn btn-secondary">Cancel</button>
        <button
          @click="addToMeal"
          :disabled="isLoading || !selectedMeal || quantity <= 0"
          class="btn btn-primary"
        >
          <div v-if="isLoading" class="loading-spinner"></div>
          {{ isLoading ? 'Adding...' : 'Add to Meal' }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useNutritionStore } from '@/stores/nutrition'
interface Food {
  id: number
  name: string
  brand?: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
}
interface Props {
  isVisible: boolean
  food: Food
}
const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  added: [{ food: Food; quantity: number; mealType: string }]
}>()
const nutritionStore = useNutritionStore()
const quantity = ref(100)
const selectedMeal = ref('')
const isLoading = ref(false)
const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { value: 'lunch', label: 'Lunch', icon: '🍲' },
  { value: 'dinner', label: 'Dinner', icon: '🍽️' },
  { value: 'snack', label: 'Snack', icon: '🍎' }
]
const commonPortions = [
  { label: '50g', grams: 50 },
  { label: '100g', grams: 100 },
  { label: '150g', grams: 150 },
  { label: '200g', grams: 200 }
]
const calculatedNutrition = computed(() => {
  const multiplier = quantity.value / 100
  return {
    calories: Math.round(props.food.calories_per_100g * multiplier),
    protein: Math.round(props.food.protein_per_100g * multiplier * 10) / 10,
    carbs: Math.round(props.food.carbs_per_100g * multiplier * 10) / 10,
    fat: Math.round(props.food.fat_per_100g * multiplier * 10) / 10
  }
})
const setQuantity = (grams: number) => {
  quantity.value = grams
}
const updateCalculatedNutrition = () => {
}
const closeModal = () => {
  emit('close')
}
const addToMeal = async () => {
  if (!selectedMeal.value || quantity.value <= 0) return
  isLoading.value = true
  try {
    await nutritionStore.addFoodToMeal({
      food: props.food,
      quantity_grams: quantity.value,
      meal_type: selectedMeal.value
    })
    emit('added', {
      food: props.food,
      quantity: quantity.value,
      mealType: selectedMeal.value
    })
    closeModal()
  } catch (error) {
    console.error('Error adding food to meal:', error)
  } finally {
    isLoading.value = false
  }
}
const setDefaultMeal = () => {
  const hour = new Date().getHours()
  if (hour < 11) {
    selectedMeal.value = 'breakfast'
  } else if (hour < 15) {
    selectedMeal.value = 'lunch'
  } else if (hour < 19) {
    selectedMeal.value = 'dinner'
  } else {
    selectedMeal.value = 'snack'
  }
}
watch(() => props.isVisible, (visible) => {
  if (visible) {
    quantity.value = 100
    setDefaultMeal()
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
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
}
.modal-card {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
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
.food-info {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f3f4f6;
}
.food-details h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}
.food-brand {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}
.nutrition-preview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
.nutrition-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}
.nutrition-label {
  font-size: 0.875rem;
  color: #6b7280;
}
.nutrition-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}
.quantity-section {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f3f4f6;
}
.quantity-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}
.quantity-input-group {
  margin-bottom: 1rem;
}
.quantity-input-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}
.quantity-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}
.quantity-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.common-portions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.portions-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-right: 0.5rem;
}
.portion-btn {
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.portion-btn:hover {
  background: #e5e7eb;
}
.portion-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
.calculated-nutrition {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f3f4f6;
  background: #f8fafc;
}
.calculated-nutrition h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}
.calculated-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
.calc-item {
  text-align: center;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.calc-item.calories {
  grid-column: 1 / -1;
  background: #eff6ff;
  border-color: #bfdbfe;
}
.calc-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}
.calc-item.calories .calc-value {
  color: #1d4ed8;
  font-size: 1.5rem;
}
.calc-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.meal-selection {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f3f4f6;
}
.meal-selection h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}
.meal-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
.meal-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.meal-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}
.meal-btn.active {
  background: #eff6ff;
  border-color: #3b82f6;
}
.meal-icon {
  font-size: 1.5rem;
}
.meal-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
}
.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.btn-secondary {
  background: #f8fafc;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.btn-secondary:hover {
  background: #f3f4f6;
}
.btn-primary {
  background: #3b82f6;
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff40;
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@media (max-width: 640px) {
  .modal-card {
    margin: 1rem;
    width: calc(100% - 2rem);
  }
  .modal-header, .food-info, .quantity-section, .calculated-nutrition, .meal-selection, .modal-actions {
    padding: 1rem 1.5rem;
  }
  .nutrition-preview, .calculated-grid {
    grid-template-columns: 1fr;
  }
  .meal-buttons {
    grid-template-columns: 1fr;
  }
}
</style>