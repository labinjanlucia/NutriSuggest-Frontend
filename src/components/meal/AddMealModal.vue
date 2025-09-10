<template>
  <div class="modal-overlay" v-if="show" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>Add to {{ formatMealType(mealType) }}</h3>
        <p class="meal-date">{{ formatDate(date) }}</p>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="tab-container">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'foods' }"
            @click="activeTab = 'foods'"
          >
            🍎 Foods
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'recipes' }"
            @click="activeTab = 'recipes'"
          >
            🍳 Recipes
          </button>
        </div>
        <div class="search-container">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="activeTab === 'foods' ? 'Search foods...' : 'Search recipes...'"
              class="search-input"
              @input="handleSearch"
            />
          </div>
        </div>
        <div class="content-tabs">
          <button
            class="content-tab"
            :class="{ active: contentFilter === 'my' }"
            @click="contentFilter = 'my'"
          >
            My {{ activeTab === 'foods' ? 'Foods' : 'Recipes' }}
          </button>
          <button
            class="content-tab"
            :class="{ active: contentFilter === 'public' }"
            @click="contentFilter = 'public'"
          >
            Public {{ activeTab === 'foods' ? 'Foods' : 'Recipes' }}
          </button>
        </div>
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Searching...</p>
        </div>
        <div v-else class="results-container">
          <div v-if="results.length === 0 && searchQuery" class="no-results">
            <p>No {{ activeTab }} found matching "{{ searchQuery }}"</p>
          </div>
          <div v-else-if="results.length === 0" class="no-results">
            <p>No {{ activeTab }} available</p>
          </div>
          <div v-else class="results-list">
            <div
              v-for="item in results"
              :key="item.id"
              class="result-item"
              @click="selectItem(item)"
            >
              <div class="item-info">
                <h4 class="item-name">{{ item.name }}</h4>
                <p v-if="item.brand" class="item-brand">{{ item.brand }}</p>
                <p v-if="activeTab === 'recipes' && item.instructions" class="item-description">
                  {{ item.instructions.substring(0, 100) }}{{ item.instructions.length > 100 ? '...' : '' }}
                </p>
                <div class="item-nutrition">
                  <span v-if="activeTab === 'foods'" class="nutrition-item">
                    {{ item.calories_per_100g }}cal/100g
                  </span>
                  <span v-else-if="item.calories_per_serving" class="nutrition-item">
                    {{ item.calories_per_serving }}cal/serving
                  </span>
                  <span v-if="item.created_by_user?.profile?.is_nutritionist" class="nutritionist-badge">
                    👨‍⚕️ Nutritionist
                  </span>
                </div>
              </div>
              <div class="select-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 6L9 18L3 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div v-if="selectedItem" class="quantity-section">
          <div class="selected-item-info">
            <h4>{{ selectedItem.name }}</h4>
            <p v-if="selectedItem.brand">{{ selectedItem.brand }}</p>
          </div>
          <div v-if="activeTab === 'foods'" class="quantity-input">
            <label for="quantity">Quantity (grams):</label>
            <input
              id="quantity"
              v-model.number="quantity"
              type="number"
              min="1"
              max="2000"
              placeholder="100"
              class="quantity-field"
            />
          </div>
          <div v-else class="quantity-input">
            <label for="servings">Servings:</label>
            <input
              id="servings"
              v-model.number="servings"
              type="number"
              min="0.1"
              step="0.1"
              max="10"
              placeholder="1"
              class="quantity-field"
            />
            <p class="serving-info">Recipe serves {{ selectedItem.servings }} total</p>
          </div>
          <div class="notes-input">
            <label for="notes">Notes (optional):</label>
            <textarea
              id="notes"
              v-model="notes"
              placeholder="Add any notes about this meal..."
              class="notes-field"
              rows="2"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button class="cancel-btn" @click="clearSelection">Cancel</button>
            <button
              class="add-btn"
              @click="addToMeal"
              :disabled="!isValidQuantity || adding"
            >
              {{ adding ? 'Adding...' : 'Add to Meal' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { foodsApi } from '@/api/endpoints/foods'
import { recipesApi } from '@/api/endpoints/recipes'
interface Props {
  show: boolean
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
  date: '',
  mealType: 'breakfast'
})
const emit = defineEmits<{
  close: []
  mealAdded: [{
    date: string
    mealType: string
    type: 'food' | 'recipe'
    item: any
    quantity?: number
    servings?: number
    notes?: string
  }]
}>()
const activeTab = ref<'foods' | 'recipes'>('foods')
const contentFilter = ref<'my' | 'public'>('my')
const searchQuery = ref('')
const loading = ref(false)
const results = ref<any[]>([])
const selectedItem = ref<any>(null)
const quantity = ref<number>(100)
const servings = ref<number>(1)
const notes = ref('')
const adding = ref(false)
const isValidQuantity = computed(() => {
  if (activeTab.value === 'foods') {
    return quantity.value > 0 && quantity.value <= 2000
  } else {
    return servings.value > 0 && servings.value <= 10
  }
})
const formatMealType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
const closeModal = () => {
  clearSelection()
  searchQuery.value = ''
  results.value = []
  emit('close')
}
const clearSelection = () => {
  selectedItem.value = null
  quantity.value = 100
  servings.value = 1
  notes.value = ''
}
const handleSearch = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'foods') {
      await searchFoods()
    } else {
      await searchRecipes()
    }
  } catch (error) {
    console.error('Search error:', error)
    results.value = []
  } finally {
    loading.value = false
  }
}
const searchFoods = async () => {
  try {
    const params: any = {
      page: 1,
      limit: 20
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    if (contentFilter.value === 'my') {
      params.created_by_me = 'true'
    } else {
      params.is_public = 'true'
    }
    console.log('AddMealModal: Searching foods with params:', params)
    const response = await foodsApi.searchFoods(params)
    console.log('AddMealModal: Food search response:', response)
    results.value = response.data?.foods || response.foods || []
    console.log('AddMealModal: Foods loaded:', results.value.length)
  } catch (error) {
    console.error('Food search error:', error)
    results.value = []
  }
}
const searchRecipes = async () => {
  try {
    const params: any = {
      page: 1,
      limit: 20
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    if (contentFilter.value === 'my') {
      params.created_by_me = 'true'
    } else {
      params.is_public = 'true'
    }
    console.log('AddMealModal: Searching recipes with params:', params)
    const response = await recipesApi.searchRecipes(params)
    console.log('AddMealModal: Recipe search response:', response)
    results.value = response.data?.recipes || response.recipes || []
    console.log('AddMealModal: Recipes loaded:', results.value.length)
  } catch (error) {
    console.error('Recipe search error:', error)
    results.value = []
  }
}
const selectItem = (item: any) => {
  selectedItem.value = item
  if (activeTab.value === 'foods') {
    quantity.value = 100
  } else {
    servings.value = 1
  }
}
const addToMeal = async () => {
  if (!selectedItem.value || !isValidQuantity.value) return
  adding.value = true
  try {
    const mealPlanData: any = {
      date: props.date,
      meal_type: props.mealType,
      notes: notes.value || undefined
    }
    if (activeTab.value === 'foods') {
      mealPlanData.food_id = selectedItem.value.id
      mealPlanData.quantity_grams = quantity.value
    } else {
      mealPlanData.recipe_id = selectedItem.value.id
      mealPlanData.servings = servings.value
    }
    console.log('AddMealModal: Creating meal plan with data:', mealPlanData)
    const { post } = await import('@/api/client')
    const response = await post('/meal-plans', mealPlanData)
    console.log('AddMealModal: Meal plan created successfully:', response.data)
    emit('mealAdded', {
      date: props.date,
      mealType: props.mealType,
      type: activeTab.value === 'foods' ? 'food' : 'recipe',
      item: selectedItem.value,
      quantity: activeTab.value === 'foods' ? quantity.value : undefined,
      servings: activeTab.value === 'recipes' ? servings.value : undefined,
      notes: notes.value || undefined
    })
    closeModal()
  } catch (error) {
    console.error('Add meal error:', error)
  } finally {
    adding.value = false
  }
}
watch([activeTab, contentFilter], () => {
  if (searchQuery.value || !searchQuery.value) {
    handleSearch()
  }
})
watch(() => props.show, (isShown) => {
  if (isShown) {
    handleSearch()
  }
})
onMounted(() => {
  if (props.show) {
    handleSearch()
  }
})
</script>
<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: modalSlideUp 0.3s ease-out;
}
@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.modal-header {
  position: relative;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
.modal-header h3 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}
.meal-date {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}
.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s ease;
}
.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}
.modal-body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}
.tab-container {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 12px;
}
.tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}
.tab-btn.active {
  background: white;
  color: #059669;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.search-container {
  margin-bottom: 16px;
}
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  color: #9ca3af;
  z-index: 1;
}
.search-input {
  width: 100%;
  padding: 12px 12px 12px 44px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}
