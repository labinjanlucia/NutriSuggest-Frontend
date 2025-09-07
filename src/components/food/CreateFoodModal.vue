<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-card" @click.stop>
      <div class="modal-header">
        <h3>Create New Food</h3>
        <button @click="closeModal" class="close-button">✕</button>
      </div>
      <form @submit.prevent="createFood" class="food-form">
        <div class="form-section">
          <h4>Basic Information</h4>
          <div class="form-group">
            <label for="foodName">Food Name *</label>
            <input
              id="foodName"
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="e.g., Chicken Breast, Brown Rice..."
              required
            />
          </div>
          <div class="form-group">
            <label for="foodBrand">Brand (optional)</label>
            <input
              id="foodBrand"
              v-model="formData.brand"
              type="text"
              class="form-input"
              placeholder="e.g., Organic Valley, Tyson..."
            />
          </div>
          <div class="form-group">
            <label for="foodCategory">Category (optional)</label>
            <select
              id="foodCategory"
              v-model="formData.category"
              class="form-select"
            >
              <option value="">Select category...</option>
              <option value="Fruits">Fruits</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Proteins">Proteins</option>
              <option value="Grains">Grains</option>
              <option value="Dairy">Dairy</option>
              <option value="Oils & Fats">Oils & Fats</option>
              <option value="Nuts & Seeds">Nuts & Seeds</option>
              <option value="Beverages">Beverages</option>
              <option value="Snacks">Snacks</option>
              <option value="General">General</option>
            </select>
          </div>
          <div class="form-group">
            <label class="visibility-label">
              <span class="label-text">Visibility</span>
              <span class="label-description">Choose who can see this food</span>
            </label>
            <div class="visibility-toggle">
              <label class="toggle-option" :class="{ active: !formData.is_public }">
                <input
                  type="radio"
                  :value="false"
                  v-model="formData.is_public"
                  name="visibility"
                />
                <div class="toggle-content">
                  <div class="toggle-icon">🔒</div>
                  <div class="toggle-text">
                    <span class="toggle-title">Private</span>
                    <span class="toggle-desc">Only visible to you</span>
                  </div>
                </div>
              </label>
              <label class="toggle-option" :class="{ active: formData.is_public }">
                <input
                  type="radio"
                  :value="true"
                  v-model="formData.is_public"
                  name="visibility"
                />
                <div class="toggle-content">
                  <div class="toggle-icon">🌍</div>
                  <div class="toggle-text">
                    <span class="toggle-title">Public</span>
                    <span class="toggle-desc">Visible to everyone</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="form-section">
          <h4>Nutrition Information (per 100g) *</h4>
          <div class="nutrition-grid">
            <div class="form-group">
              <label for="calories">Calories</label>
              <input
                id="calories"
                v-model.number="formData.calories_per_100g"
                type="number"
                step="0.1"
                min="0"
                max="900"
                class="form-input"
                placeholder="0"
                required
              />
            </div>
            <div class="form-group">
              <label for="protein">Protein (g)</label>
              <input
                id="protein"
                v-model.number="formData.protein_per_100g"
                type="number"
                step="0.1"
                min="0"
                max="100"
                class="form-input"
                placeholder="0.0"
                required
              />
            </div>
            <div class="form-group">
              <label for="carbs">Carbs (g)</label>
              <input
                id="carbs"
                v-model.number="formData.carbs_per_100g"
                type="number"
                step="0.1"
                min="0"
                max="100"
                class="form-input"
                placeholder="0.0"
                required
              />
            </div>
            <div class="form-group">
              <label for="fat">Fat (g)</label>
              <input
                id="fat"
                v-model.number="formData.fat_per_100g"
                type="number"
                step="0.1"
                min="0"
                max="100"
                class="form-input"
                placeholder="0.0"
                required
              />
            </div>
            <div class="form-group">
              <label for="fiber">Fiber (g)</label>
              <input
                id="fiber"
                v-model.number="formData.fiber_per_100g"
                type="number"
                step="0.1"
                min="0"
                max="50"
                class="form-input"
                placeholder="0.0"
              />
            </div>
          </div>
        </div>
        <div class="nutrition-preview" v-if="hasNutritionData">
          <h4>Nutrition Preview</h4>
          <div class="preview-stats">
            <div class="stat-item">
              <span class="stat-value">{{ formData.calories_per_100g || 0 }}</span>
              <span class="stat-label">calories</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formData.protein_per_100g || 0 }}g</span>
              <span class="stat-label">protein</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formData.carbs_per_100g || 0 }}g</span>
              <span class="stat-label">carbs</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formData.fat_per_100g || 0 }}g</span>
              <span class="stat-label">fat</span>
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
            {{ isLoading ? 'Creating...' : 'Create Food' }}
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
import { foodsApi } from '@/api/endpoints/foods'
interface Props {
  isVisible: boolean
  initialQuery?: string
}
const props = withDefaults(defineProps<Props>(), {
  initialQuery: ''
})
const emit = defineEmits<{
  close: []
  created: [food: any]
}>()
const isLoading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const formData = ref({
  name: '',
  brand: '',
  category: '',
  calories_per_100g: 0,
  protein_per_100g: 0,
  carbs_per_100g: 0,
  fat_per_100g: 0,
  fiber_per_100g: 0,
  is_public: false
})
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 &&
         formData.value.calories_per_100g >= 0 &&
         formData.value.protein_per_100g >= 0 &&
         formData.value.carbs_per_100g >= 0 &&
         formData.value.fat_per_100g >= 0
})
const hasNutritionData = computed(() => {
  return formData.value.calories_per_100g > 0 ||
         formData.value.protein_per_100g > 0 ||
         formData.value.carbs_per_100g > 0 ||
         formData.value.fat_per_100g > 0
})
const resetForm = () => {
  formData.value = {
    name: props.initialQuery || '',
    brand: '',
    category: '',
    calories_per_100g: 0,
    protein_per_100g: 0,
    carbs_per_100g: 0,
    fat_per_100g: 0,
    fiber_per_100g: 0,
    is_public: false
  }
  error.value = null
  successMessage.value = null
}
const closeModal = () => {
  if (!isLoading.value) {
    emit('close')
  }
}
const createFood = async () => {
  if (!isFormValid.value || isLoading.value) return
  isLoading.value = true
  error.value = null
  successMessage.value = null
  try {
    const foodData = {
      name: formData.value.name.trim(),
      brand: formData.value.brand.trim() || undefined,
      category: formData.value.category || undefined,
      calories_per_100g: Number(formData.value.calories_per_100g),
      protein_per_100g: Number(formData.value.protein_per_100g),
      carbs_per_100g: Number(formData.value.carbs_per_100g),
      fat_per_100g: Number(formData.value.fat_per_100g),
      fiber_per_100g: Number(formData.value.fiber_per_100g) || 0,
      is_public: formData.value.is_public
    }
    const response = await foodsApi.createFood(foodData)
    if (response.success && response.data?.food) {
      successMessage.value = `Successfully created "${response.data.food.name}"!`
      emit('created', response.data.food)
      setTimeout(() => {
        closeModal()
      }, 1500)
    } else {
      error.value = 'Failed to create food. Please try again.'
    }
  } catch (err: any) {
    console.error('Error creating food:', err)
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Failed to create food. Please check your input and try again.'
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
watch(() => props.initialQuery, (query) => {
  if (query) {
    formData.value.name = query
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
  max-width: 600px;
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
.food-form {
  padding: 0 2rem 2rem 2rem;
}
.form-section {
  margin-bottom: 2rem;
}
.form-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}
.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background: white;
}
.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.form-input:invalid {
  border-color: #ef4444;
}
.visibility-label {
  display: block;
  margin-bottom: 1rem;
}
.label-text {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}
.label-description {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
}
.visibility-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.toggle-option {
  position: relative;
  cursor: pointer;
  display: block;
}
.toggle-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.toggle-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
  transition: all 0.2s ease;
}
.toggle-option:hover .toggle-content {
  border-color: #d1d5db;
  background: #f3f4f6;
}
.toggle-option.active .toggle-content {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.toggle-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}
.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.toggle-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}
.toggle-desc {
  font-size: 0.75rem;
  color: #6b7280;
}
.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}
.nutrition-preview {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}
.nutrition-preview h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}
.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}
.stat-item {
  text-align: center;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}
.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  .modal-header,
  .food-form {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  .nutrition-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .preview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .modal-actions {
    flex-direction: column;
  }
  .visibility-toggle {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .nutrition-grid {
    grid-template-columns: 1fr;
  }
  .preview-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>