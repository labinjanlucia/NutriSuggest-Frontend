import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { intakesApi, recommendationsApi } from '@/api/endpoints/intakes'
import { useAuthStore } from './auth'
import type {
  Intake,
  DailyNutrition,
  NutritionTotals,
  NextMealRecommendations
} from '@/types'
export const useNutritionStore = defineStore('nutrition', () => {
  const todayIntakes = ref<Intake[]>([])
  const dailyNutrition = ref<DailyNutrition | null>(null)
  const weeklyData = ref<any[]>([])
  const recommendations = ref<NextMealRecommendations | null>(null)
  const loading = ref({
    today: false,
    daily: false,
    weekly: false,
    recommendations: false,
    creating: false
  })
  const error = ref<string | null>(null)
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0])
  const todayTotal = computed((): NutritionTotals => {
    return dailyNutrition.value?.total || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    }
  })
  const todayTargets = computed(() => {
    return dailyNutrition.value?.targets || {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65
    }
  })
  const todayProgress = computed(() => {
    const total = todayTotal.value
    const targets = todayTargets.value
    return {
      calories: targets.calories > 0 ? (total.calories / targets.calories) * 100 : 0,
      protein: targets.protein > 0 ? (total.protein / targets.protein) * 100 : 0,
      carbs: targets.carbs > 0 ? (total.carbs / targets.carbs) * 100 : 0,
      fat: targets.fat > 0 ? (total.fat / targets.fat) * 100 : 0
    }
  })
  const remainingNutrients = computed(() => {
    const total = todayTotal.value
    const targets = todayTargets.value
    return {
      calories: Math.max(0, targets.calories - total.calories),
      protein: Math.max(0, targets.protein - total.protein),
      carbs: Math.max(0, targets.carbs - total.carbs),
      fat: Math.max(0, targets.fat - total.fat)
    }
  })
  const mealDistribution = computed(() => {
    if (!dailyNutrition.value) return {}
    const byMeal = dailyNutrition.value.by_meal
    return {
      breakfast: byMeal.breakfast,
      lunch: byMeal.lunch,
      dinner: byMeal.dinner,
      snack: byMeal.snack
    }
  })
  const overallNutritionScore = computed(() => {
    const progress = todayProgress.value
    const scores = [
      Math.min(progress.calories / 100, 1),
      Math.min(progress.protein / 100, 1),
      Math.min(progress.carbs / 100, 1),
      Math.min(progress.fat / 100, 1)
    ]
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 100)
  })
  const setError = (message: string | null) => {
    error.value = message
    if (message) {
      setTimeout(() => {
        if (error.value === message) {
          error.value = null
        }
      }, 5000)
    }
  }
  const fetchTodayNutrition = async (): Promise<void> => {
    try {
      loading.value.today = true
      error.value = null
      const response = await intakesApi.getTodayNutrition()
      if (response.success && response.data) {
        dailyNutrition.value = response.data.nutrition
        todayIntakes.value = response.data.nutrition.intakes
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch today\'s nutrition data')
    } finally {
      loading.value.today = false
    }
  }
  const fetchDailyNutrition = async (date: string): Promise<void> => {
    try {
      loading.value.daily = true
      error.value = null
      const response = await intakesApi.getDailyNutrition(date)
      if (response.success && response.data) {
        dailyNutrition.value = response.data.nutrition
        selectedDate.value = date
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily nutrition data')
    } finally {
      loading.value.daily = false
    }
  }
  const fetchWeeklyNutrition = async (startDate: string): Promise<void> => {
    try {
      loading.value.weekly = true
      error.value = null
      const response = await intakesApi.getWeeklyNutrition(startDate)
      if (response.success && response.data) {
        weeklyData.value = response.data.daily_nutrition
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weekly nutrition data')
    } finally {
      loading.value.weekly = false
    }
  }
  const getNextMealRecommendations = async (mealType: string = 'lunch'): Promise<void> => {
    const authStore = useAuthStore()
    if (!authStore.user || !authStore.userProfile) {
      setError('User profile is required for recommendations')
      return
    }
    try {
      loading.value.recommendations = true
      error.value = null
      const total = todayTotal.value
      const targets = todayTargets.value
      const response = await recommendationsApi.getNextMealRecommendations({
        user_id: authStore.user.id,
        target_calories: targets.calories,
        consumed_calories: total.calories,
        consumed_protein: total.protein,
        consumed_carbs: total.carbs,
        consumed_fat: total.fat,
        meal_type: mealType
      })
      if (response.success && response.data) {
        recommendations.value = response.data
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get meal recommendations')
    } finally {
      loading.value.recommendations = false
    }
  }
  const logQuickFood = async (foodId: number, quantity: number, mealType: string): Promise<boolean> => {
    try {
      loading.value.creating = true
      error.value = null
      const response = await intakesApi.logFood(foodId, quantity, mealType)
      if (response.success) {
        await fetchTodayNutrition()
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log food')
      return false
    } finally {
      loading.value.creating = false
    }
  }
  const logQuickRecipe = async (recipeId: number, servings: number, mealType: string): Promise<boolean> => {
    try {
      loading.value.creating = true
      error.value = null
      const response = await intakesApi.logRecipe(recipeId, servings, mealType)
      if (response.success) {
        await fetchTodayNutrition()
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log recipe')
      return false
    } finally {
      loading.value.creating = false
    }
  }
  const deleteIntake = async (intakeId: number): Promise<boolean> => {
    try {
      const response = await intakesApi.deleteIntake(intakeId)
      if (response.success) {
        await fetchTodayNutrition()
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete intake')
      return false
    }
  }
  const addFoodToMeal = async (data: {
    food: any,
    quantity_grams: number,
    meal_type: string
  }): Promise<boolean> => {
    try {
      loading.value.creating = true
      error.value = null
      const intakeData = {
        consumed_at: new Date().toISOString(),
        meal_type: data.meal_type,
        items: [{
          food_id: data.food.id,
          quantity_grams: data.quantity_grams
        }]
      }
      const response = await intakesApi.createIntake(intakeData)
      if (response.success) {
        await fetchTodayNutrition()
        return true
      }
      setError('Failed to add food to meal')
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add food to meal')
      return false
    } finally {
      loading.value.creating = false
    }
  }
  const addRecipeToMeal = async (data: {
    recipe: any,
    servings: number,
    meal_type: string
  }): Promise<boolean> => {
    try {
      loading.value.creating = true
      error.value = null
      const quantity_grams = data.servings * 100
      const intakeData = {
        consumed_at: new Date().toISOString(),
        meal_type: data.meal_type,
        items: [{
          recipe_id: data.recipe.id,
          quantity_grams: quantity_grams
        }]
      }
      const response = await intakesApi.createIntake(intakeData)
      if (response.success) {
        await fetchTodayNutrition()
        return true
      }
      setError('Failed to add recipe to meal')
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recipe to meal')
      return false
    } finally {
      loading.value.creating = false
    }
  }
  const refreshCurrentDay = async (): Promise<void> => {
    const isToday = selectedDate.value === new Date().toISOString().split('T')[0]
    if (isToday) {
      await fetchTodayNutrition()
    } else {
      await fetchDailyNutrition(selectedDate.value)
    }
  }
  const formatNutrientValue = (value: number, unit: string = 'g'): string => {
    if (value < 1 && unit === 'g') {
      return `${Math.round(value * 1000)}mg`
    }
    return `${Math.round(value * 10) / 10}${unit}`
  }
  const getNutrientColor = (progress: number): string => {
    if (progress < 50) return '#ef4444'
    if (progress < 80) return '#f59e0b'
    if (progress <= 110) return '#10b981'
    return '#f59e0b'
  }
  const getMealTypeIcon = (mealType: string): string => {
    const icons = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍎'
    }
    return icons[mealType as keyof typeof icons] || '🍽️'
  }
  const initialize = async (): Promise<void> => {
    await fetchTodayNutrition()
  }
  return {
      todayIntakes,
    dailyNutrition,
    weeklyData,
    recommendations,
    loading,
    error,
    selectedDate,
      todayTotal,
    todayTargets,
    todayProgress,
    remainingNutrients,
    mealDistribution,
    overallNutritionScore,
      fetchTodayNutrition,
    fetchDailyNutrition,
    fetchWeeklyNutrition,
    getNextMealRecommendations,
    logQuickFood,
    logQuickRecipe,
    deleteIntake,
    addFoodToMeal,
    addRecipeToMeal,
    refreshCurrentDay,
    setError,
    formatNutrientValue,
    getNutrientColor,
    getMealTypeIcon,
    initialize
  }
})