.search-input:focus {
  outline: none;
  border-color: #059669;
}
.content-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}
.content-tab {
  padding: 8px 16px 12px;
  border: none;
  background: none;
  cursor: pointer;
  color: #6b7280;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}
.content-tab.active {
  color: #059669;
  border-bottom-color: #059669;
}
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #6b7280;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #059669;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.results-container {
  min-height: 200px;
}
.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}
.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}
.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.result-item:hover {
  border-color: #059669;
  background: #f0fdf4;
}
.item-info {
  flex: 1;
}
.item-name {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}
.item-brand {
  margin: 0 0 4px 0;
  color: #6b7280;
  font-size: 0.9rem;
}
.item-description {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
}
.item-nutrition {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nutrition-item {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #374151;
  font-weight: 500;
}
.nutritionist-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}
.select-btn {
  padding: 8px;
  color: #059669;
  border-radius: 8px;
  transition: background 0.2s ease;
}
.result-item:hover .select-btn {
  background: #dcfce7;
}
.quantity-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}
.selected-item-info h4 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}
.selected-item-info p {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 0.9rem;
}
.quantity-input, .notes-input {
  margin-bottom: 16px;
}
.quantity-input label, .notes-input label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
}
.quantity-field, .notes-field {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}
.quantity-field:focus, .notes-field:focus {
  outline: none;
  border-color: #059669;
}
.serving-info {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 0.85rem;
}
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
.cancel-btn, .add-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}
.cancel-btn:hover {
  background: #e5e7eb;
}
.add-btn {
  background: #059669;
  color: white;
}
.add-btn:hover:not(:disabled) {
  background: #047857;
}
.add-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
  .modal-header {
    padding: 16px;
  }
  .modal-body {
    padding: 16px;
  }
  .modal-actions {
    flex-direction: column;
  }
  .cancel-btn, .add-btn {
    flex: none;
  }
}
</style>