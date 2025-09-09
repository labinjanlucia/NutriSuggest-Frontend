<template>
  <div class="recipes-view">
    <div class="page-header">
      <div class="header-content">
        <h1>📝 Recipe Collection</h1>
        <p>Create and manage your favorite healthy recipes</p>
      </div>
      <div class="header-actions">
        <button @click="showCreateRecipe = true" class="create-recipe-btn">
          <span>➕</span> Create Recipe
        </button>
        <router-link to="/dashboard" class="back-button">
          <span>⬅️</span> Dashboard
        </router-link>
      </div>
    </div>
    <div class="search-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <div class="search-icon">🔍</div>
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Search recipes..."
            class="search-input"
          />
          <div v-if="searchQuery" @click="clearSearch" class="clear-button">✕</div>
        </div>
        <div class="search-filters">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="selectedTab = tab.value"
            :class="{ active: selectedTab === tab.value }"
            class="tab-button"
          >
            <span>{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading recipes...</p>
    </div>
    <div v-else class="recipes-content">
      <div v-if="selectedTab === 'my'" class="recipes-section">
        <div v-if="myRecipes.length === 0" class="empty-state">
          <div class="empty-icon">👨‍🍳</div>
          <h3>No recipes yet</h3>
          <p>Start building your recipe collection by creating your first recipe!</p>
          <button @click="showCreateRecipe = true" class="create-first-recipe-btn">
            Create Your First Recipe
          </button>
        </div>
        <div v-else class="recipes-grid">
          <div
            v-for="recipe in myRecipes"
            :key="recipe.id"
            class="recipe-card"
            @click="selectRecipe(recipe)"
          >
            <div class="recipe-image">
              <div class="recipe-emoji">{{ getRecipeEmoji(recipe.name) }}</div>
            </div>
            <div class="recipe-content">
              <h3 class="recipe-name">{{ recipe.name }}</h3>
              <p class="recipe-description">{{ recipe.description || (recipe.instructions ? recipe.instructions.substring(0, 80) + '...' : 'No description') }}</p>
              <div class="recipe-meta">
                <div class="recipe-servings">
                  <span class="meta-icon">🍽️</span>
                  {{ recipe.servings }} servings
                </div>
                <div class="recipe-calories">
                  <span class="meta-icon">🔥</span>
                  {{ Math.round(recipe.calories_per_serving || 0) }} cal/serving
                </div>
              </div>
            </div>
            <div class="recipe-actions">
              <button @click.stop="deleteRecipe(recipe.id)" class="action-btn delete">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="selectedTab === 'public'" class="recipes-section">
        <h2>🌍 Public Recipes</h2>
        <div v-if="popularRecipes.length === 0" class="empty-state">
          <div class="empty-icon">🍳</div>
          <h3>No public recipes found</h3>
          <p>Check back later for shared recipes from the community!</p>
        </div>
        <div v-else class="recipes-grid">
          <div
            v-for="recipe in popularRecipes"
            :key="recipe.id"
            class="recipe-card"
            @click="selectRecipe(recipe)"
          >
            <div class="recipe-image">
              <div class="recipe-emoji">{{ getRecipeEmoji(recipe.name) }}</div>
            </div>
            <div class="recipe-content">
              <h3 class="recipe-name">{{ recipe.name }}</h3>
              <p class="recipe-description">{{ recipe.description || (recipe.instructions ? recipe.instructions.substring(0, 80) + '...' : 'No description') }}</p>
              <div class="recipe-meta">
                <div class="recipe-servings">
                  <span class="meta-icon">🍽️</span>
                  {{ recipe.servings }} servings
                </div>
                <div class="recipe-calories">
                  <span class="meta-icon">🔥</span>
                  {{ Math.round(recipe.calories_per_serving || 0) }} cal/serving
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="selectedTab === 'search' && searchResults.length > 0" class="recipes-section">
        <h2>🔍 Search Results</h2>
        <div class="recipes-grid">
          <div
            v-for="recipe in searchResults"
            :key="recipe.id"
            class="recipe-card"
            @click="selectRecipe(recipe)"
          >
            <div class="recipe-image">
              <div class="recipe-emoji">{{ getRecipeEmoji(recipe.name) }}</div>
            </div>
            <div class="recipe-content">
              <h3 class="recipe-name">{{ recipe.name }}</h3>
              <p class="recipe-description">{{ recipe.description || (recipe.instructions ? recipe.instructions.substring(0, 80) + '...' : 'No description') }}</p>
              <div class="recipe-meta">
                <div class="recipe-servings">
                  <span class="meta-icon">🍽️</span>
                  {{ recipe.servings }} servings
                </div>
                <div class="recipe-calories">
                  <span class="meta-icon">🔥</span>
                  {{ Math.round(recipe.calories_per_serving || 0) }} cal/serving
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="selectedTab === 'search' && searchQuery && searchResults.length === 0 && !isLoading" class="empty-state">
        <div class="empty-icon">🤷‍♀️</div>
        <h3>No recipes found</h3>
        <p>No recipes match "{{ searchQuery }}". Try a different search term.</p>
      </div>
    </div>
    <RecipeDetailModal
      v-if="selectedRecipe"
      :recipe="selectedRecipe"
      :is-visible="showRecipeDetail"
      @close="closeRecipeDetail"
      @add-to-meal="addRecipeToMeal"
    />
    <CreateRecipeModal
      :is-visible="showCreateRecipe"
      @close="showCreateRecipe = false"
      @created="onRecipeCreated"
    />
    <div v-if="successMessage" class="success-message">
      <div class="message-icon">✅</div>
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="error-message">
      <div class="message-icon">❌</div>
      {{ errorMessage }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { recipesApi } from '@/api/endpoints/recipes'
import { useNutritionStore } from '@/stores/nutrition'
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal.vue'
import CreateRecipeModal from '@/components/recipes/CreateRecipeModal.vue'
import type { Recipe } from '@/types'
const router = useRouter()
const nutritionStore = useNutritionStore()
const isLoading = ref(false)
const searchQuery = ref('')
const selectedTab = ref('my')
const showCreateRecipe = ref(false)
const showRecipeDetail = ref(false)
const selectedRecipe = ref<Recipe | null>(null)
const successMessage = ref('')
const errorMessage = ref('')
const myRecipes = ref<Recipe[]>([])
const popularRecipes = ref<Recipe[]>([])
const searchResults = ref<Recipe[]>([])
const tabs = [
  { value: 'my', label: 'My Recipes', icon: '👤' },
  { value: 'public', label: 'Public Recipes', icon: '🌍' },
  { value: 'search', label: 'Search', icon: '🔍' }
]
const loadMyRecipes = async () => {
  try {
    const response = await recipesApi.searchRecipes({
      my_recipes: true,
      show_public: false,
      limit: 20
    })
    if (response.success) {
      myRecipes.value = response.data.recipes || []
    }
  } catch (error) {
    console.error('Error loading my recipes:', error)
    myRecipes.value = []
  }
}
const loadPublicRecipes = async () => {
  try {
    const response = await recipesApi.searchRecipes({
      my_recipes: false,
      show_public: true,
      limit: 20
    })
    if (response.success) {
      popularRecipes.value = response.data.recipes || []
    } else {
      popularRecipes.value = []
    }
  } catch (error) {
    console.error('Error loading public recipes:', error)
    popularRecipes.value = []
  }
}
const handleSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  selectedTab.value = 'search'
  isLoading.value = true
  try {
    const response = await recipesApi.searchRecipes({
      q: searchQuery.value,
      limit: 20
    })
    if (response.success) {
      searchResults.value = response.data.recipes || []
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('Error searching recipes:', error)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  selectedTab.value = 'my'
}
const selectRecipe = async (recipe: Recipe) => {
  selectedRecipe.value = recipe
  showRecipeDetail.value = true
}
const closeRecipeDetail = () => {
  showRecipeDetail.value = false
  selectedRecipe.value = null
}
const deleteRecipe = async (recipeId: number) => {
  if (!confirm('Are you sure you want to delete this recipe?')) return
  try {
    const response = await recipesApi.deleteRecipe(recipeId)
    if (response.success) {
      showMessage('Recipe deleted successfully!', 'success')
      await loadMyRecipes()
    }
  } catch (error) {
    console.error('Error deleting recipe:', error)
    showMessage('Failed to delete recipe. Please try again.', 'error')
  }
}
const addRecipeToMeal = async (data: { recipe: Recipe; servings: number; mealType: string }) => {
  console.log('Adding recipe to meal:', data)
  try {
    const success = await nutritionStore.addRecipeToMeal({
      recipe: data.recipe,
      servings: data.servings,
      meal_type: data.mealType
    })
    if (success) {
      showMessage(`Added ${data.servings} serving(s) of ${data.recipe.name} to ${data.mealType}!`, 'success')
      closeRecipeDetail()
      router.push('/dashboard')
    } else {
      showMessage('Failed to add recipe to meal. Please try again.', 'error')
    }
  } catch (error) {
    console.error('Error adding recipe to meal:', error)
    showMessage('Failed to add recipe to meal. Please try again.', 'error')
  }
}
const onRecipeCreated = async (recipe: Recipe) => {
  console.log('Recipe created:', recipe)
  showMessage(`Successfully created "${recipe.name}"!`, 'success')
  await loadMyRecipes()
}
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
const showMessage = (message: string, type: 'success' | 'error' | 'info') => {
  if (type === 'success') {
    successMessage.value = message
    setTimeout(() => { successMessage.value = '' }, 3000)
  } else {
    errorMessage.value = message
    setTimeout(() => { errorMessage.value = '' }, 5000)
  }
}
const loadInitialData = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      loadMyRecipes(),
      loadPublicRecipes()
    ])
  } finally {
    isLoading.value = false
  }
}
watch(() => selectedTab.value, (newTab) => {
  if (newTab === 'my') {
    loadMyRecipes()
  } else if (newTab === 'public') {
    loadPublicRecipes()
  }
})
onMounted(() => {
  loadInitialData()
})
</script>
<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.recipes-view {
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
  padding: 2rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 8px 32px rgba(240, 147, 251, 0.3);
}
.header-content h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.header-content p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.create-recipe-btn,
.back-button {
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
  cursor: pointer;
  transition: all 0.3s ease;
}
.create-recipe-btn:hover,
.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
.search-section {
  margin-bottom: 2rem;
}
.search-container {
  max-width: 800px;
  margin: 0 auto;
}
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}
.search-input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
.search-icon {
  padding: 1rem;
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
  justify-content: center;
}
.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.tab-button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
.recipes-content {
  min-height: 400px;
}
.recipes-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  text-align: center;
}
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}
.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 0.5rem 0;
}
.empty-state p {
  font-size: 1rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}
