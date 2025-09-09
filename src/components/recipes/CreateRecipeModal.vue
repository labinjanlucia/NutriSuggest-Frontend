<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-card" @click.stop>
      <div class="modal-header">
        <h3>Create New Recipe</h3>
        <button @click="closeModal" class="close-button">✕</button>
      </div>
      <form @submit.prevent="createRecipe" class="recipe-form">
        <div class="form-section">
          <h4>📝 Recipe Details</h4>
          <div class="form-group">
            <label for="recipeName">Recipe Name *</label>
            <input
              id="recipeName"
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="e.g., Healthy Chicken Salad"
              required
            />
          </div>
          <div class="form-group">
            <label for="recipeDescription">Description</label>
            <textarea
              id="recipeDescription"
              v-model="formData.description"
              class="form-textarea"
              placeholder="Tell us about this recipe..."
              rows="3"
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="servings">Servings *</label>
              <input
                id="servings"
                v-model.number="formData.servings"
                type="number"
                min="1"
                max="20"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label for="prepTime">Prep Time (minutes)</label>
              <input
                id="prepTime"
                v-model.number="formData.prep_time_minutes"
                type="number"
                min="0"
                max="480"
                class="form-input"
                placeholder="30"
              />
            </div>
            <div class="form-group">
              <label for="cookTime">Cook Time (minutes)</label>
              <input
                id="cookTime"
                v-model.number="formData.cook_time_minutes"
                type="number"
                min="0"
                max="480"
                class="form-input"
                placeholder="20"
              />
            </div>
          </div>
          <div class="form-group">
            <label>Recipe Visibility</label>
            <div class="visibility-toggle">
              <label class="toggle-option" :class="{ active: !formData.is_public }">
                <input type="radio" :value="false" v-model="formData.is_public"/>
                <div class="toggle-content">
                  <div class="toggle-icon">🔒</div>
                  <div class="toggle-info">
                    <span class="toggle-title">Private</span>
                    <span class="toggle-subtitle">Only you can see this recipe</span>
                  </div>
                </div>
              </label>
              <label class="toggle-option" :class="{ active: formData.is_public }">
                <input type="radio" :value="true" v-model="formData.is_public"/>
                <div class="toggle-content">
                  <div class="toggle-icon">🌍</div>
                  <div class="toggle-info">
                    <span class="toggle-title">Public</span>
                    <span class="toggle-subtitle">Share with the community</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="form-section">
          <h4>🥗 Ingredients</h4>
          <div class="ingredients-section">
            <div
              v-for="(ingredient, index) in formData.ingredients"
              :key="index"
              class="ingredient-row"
            >
              <div class="ingredient-search">
                <input
                  v-model="ingredient.searchQuery"
                  @input="searchIngredient(index)"
                  type="text"
                  class="form-input"
                  :placeholder="`Search ingredient ${index + 1}...`"
                />
                <div v-if="ingredient.searchResults && ingredient.searchResults.length > 0" class="search-results">
                  <div
                    v-for="food in ingredient.searchResults"
                    :key="food.id"
                    class="search-result-item"
                    @click="selectIngredient(index, food)"
                  >
                    {{ food.name }} ({{ food.calories_per_100g }} cal/100g)
                  </div>
                </div>
              </div>
              <div class="ingredient-amount">
                <input
                  v-model.number="ingredient.quantity_grams"
                  type="number"
                  min="1"
                  max="2000"
                  class="form-input"
                  placeholder="Amount (g)"
                />
              </div>
              <button
                type="button"
                @click="removeIngredient(index)"
                :disabled="formData.ingredients.length <= 1"
                class="remove-ingredient-btn"
              >
                🗑️
              </button>
            </div>
            <button
              type="button"
              @click="addIngredient"
              class="add-ingredient-btn"
            >
              ➕ Add Ingredient
            </button>
          </div>
        </div>
        <div class="form-section">
          <h4>👩‍🍳 Instructions</h4>
          <div class="form-group">
            <label for="instructions">Cooking Instructions</label>
            <textarea
              id="instructions"
              v-model="formData.instructions"
              class="form-textarea"
              placeholder="1. Preheat oven to 350°F...&#10;2. Mix ingredients in a bowl...&#10;3. Bake for 30 minutes..."
              rows="6"
            ></textarea>
          </div>
        </div>
        <div v-if="hasValidIngredients" class="nutrition-preview">
          <h4>📊 Estimated Nutrition (per serving)</h4>
          <div class="nutrition-grid">
            <div class="nutrition-item calories">
              <div class="nutrition-value">{{ estimatedNutrition.calories }}</div>
              <div class="nutrition-label">calories</div>
            </div>
            <div class="nutrition-item">
              <div class="nutrition-value">{{ estimatedNutrition.protein }}g</div>
              <div class="nutrition-label">protein</div>
            </div>
            <div class="nutrition-item">
              <div class="nutrition-value">{{ estimatedNutrition.carbs }}g</div>
              <div class="nutrition-label">carbs</div>
            </div>
            <div class="nutrition-item">
              <div class="nutrition-value">{{ estimatedNutrition.fat }}g</div>
              <div class="nutrition-label">fat</div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" @click="closeModal" class="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isLoading || !isFormValid"
            class="btn btn-primary"
          >
            <div v-if="isLoading" class="loading-spinner"></div>
            {{ isLoading ? 'Creating...' : 'Create Recipe' }}
          </button>
        </div>
      </form>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { recipesApi } from '@/api/endpoints/recipes'
