<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-card" @click.stop>
      <div class="modal-header">
        <h3>{{ recipe.name }}</h3>
        <button @click="closeModal" class="close-button">✕</button>
      </div>
      <div class="recipe-hero">
        <div class="recipe-emoji">{{ getRecipeEmoji(recipe.name) }}</div>
        <div class="recipe-basic-info">
          <p v-if="recipe.description" class="recipe-description">{{ recipe.description }}</p>
          <div class="recipe-stats">
            <div class="stat-item">
              <span class="stat-icon">🍽️</span>
              <span class="stat-label">{{ recipe.servings }} servings</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">🔥</span>
              <span class="stat-label">{{ Math.round(recipe.calories_per_serving || 0) }} cal/serving</span>
            </div>
            <div v-if="recipe.prep_time_minutes" class="stat-item">
              <span class="stat-icon">⏱️</span>
              <span class="stat-label">{{ recipe.prep_time_minutes }} min prep</span>
            </div>
            <div v-if="recipe.cook_time_minutes" class="stat-item">
              <span class="stat-icon">🔥</span>
              <span class="stat-label">{{ recipe.cook_time_minutes }} min cook</span>
            </div>
          </div>
        </div>
      </div>
      <div class="recipe-content">
        <div class="ingredients-section">
          <h4>📋 Ingredients</h4>
          <div v-if="recipe.ingredients && recipe.ingredients.length > 0" class="ingredients-list">
            <div
              v-for="ingredient in recipe.ingredients"
              :key="ingredient.id"
              class="ingredient-item"
            >
              <div class="ingredient-amount">
                {{ formatIngredientAmount(ingredient.quantity_grams) }}
              </div>
              <div class="ingredient-name">
                {{ ingredient.food?.name || 'Unknown ingredient' }}
              </div>
            </div>
          </div>
          <div v-else class="no-ingredients">
            <p>No ingredients listed for this recipe.</p>
          </div>
        </div>
        <div class="instructions-section">
          <h4>👩‍🍳 Instructions</h4>
          <div v-if="recipe.instructions" class="instructions-content">
            <div class="instructions-text">{{ recipe.instructions }}</div>
          </div>
          <div v-else class="no-instructions">
            <p>No cooking instructions provided.</p>
          </div>
        </div>
        <div v-if="nutritionData && nutritionData.per_serving" class="nutrition-section">
          <h4>📊 Nutrition per serving</h4>
          <div class="nutrition-grid">
            <div class="nutrition-item calories">
              <div class="nutrition-value">{{ Math.round(nutritionData.per_serving.calories || 0) }}</div>
              <div class="nutrition-label">calories</div>
            </div>
            <div class="nutrition-item">
              <div class="nutrition-value">{{ Math.round((nutritionData.per_serving.protein || 0) * 10) / 10 }}g</div>
              <div class="nutrition-label">protein</div>
            </div>
            <div class="nutrition-item">
              <div class="nutrition-value">{{ Math.round((nutritionData.per_serving.carbs || 0) * 10) / 10 }}g</div>
              <div class="nutrition-label">carbs</div>
            </div>
            <div class="nutrition-item">
              <div class="nutrition-value">{{ Math.round((nutritionData.per_serving.fat || 0) * 10) / 10 }}g</div>
              <div class="nutrition-label">fat</div>
            </div>
          </div>
        </div>
        <div class="add-to-meal-section">
          <h4>🍽️ Add to Meal</h4>
          <div class="servings-selector">
            <label for="servings">Number of servings:</label>
            <div class="servings-input">
              <button @click="adjustServings(-0.5)" :disabled="selectedServings <= 0.5" class="adjust-btn">-</button>
              <input
                id="servings"
                v-model.number="selectedServings"
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                class="servings-input-field"
              />
              <button @click="adjustServings(0.5)" :disabled="selectedServings >= 10" class="adjust-btn">+</button>
            </div>
          </div>
          <div class="calculated-nutrition" v-if="nutritionData && nutritionData.per_serving">
            <h5>Nutrition for {{ selectedServings }} serving(s):</h5>
            <div class="calc-nutrition-row">
              <span>{{ Math.round((nutritionData.per_serving.calories || 0) * selectedServings) }} calories</span>
              <span>{{ Math.round((nutritionData.per_serving.protein || 0) * selectedServings * 10) / 10 }}g protein</span>
              <span>{{ Math.round((nutritionData.per_serving.carbs || 0) * selectedServings * 10) / 10 }}g carbs</span>
              <span>{{ Math.round((nutritionData.per_serving.fat || 0) * selectedServings * 10) / 10 }}g fat</span>
            </div>
          </div>
          <div class="meal-type-selector">
            <label>Add to meal:</label>
            <div class="meal-buttons">
              <button
                v-for="mealType in mealTypes"
                :key="mealType.value"
                @click="selectedMealType = mealType.value"
                :class="{ active: selectedMealType === mealType.value }"
                class="meal-btn"
              >
                <span>{{ mealType.icon }}</span>
                <span>{{ mealType.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button @click="closeModal" class="btn btn-secondary">Close</button>
        <button
          @click="addToMeal"
          :disabled="!selectedMealType || selectedServings <= 0"
          class="btn btn-primary"
        >
          Add to {{ selectedMealType || 'Meal' }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { recipesApi } from '@/api/endpoints/recipes'
import type { Recipe } from '@/types'
interface Props {
  recipe: Recipe
  isVisible: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  addToMeal: [{ recipe: Recipe; servings: number; mealType: string }]
}>()
const selectedServings = ref(1)
const selectedMealType = ref('')
const nutritionData = ref<any>(null)
const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' }
]
const getRecipeEmoji = (name: string): string => {
  const lowerName = name.toLowerCase()
  const emojiMap: Record<string, string> = {
    salad: '🥗', pasta: '🍝', soup: '🍲', chicken: '🍗', fish: '🐟',
    beef: '🥩', pork: '🥓', rice: '🍚', bread: '🍞', cake: '🍰',
    cookie: '🍪', pizza: '🍕', burger: '🍔', sandwich: '🥪', taco: '🌮',
    curry: '🍛', stir: '🥘', grill: '🔥', bake: '👨‍🍳', smoothie: '🥤',
    juice: '🧃', tea: '🍵', coffee: '☕'
  }
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerName.includes(key)) return emoji
  }
  return '🍽️'
}
const formatIngredientAmount = (grams: number): string => {
  if (grams < 5) {
    return `${grams}g`
  } else if (grams < 1000) {
    return `${Math.round(grams)}g`
  } else {
    return `${Math.round(grams / 100) / 10}kg`
  }
}
const adjustServings = (amount: number) => {
  const newValue = selectedServings.value + amount
  if (newValue >= 0.5 && newValue <= 10) {
    selectedServings.value = Math.round(newValue * 2) / 2
  }
}
const loadNutritionData = async () => {
  try {
    const response = await recipesApi.getRecipeNutrition(props.recipe.id, selectedServings.value)
    if (response.success && response.data) {
      nutritionData.value = response.data.nutrition
    }
  } catch (error) {
    console.error('Error loading nutrition data:', error)
  }
}
const setDefaultMealType = () => {
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
const closeModal = () => {
  emit('close')
}
const addToMeal = () => {
  if (selectedMealType.value && selectedServings.value > 0) {
    emit('addToMeal', {
      recipe: props.recipe,
      servings: selectedServings.value,
      mealType: selectedMealType.value
    })
  }
}
watch(() => props.isVisible, (visible) => {
  if (visible) {
    selectedServings.value = 1
    setDefaultMealType()
    loadNutritionData()
  }
})
onMounted(() => {
  if (props.isVisible) {
    setDefaultMealType()
    loadNutritionData()
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.3;
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
.recipe-hero {
  padding: 2rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  display: flex;
  align-items: center;
  gap: 2rem;
}
.recipe-emoji {
  font-size: 4rem;
  background: rgba(255, 255, 255, 0.2);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.recipe-basic-info {
  flex: 1;
}
.recipe-description {
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  opacity: 0.9;
  line-height: 1.5;
}
.recipe-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}
.stat-icon {
  font-size: 1rem;
}
.recipe-content {
  padding: 2rem;
}
.recipe-content > div {
  margin-bottom: 2rem;
}
.recipe-content h4 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.ingredients-list {
  display: grid;
  gap: 0.75rem;
}
.ingredient-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}
.ingredient-amount {
  font-weight: 700;
  color: #3b82f6;
  min-width: 60px;
  text-align: right;
}
.ingredient-name {
  flex: 1;
  color: #374151;
  font-weight: 600;
  font-size: 0.95rem;
}
.instructions-content {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}
.instructions-text {
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
}
.no-ingredients,
.no-instructions {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  background: #f8fafc;
  border-radius: 8px;
}
.nutrition-section {
  background: #f0fdf4;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #bbf7d0;
}
.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}
.nutrition-item {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.nutrition-item.calories {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.nutrition-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  display: block;
  margin-bottom: 0.25rem;
}
.nutrition-item.calories .nutrition-value {
  color: #1d4ed8;
}
.nutrition-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
.add-to-meal-section {
  background: #fffbeb;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #fed7aa;
}
.servings-selector {
  margin-bottom: 1.5rem;
}
.servings-selector label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}
.servings-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.adjust-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 1.25rem;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}
.adjust-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}
.adjust-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.servings-input-field {
  width: 80px;
  padding: 0.75rem;
  text-align: center;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
}
.servings-input-field:focus {
  outline: none;
  border-color: #3b82f6;
}
.calculated-nutrition h5 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}
.calc-nutrition-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}
.meal-type-selector {
  margin-top: 1.5rem;
}
.meal-type-selector label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}
.meal-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}
.meal-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
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
.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  position: sticky;
  bottom: 0;
  background: white;
  border-radius: 0 0 16px 16px;
}
.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-secondary {
  background: #f8fafc;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.btn-secondary:hover {
  background: #f1f5f9;
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
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  .recipe-hero {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }
  .recipe-emoji {
    width: 80px;
    height: 80px;
    font-size: 3rem;
  }
  .recipe-stats {
    justify-content: center;
  }
  .recipe-content {
    padding: 1.5rem;
  }
  .nutrition-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .servings-input {
    justify-content: center;
  }
  .calc-nutrition-row {
    justify-content: center;
    text-align: center;
  }
  .meal-buttons {
    grid-template-columns: 1fr;
  }
  .modal-actions {
    flex-direction: column;
  }
}
</style>