.create-first-recipe-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}
.create-first-recipe-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}
.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}
.recipe-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}
.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.recipe-image {
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.recipe-emoji {
  font-size: 3rem;
}
.recipe-content {
  padding: 1.5rem;
}
.recipe-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}
.recipe-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.recipe-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.recipe-servings,
.recipe-calories {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}
.meta-icon {
  font-size: 1rem;
}
.recipe-actions {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.recipe-card:hover .recipe-actions {
  opacity: 1;
}
.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.action-btn:hover {
  transform: scale(1.1);
}
.action-btn.edit:hover {
  background: #3b82f6;
}
.action-btn.delete:hover {
  background: #ef4444;
}
.success-message,
.error-message {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1000;
  animation: fadeInUp 0.3s ease;
}
.success-message {
  background: #10b981;
  color: white;
}
.error-message {
  background: #ef4444;
  color: white;
}
.message-icon {
  font-size: 1.25rem;
}
@media (max-width: 768px) {
  .recipes-view {
    padding: 1rem;
  }
  .page-header {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
    text-align: center;
  }
  .header-content h1 {
    font-size: 2rem;
  }
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  .search-filters {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .tab-button {
    flex: 1;
    min-width: auto;
    justify-content: center;
  }
  .recipes-grid {
    grid-template-columns: 1fr;
  }
  .success-message,
  .error-message {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
  }
}
@media (max-width: 480px) {
  .recipe-meta {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  .search-input-wrapper {
    margin-bottom: 0.5rem;
  }
  .tab-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>