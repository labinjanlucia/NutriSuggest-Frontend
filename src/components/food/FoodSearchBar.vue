<template>
  <div class="food-search-bar">
    <div class="search-input-container">
      <div class="search-icon">🔍</div>
      <input
        v-model="searchQuery"
        @input="handleSearch"
        type="text"
        placeholder="Search for foods, brands, or nutrients..."
        class="search-input"
        @keydown.enter="performSearch"
      />
      <div v-if="searchQuery" @click="clearSearch" class="clear-button">✕</div>
    </div>
    <div class="search-filters">
      <button
        v-for="filter in filters"
        :key="filter.value"
        @click="selectedFilter = filter.value"
        :class="{ 'active': selectedFilter === filter.value }"
        class="filter-btn"
      >
        <span>{{ filter.icon }}</span>
        {{ filter.label }}
      </button>
    </div>
    <div v-if="isLoading" class="search-loading">
      <div class="loading-spinner"></div>
      Searching...
    </div>
    <div v-else-if="searchResults.length > 0" class="search-results">
      <div class="results-header">
        <span class="results-count">{{ searchResults.length }} results found</span>
        <button @click="clearResults" class="clear-results">Clear</button>
      </div>
      <div class="results-list">
        <div
          v-for="food in searchResults"
          :key="food.id"
          class="food-result-item"
          @click="selectFood(food)"
        >
          <div class="food-info">
            <div class="food-name">{{ food.name }}</div>
            <div class="food-brand" v-if="food.brand">{{ food.brand }}</div>
            <div class="food-category">{{ food.category || 'General' }}</div>
          </div>
          <div class="food-nutrition">
            <div class="nutrition-item">
              <span class="nutrition-value">{{ food.calories_per_100g }}</span>
              <span class="nutrition-label">cal/100g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-value">{{ food.protein_per_100g }}g</span>
              <span class="nutrition-label">protein</span>
            </div>
          </div>
          <div class="add-button">
            <span>+</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="searchQuery && !isLoading" class="no-results">
      <div class="no-results-icon">🤷‍♀️</div>
      <div class="no-results-text">No foods found for "{{ searchQuery }}"</div>
      <button @click="createCustomFood" class="create-custom-btn">
        Create Custom Food
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { foodsApi } from '@/api/endpoints/foods'
interface Food {
  id: number
  name: string
  brand?: string
  category?: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
}
interface Props {
  placeholder?: string
}
const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search for foods...'
})
const emit = defineEmits<{
  foodSelected: [food: Food]
  createFood: [query: string]
}>()
const searchQuery = ref('')
const selectedFilter = ref('all')
const isLoading = ref(false)
const searchResults = ref<Food[]>([])
const filters = [
  { value: 'all', label: 'All', icon: '🍽️' },
  { value: 'fruits', label: 'Fruits', icon: '🍎' },
  { value: 'vegetables', label: 'Vegetables', icon: '🥬' },
  { value: 'proteins', label: 'Proteins', icon: '🍖' },
  { value: 'grains', label: 'Grains', icon: '🌾' },
  { value: 'dairy', label: 'Dairy', icon: '🥛' }
]
const handleSearch = async () => {
  if (searchQuery.value.length === 0) {
    searchResults.value = []
    return
  }
  isLoading.value = true
  try {
    const response = await foodsApi.searchFoods({
      q: searchQuery.value,
      limit: 20
    })
    if (response.success) {
      let foods = response.data.foods.map(food => ({
        id: food.id,
        name: food.name,
        brand: food.brand,
        category: food.category || getCategoryForFood(food.name),
        calories_per_100g: food.calories_per_100g,
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fat_per_100g: food.fat_per_100g
      }))
      if (selectedFilter.value !== 'all') {
        const filterCategory = getFilterCategory(selectedFilter.value)
        foods = foods.filter(food =>
          food.category.toLowerCase().includes(filterCategory.toLowerCase())
        )
      }
      searchResults.value = foods
    } else {
      searchResults.value = getFallbackSearchResults(searchQuery.value)
    }
  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = getFallbackSearchResults(searchQuery.value)
  } finally {
    isLoading.value = false
  }
}
const getFilterCategory = (filter: string): string => {
  const categoryMap: Record<string, string> = {
    'fruits': 'Fruits',
    'vegetables': 'Vegetables',
    'proteins': 'Proteins',
    'grains': 'Grains',
    'dairy': 'Dairy'
  }
  return categoryMap[filter] || 'General'
}
const getCategoryForFood = (name: string): string => {
  const lowerName = name.toLowerCase()
  if (['banana', 'apple', 'orange', 'berry', 'grape', 'melon'].some(fruit => lowerName.includes(fruit))) return 'Fruits'
  if (['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey'].some(protein => lowerName.includes(protein))) return 'Proteins'
  if (['rice', 'bread', 'pasta', 'oats', 'quinoa', 'barley'].some(grain => lowerName.includes(grain))) return 'Grains'
  if (['milk', 'cheese', 'yogurt', 'butter', 'cream'].some(dairy => lowerName.includes(dairy))) return 'Dairy'
  if (['broccoli', 'spinach', 'carrot', 'potato', 'tomato', 'lettuce'].some(veg => lowerName.includes(veg))) return 'Vegetables'
  return 'General'
}
const getFallbackSearchResults = (query: string): Food[] => {
  const fallbackFoods: Food[] = [
    { id: -1, name: 'Banana', category: 'Fruits', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3 },
    { id: -2, name: 'Chicken Breast', category: 'Proteins', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
    { id: -3, name: 'Brown Rice', category: 'Grains', calories_per_100g: 123, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9 },
    { id: -4, name: 'Greek Yogurt', category: 'Dairy', calories_per_100g: 100, protein_per_100g: 10, carbs_per_100g: 6, fat_per_100g: 0.4 },
    { id: -5, name: 'Salmon', category: 'Proteins', calories_per_100g: 208, protein_per_100g: 25, carbs_per_100g: 0, fat_per_100g: 12 },
    { id: -6, name: 'Avocado', category: 'Fruits', calories_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 9, fat_per_100g: 15 }
  ]
  return fallbackFoods.filter(food =>
    food.name.toLowerCase().includes(query.toLowerCase()) ||
    food.category.toLowerCase().includes(query.toLowerCase())
  )
}
const performSearch = () => {
  handleSearch()
}
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}
const clearResults = () => {
  searchResults.value = []
}
const selectFood = (food: Food) => {
  emit('foodSelected', food)
}
const createCustomFood = () => {
  emit('createFood', searchQuery.value)
}
const loadFoodsByCategory = async () => {
  if (selectedFilter.value === 'all') {
    searchResults.value = []
    return
  }
  isLoading.value = true
  try {
    if (searchQuery.value.length >= 1) {
      await handleSearch()
      return
    }
    const response = await foodsApi.searchFoods({
      q: '',
      limit: 50
    })
    if (response.success) {
      const filterCategory = getFilterCategory(selectedFilter.value)
      const foods = response.data.foods
        .map(food => ({
          id: food.id,
          name: food.name,
          brand: food.brand,
          category: food.category || getCategoryForFood(food.name),
          calories_per_100g: food.calories_per_100g,
          protein_per_100g: food.protein_per_100g,
          carbs_per_100g: food.carbs_per_100g,
          fat_per_100g: food.fat_per_100g
        }))
        .filter(food => food.category.toLowerCase().includes(filterCategory.toLowerCase()))
        .slice(0, 12)
      searchResults.value = foods
    }
  } catch (error) {
    console.error('Category filter error:', error)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 300)
}
watch(searchQuery, () => {
  if (searchQuery.value.length === 0) {
    searchResults.value = []
    return
  }
  debouncedSearch()
})
watch(selectedFilter, () => {
  if (selectedFilter.value === 'all') {
    if (searchQuery.value.length === 0) {
      searchResults.value = []
    } else {
      handleSearch()
    }
  } else {
    loadFoodsByCategory()
  }
})
</script>
<style scoped>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.food-search-bar {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}
.search-input-container:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
.search-icon {
  padding: 1rem 0 1rem 1rem;
  font-size: 1.25rem;
  color: #9ca3af;
}
.search-input {
  flex: 1;
  padding: 1rem 0.5rem;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #1f2937;
}
.search-input::placeholder {
  color: #9ca3af;
}
.clear-button {
  padding: 1rem;
  color: #9ca3af;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.2s ease;
}
.clear-button:hover {
  color: #ef4444;
}
.search-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}
.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.filter-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.filter-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #6b7280;
  font-weight: 500;
}
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.search-results {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.results-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}
.clear-results {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}
.clear-results:hover {
  color: #374151;
  background: #e5e7eb;
}
.results-list {
  max-height: 400px;
  overflow-y: auto;
}
.food-result-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
}
.food-result-item:hover {
  background: #f8fafc;
}
.food-result-item:last-child {
  border-bottom: none;
}
.food-info {
  flex: 1;
  min-width: 0;
}
.food-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}
.food-brand {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}
.food-category {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.food-nutrition {
  display: flex;
  gap: 1rem;
  margin-right: 1rem;
}
.nutrition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.nutrition-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}
.nutrition-label {
  font-size: 0.75rem;
  color: #6b7280;
}
.add-button {
  width: 32px;
  height: 32px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.add-button:hover {
  background: #059669;
  transform: scale(1.1);
}
.no-results {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
  animation: fadeIn 0.3s ease;
}
.no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.no-results-text {
  font-size: 1.125rem;
  margin-bottom: 1.5rem;
  color: #374151;
}
.create-custom-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}
.create-custom-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}
@media (max-width: 640px) {
  .search-filters {
    padding-bottom: 1rem;
  }
  .food-result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .food-nutrition {
    width: 100%;
    justify-content: space-around;
    margin-right: 0;
  }
  .add-button {
    align-self: center;
  }
}
</style>