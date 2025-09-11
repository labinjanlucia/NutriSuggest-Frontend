<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>⭐ Smart Meal Suggestions</h2>
        <button @click="closeModal" class="close-button">×</button>
      </div>
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Getting personalized suggestions...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="getSuggestions" class="retry-button">Try Again</button>
      </div>
      <div v-else-if="suggestions.length > 0" class="suggestions-content">
        <div class="how-it-works">
          <h3>💡 How Suggestions Work</h3>
          <p>Our system analyzes your <strong>daily nutrition gaps</strong> and <strong>meal history patterns</strong> to recommend foods and recipes that best match your goals and preferences.</p>
        </div>
        <div class="suggestions-list">
          <h3>Top 3 Suggestions for You:</h3>
          <div
            v-for="(suggestion, index) in suggestions.slice(0, 3)"
            :key="index"
            class="suggestion-card"
            :class="{ selected: selectedSuggestion === index }"
            @click="selectSuggestion(index)"
          >
            <div class="suggestion-header">
              <h4>{{ suggestion.item?.name || 'Unknown Item' }}</h4>
              <div class="confidence-score">
                <span class="score">{{ Math.round(suggestion.confidence || 0) }}%</span>
                <span class="label">Match</span>
              </div>
            </div>
            <div class="suggestion-details">
              <div class="nutrition-info" v-if="suggestion.item">
                <span v-if="suggestion.type === 'food'">
                  📊 100g ·
                  {{ Math.round((suggestion.item.calories_per_100g || 0)) }} cal
                </span>
                <span v-else-if="suggestion.type === 'recipe'">
                  🍽️ 1 serving · {{ suggestion.item.servings || 1 }} total servings
                </span>
              </div>
              <p class="suggestion-reason">{{ suggestion.reason || 'Great choice for your nutrition goals!' }}</p>
            </div>
          </div>
        </div>
        <div v-if="selectedSuggestion !== null" class="placement-section">
          <h3>📅 Where would you like to add this?</h3>
          <div class="date-meal-picker">
            <div class="date-section">
              <label for="suggestion-date">Date:</label>
              <input
                id="suggestion-date"
                type="date"
                v-model="selectedDate"
                :min="new Date().toISOString().split('T')[0]"
                class="date-input"
              />
            </div>
            <div class="meal-type-section">
              <label>Meal Type:</label>
              <div class="meal-type-options">
                <button
                  v-for="mealType in mealTypes"
                  :key="mealType.value"
                  :class="['meal-type-btn', { active: selectedMealType === mealType.value }]"
                  @click="selectedMealType = mealType.value"
                >
                  <span>{{ mealType.icon }}</span>
                  {{ mealType.label }}
                </button>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="closeModal" class="cancel-button">Cancel</button>
            <button @click="addToMealPlan" class="add-button" :disabled="isAddingToMealPlan">
              {{ isAddingToMealPlan ? 'Adding...' : 'Add to Meal Plan' }}
            </button>
          </div>
        </div>
      </div>
      <div v-else class="no-suggestions-state">
        <h3>🤔 No Suggestions Available</h3>
        <p>We need more data to provide personalized suggestions. Try logging some meals first to help the system learn your preferences!</p>
        <button @click="closeModal" class="ok-button">Got it</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
