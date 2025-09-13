<template>
  <div class="foods-view">
    <div class="page-header">
      <div class="header-content">
        <h1>🍎 Food Database</h1>
        <p>Search and add foods to track your nutrition</p>
      </div>
      <div class="header-actions">
        <button @click="showCreateFood = true" class="create-food-btn">
          <span>➕</span> Create Food
        </button>
        <router-link to="/dashboard" class="back-button">
          <span>⬅️</span> Dashboard
        </router-link>
      </div>
    </div>
    <div class="search-section">
      <FoodSearchBar
        @food-selected="handleFoodSelected"
        @create-food="handleCreateFood"
        :filters="{ created_by_me: viewMode === 'my', show_public: viewMode === 'public' }"
      />
    </div>
    <div class="content-toggle">
      <div class="toggle-buttons">
        <button
          @click="setViewMode('my')"
          :class="{ active: viewMode === 'my' }"
          class="toggle-button"
        >
          <span>👤</span> My Foods
        </button>
        <button
          @click="setViewMode('public')"
          :class="{ active: viewMode === 'public' }"
          class="toggle-button"
        >
          <span>🌍</span> Public Foods
        </button>
      </div>
    </div>
    <div class="popular-foods">
      <h3>{{ viewMode === 'my' ? '👤 My Foods' : '🔥 Popular Foods' }}</h3>
      <div class="popular-foods-grid">
        <div
          v-for="food in popularFoods"
          :key="food.id"
          class="popular-food-card"
          @click="selectFood(food)"
        >
          <div class="food-emoji">{{ food.emoji }}</div>
          <div class="food-name">{{ food.name }}</div>
          <div class="food-calories">{{ food.calories_per_100g }} cal/100g</div>
        </div>
      </div>
    </div>
    <div class="recent-foods" v-if="recentFoods.length > 0">
      <h3>🕐 Recently Used</h3>
      <div class="recent-foods-list">
        <div
          v-for="food in recentFoods"
          :key="food.id"
          class="recent-food-item"
          @click="selectFood(food)"
        >
          <span class="food-name">{{ food.name }}</span>
          <span class="food-calories">{{ food.calories_per_100g }} cal</span>
        </div>
      </div>
    </div>
    <FoodSelectionModal
      :is-visible="showFoodModal"
      :food="selectedFood"
      @close="closeFoodModal"
      @added="onFoodAdded"
    />
    <CreateFoodModal
      :is-visible="showCreateFood"
      :initial-query="createFoodQuery"
      @close="closeCreateFoodModal"
      @created="onFoodCreated"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FoodSearchBar from '@/components/food/FoodSearchBar.vue'
import FoodSelectionModal from '@/components/food/FoodSelectionModal.vue'
import CreateFoodModal from '@/components/food/CreateFoodModal.vue'
import { foodsApi } from '@/api/endpoints/foods'
import { useRouter } from 'vue-router'
interface Food {
  id: number
  name: string
  emoji?: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
}
const router = useRouter()
const showCreateFood = ref(false)
const showFoodModal = ref(false)
const createFoodQuery = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const viewMode = ref<'my' | 'public'>('public')
const popularFoods = ref<Food[]>([])
const recentFoods = ref<Food[]>([])
const selectedFood = ref<Food>({} as Food)
const fallbackPopularFoods: Food[] = []
const loadFoodsData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const filters = {
      created_by_me: viewMode.value === 'my',
      show_public: viewMode.value === 'public'
    }
    const popularResponse = await foodsApi.searchFoods({
      ...filters,
      limit: 20
    })
    if (popularResponse.success && popularResponse.data.foods.length > 0) {
      popularFoods.value = popularResponse.data.foods.map(food => ({
        ...food,
        emoji: getEmojiForFood(food.name)
      }))
    } else {
      popularFoods.value = viewMode.value === 'public' ? fallbackPopularFoods : []
    }
  } catch (err) {
    console.error('Error loading popular foods:', err)
    popularFoods.value = viewMode.value === 'public' ? fallbackPopularFoods : []
  } finally {
    isLoading.value = false
  }
}
const getEmojiForFood = (name: string): string => {
  const lowerName = name.toLowerCase()
  const emojiMap: Record<string, string> = {
    banana: '🍌', apple: '🍎', chicken: '🍗', rice: '🍚', salmon: '🐟',
    fish: '🐟', avocado: '🥑', yogurt: '🥛', milk: '🥛', egg: '🥚',
    bread: '🍞', pasta: '🍝', potato: '🥔', carrot: '🥕', broccoli: '🥦',
    tomato: '🍅', lettuce: '🥬', spinach: '🥬', oats: '🌾', nuts: '🥜',
    almond: '🥜', orange: '🍊', berry: '🫐', cheese: '🧀'
  }
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerName.includes(key)) return emoji
  }
  return '🥘'
}
const handleFoodSelected = (food: Food) => {
  selectedFood.value = food
  showFoodModal.value = true
}
const closeFoodModal = () => {
  showFoodModal.value = false
}
const onFoodAdded = (data: { food: Food; quantity: number; mealType: string }) => {
  console.log('Food added to meal:', data)
  router.push('/dashboard')
}
const handleCreateFood = (query: string = '') => {
  createFoodQuery.value = query
  showCreateFood.value = true
}
const closeCreateFoodModal = () => {
  showCreateFood.value = false
  createFoodQuery.value = ''
}
const onFoodCreated = async (food: Food) => {
  console.log('Food created:', food)
  await loadFoodsData()
}
const selectFood = (food: Food) => {
  handleFoodSelected(food)
}
const setViewMode = (mode: 'my' | 'public') => {
  viewMode.value = mode
  loadFoodsData()
}
onMounted(() => {
  loadFoodsData()
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
.foods-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  animation: fadeInUp 0.6s ease;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
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
.create-food-btn, .back-button {
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
.create-food-btn:hover, .back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
.search-section {
  margin-bottom: 2rem;
}
.content-toggle {
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
}
.toggle-buttons {
  display: flex;
  background: #f8fafc;
  border-radius: 12px;
  padding: 0.5rem;
  gap: 0.5rem;
  border: 1px solid #e2e8f0;
}
.toggle-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}
.toggle-button:hover {
  background: #e2e8f0;
  color: #475569;
}
.toggle-button.active {
  background: #10b981;
  color: white;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}
.toggle-button span {
  font-size: 1rem;
}
.popular-foods, .recent-foods {
  margin-bottom: 3rem;
  animation: slideIn 0.6s ease;
}
.popular-foods h3, .recent-foods h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}
.popular-foods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}
.popular-food-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.3s ease;
}
.popular-food-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.food-emoji {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.popular-food-card .food-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}
.popular-food-card .food-calories {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}
.recent-foods-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.recent-food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
}
.recent-food-item:hover {
  background: #f8fafc;
  transform: translateX(4px);
}
.recent-food-item .food-name {
  font-weight: 600;
  color: #1f2937;
}
.recent-food-item .food-calories {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}
@media (max-width: 768px) {
  .foods-view {
    padding: 1rem;
  }
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  .header-content h1 {
    font-size: 1.75rem;
  }
  .toggle-buttons {
    width: 100%;
    max-width: 400px;
  }
  .toggle-button {
    flex: 1;
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
  }
  .popular-foods-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }
  .popular-food-card {
    padding: 1rem;
  }
  .food-emoji {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
}
@media (max-width: 480px) {
  .popular-foods-grid {
    grid-template-columns: 1fr 1fr;
  }
  .recent-food-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>