import { foodsApi } from '@/api/endpoints/foods'
import type { Recipe, Food } from '@/types'
interface Props {
  isVisible: boolean
}
interface IngredientForm {
  searchQuery: string
  food_id?: number
  food?: Food
  quantity_grams: number
  searchResults?: Food[]
}
const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  created: [recipe: Recipe]
}>()
const isLoading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const formData = ref({
  name: '',
  description: '',
  servings: 4,
  prep_time_minutes: null as number | null,
  cook_time_minutes: null as number | null,
  instructions: '',
  is_public: false,
  ingredients: [
    {
      searchQuery: '',
      food_id: undefined,
      food: undefined,
      quantity_grams: 100,
      searchResults: []
    }
  ] as IngredientForm[]
})
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 &&
         formData.value.servings > 0 &&
         formData.value.ingredients.some(ing => ing.food_id && ing.quantity_grams > 0)
})
const hasValidIngredients = computed(() => {
  return formData.value.ingredients.some(ing => ing.food && ing.quantity_grams > 0)
})
const estimatedNutrition = computed(() => {
  let totalCalories = 0
  let totalProtein = 0
  let totalCarbs = 0
  let totalFat = 0
  formData.value.ingredients.forEach(ingredient => {
    if (ingredient.food && ingredient.quantity_grams > 0) {
      const multiplier = ingredient.quantity_grams / 100
      totalCalories += ingredient.food.calories_per_100g * multiplier
      totalProtein += ingredient.food.protein_per_100g * multiplier
      totalCarbs += ingredient.food.carbs_per_100g * multiplier
      totalFat += ingredient.food.fat_per_100g * multiplier
    }
  })
  const servings = formData.value.servings || 1
  return {
    calories: Math.round(totalCalories / servings),
    protein: Math.round((totalProtein / servings) * 10) / 10,
    carbs: Math.round((totalCarbs / servings) * 10) / 10,
    fat: Math.round((totalFat / servings) * 10) / 10
  }
})
const searchIngredient = async (index: number) => {
  const ingredient = formData.value.ingredients[index]
  if (ingredient.searchQuery.length < 2) {
    ingredient.searchResults = []
    return
  }
  try {
    const response = await foodsApi.searchFoods({
      q: ingredient.searchQuery,
      limit: 5
    })
    if (response.success) {
      ingredient.searchResults = response.data.foods || []
    } else {
      ingredient.searchResults = []
    }
  } catch (error) {
    console.error('Error searching ingredients:', error)
    ingredient.searchResults = []
  }
}
const selectIngredient = (index: number, food: Food) => {
  const ingredient = formData.value.ingredients[index]
  ingredient.food_id = food.id
  ingredient.food = food
  ingredient.searchQuery = food.name
  ingredient.searchResults = []
}
const addIngredient = () => {
  formData.value.ingredients.push({
    searchQuery: '',
    food_id: undefined,
    food: undefined,
    quantity_grams: 100,
    searchResults: []
  })
}
const removeIngredient = (index: number) => {
  if (formData.value.ingredients.length > 1) {
    formData.value.ingredients.splice(index, 1)
  }
}
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    servings: 4,
    prep_time_minutes: null,
    cook_time_minutes: null,
    instructions: '',
    is_public: false,
    ingredients: [
      {
        searchQuery: '',
        food_id: undefined,
        food: undefined,
        quantity_grams: 100,
        searchResults: []
      }
    ]
  }
  error.value = null
  successMessage.value = null
}
const closeModal = () => {
  if (!isLoading.value) {
    emit('close')
  }
}
const createRecipe = async () => {
  if (!isFormValid.value || isLoading.value) return
  isLoading.value = true
  error.value = null
  successMessage.value = null
  try {
    const ingredients = formData.value.ingredients
      .filter(ing => ing.food_id && ing.quantity_grams > 0)
      .map(ing => ({
        food_id: ing.food_id!,
        quantity_grams: ing.quantity_grams
      }))
    const recipeData = {
      name: formData.value.name.trim(),
      description: formData.value.description.trim() || undefined,
      servings: formData.value.servings,
      prep_time_minutes: formData.value.prep_time_minutes || undefined,
      cook_time_minutes: formData.value.cook_time_minutes || undefined,
      instructions: formData.value.instructions.trim() || undefined,
      is_public: formData.value.is_public,
      ingredients
    }
    const response = await recipesApi.createRecipe(recipeData)
    if (response.success && response.data?.recipe) {
      successMessage.value = `Successfully created "${response.data.recipe.name}"!`
      emit('created', response.data.recipe)
      setTimeout(() => {
        closeModal()
      }, 1500)
    } else {
      error.value = 'Failed to create recipe. Please try again.'
    }
  } catch (err: any) {
    console.error('Error creating recipe:', err)
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Failed to create recipe. Please check your input and try again.'
    }
  } finally {
    isLoading.value = false
  }
}
watch(() => props.isVisible, (visible) => {
  if (visible) {
    resetForm()
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
  padding: 1rem;
}
.modal-card {
  background: white;
  border-radius: 16px;
  max-width: 800px;
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
.recipe-form {
  padding: 0 2rem 2rem 2rem;
}
.form-section {
  margin-bottom: 2rem;
}
.form-section h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}
.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}
.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background: white;
}
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.form-textarea {
  resize: vertical;
  min-height: 100px;
}
.visibility-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.5rem;
}
.toggle-option {
  position: relative;
  cursor: pointer;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  background: #f9fafb;
  transition: all 0.2s ease;
  overflow: hidden;
}
.toggle-option:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}
.toggle-option.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.toggle-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.toggle-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}
.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.toggle-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}
.toggle-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.2;
}
.ingredients-section {
  space-y: 1rem;
}
.ingredient-row {
  display: grid;
  grid-template-columns: 1fr 120px 40px;
  gap: 1rem;
  align-items: start;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.ingredient-search {
  position: relative;
}
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.search-result-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}
.search-result-item:hover {
  background: #f8fafc;
}
.search-result-item:last-child {
  border-bottom: none;
}
.remove-ingredient-btn {
  width: 40px;
  height: 40px;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.remove-ingredient-btn:hover:not(:disabled) {
  background: #fecaca;
}
.remove-ingredient-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.add-ingredient-btn {
  background: #eff6ff;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  width: 100%;
}
.add-ingredient-btn:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}
.nutrition-preview {
  background: #f0fdf4;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #bbf7d0;
  margin-bottom: 1.5rem;
}
.nutrition-preview h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #166534;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}
.nutrition-item {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.nutrition-item.calories {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.nutrition-value {
  font-size: 1.25rem;
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
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  position: sticky;
  bottom: 0;
  background: white;
  padding: 1.5rem 0 0 0;
  border-top: 1px solid #f3f4f6;
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
.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 2rem;
  font-size: 0.875rem;
}
.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 2rem;
  font-size: 0.875rem;
}
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  .modal-header,
  .recipe-form {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .ingredient-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  .nutrition-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .modal-actions {
    flex-direction: column;
  }
  .visibility-toggle {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  .toggle-option {
    padding: 0.75rem;
  }
  .toggle-content {
    gap: 0.5rem;
  }
  .toggle-icon {
    font-size: 1.25rem;
  }
}
</style>