interface Props {
  isVisible: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  suggestionAdded: [suggestion: any, date: string, mealType: string]
}>()
const authStore = useAuthStore()
const isLoading = ref(false)
const error = ref<string | null>(null)
const suggestions = ref<any[]>([])
const selectedSuggestion = ref<number | null>(null)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedMealType = ref('lunch')
const isAddingToMealPlan = ref(false)
const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' }
]
const selectedSuggestionData = computed(() => {
  return selectedSuggestion.value !== null ? suggestions.value[selectedSuggestion.value] : null
})
const closeModal = () => {
  emit('close')
  resetModal()
}
const resetModal = () => {
  suggestions.value = []
  selectedSuggestion.value = null
  selectedDate.value = new Date().toISOString().split('T')[0]
  selectedMealType.value = 'lunch'
  error.value = null
  isAddingToMealPlan.value = false
}
const selectSuggestion = (index: number) => {
  selectedSuggestion.value = index
}
const getSuggestions = async () => {
  if (!authStore.token) return
  isLoading.value = true
  error.value = null
  try {
    const response = await fetch('http:
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      suggestions.value = data.data.suggestions || []
      console.log('Received suggestions:', suggestions.value)
      if (suggestions.value.length === 0) {
      }
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to get meal suggestions')
    }
  } catch (err: any) {
    console.error('Error getting suggestions:', err)
    error.value = err.message || 'Unable to get meal suggestions right now. Please try again.'
  } finally {
    isLoading.value = false
  }
}
const addToMealPlan = async () => {
  if (!selectedSuggestionData.value || !authStore.token) return
  isAddingToMealPlan.value = true
  try {
    const suggestion = selectedSuggestionData.value
    console.log('Adding suggestion to meal plan:', suggestion)
    const mealData: any = {
      date: selectedDate.value,
      meal_type: selectedMealType.value,
      notes: `⭐ Smart Suggestion: ${suggestion.reason || 'Smart recommendation based on your nutrition goals'}`
    }
    if (suggestion.type === 'food' && suggestion.item?.id) {
      mealData.food_id = suggestion.item.id
      mealData.quantity_grams = 100
    } else if (suggestion.type === 'recipe' && suggestion.item?.id) {
      mealData.recipe_id = suggestion.item.id
      mealData.servings = 1
    } else {
      throw new Error('Invalid suggestion data: missing food or recipe information')
    }
    console.log('Sending meal data:', mealData)
    const response = await fetch('http:
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(mealData)
    })
    if (response.ok) {
      emit('suggestionAdded', suggestion, selectedDate.value, selectedMealType.value)
      closeModal()
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to add suggestion to meal plan')
    }
  } catch (err: any) {
    console.error('Error adding to meal plan:', err)
    error.value = err.message || 'Failed to add suggestion. Please try again.'
  } finally {
    isAddingToMealPlan.value = false
  }
}
const handleVisibilityChange = () => {
  if (props.isVisible && suggestions.value.length === 0 && !isLoading.value) {
    getSuggestions()
  }
}
import { watch } from 'vue'
watch(() => props.isVisible, handleVisibilityChange, { immediate: true })
</script>
<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}
.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}
.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: white;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.close-button:hover {
  opacity: 1;
}
.loading-state, .error-state, .no-suggestions-state {
  padding: 2rem;
  text-align: center;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
}
.retry-button, .ok-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}
.retry-button:hover, .ok-button:hover {
  background: #5a67d8;
}
.suggestions-content {
  padding: 1.5rem;
}
.how-it-works {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}
.how-it-works h3 {
  margin: 0 0 0.5rem 0;
  color: #0369a1;
  font-size: 1.1rem;
}
.how-it-works p {
  margin: 0;
  color: #075985;
  font-size: 0.9rem;
  line-height: 1.5;
}
.suggestions-list h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.2rem;
}
.suggestion-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.suggestion-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}
.suggestion-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}
.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.suggestion-header h4 {
  margin: 0;
  color: #374151;
  font-size: 1.1rem;
}
.confidence-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}
.confidence-score .score {
  font-size: 0.9rem;
  font-weight: 700;
}
.confidence-score .label {
  font-size: 0.7rem;
  opacity: 0.9;
}
.nutrition-info {
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 600;
}
.suggestion-reason {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
}
.placement-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}
.placement-section h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.1rem;
}
.date-meal-picker {
  margin-bottom: 1.5rem;
}
.date-section, .meal-type-section {
  margin-bottom: 1rem;
}
.date-section label, .meal-type-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}
.date-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}
.date-input:focus {
  outline: none;
  border-color: #667eea;
}
.meal-type-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}
.meal-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
}
.meal-type-btn:hover {
  border-color: #667eea;
  background: #f8fafc;
}
.meal-type-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.meal-type-btn span {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
.cancel-button {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}
.cancel-button:hover {
  background: #e5e7eb;
}
.add-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.add-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
}
.add-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  .modal-header {
    padding: 1rem;
  }
  .modal-header h2 {
    font-size: 1.3rem;
  }
  .suggestions-content {
    padding: 1rem;
  }
  .meal-type-options {
    grid-template-columns: repeat(2, 1fr);
  }
  .modal-actions {
    flex-direction: column;
  }
  .cancel-button, .add-button {
    width: 100%;
  }
}
</style>