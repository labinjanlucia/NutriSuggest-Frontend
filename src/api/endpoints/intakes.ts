import { get, post, put, del, handleApiError, recommendationGet, recommendationPost } from '../client'
import type {
  Intake,
  CreateIntakeData,
  CreateIntakeItem,
  IntakeQueryParams,
  IntakesResponse,
  IntakeResponse,
  DailyNutritionResponse,
  RecommendationResponse
} from '@/types'
export const intakesApi = {
  async getIntakes(params: IntakeQueryParams = {}): Promise<IntakesResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      const url = `/intakes${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await get<IntakesResponse>(url)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getIntakeById(id: number): Promise<IntakeResponse> {
    try {
      const response = await get<IntakeResponse>(`/intakes/${id}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getTodayNutrition(): Promise<DailyNutritionResponse> {
    try {
      const response = await get<DailyNutritionResponse>('/intakes/nutrition/today')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getDailyNutrition(date: string): Promise<DailyNutritionResponse> {
    try {
      const response = await get<DailyNutritionResponse>(`/intakes/nutrition/daily/${date}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getWeeklyNutrition(startDate: string): Promise<{
    success: boolean;
    data?: {
      week_start: string;
      daily_nutrition: Array<{
        date: string;
        total: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
        };
        targets: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        };
        progress: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        };
      }>;
      weekly_averages: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      };
      weekly_targets: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    };
  }> {
    try {
      const response = await get(`/intakes/nutrition/weekly/${startDate}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async createIntake(intakeData: CreateIntakeData): Promise<IntakeResponse> {
    try {
      const response = await post<IntakeResponse>('/intakes', intakeData)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async updateIntake(id: number, intakeData: Partial<CreateIntakeData>): Promise<IntakeResponse> {
    try {
      const response = await put<IntakeResponse>(`/intakes/${id}`, intakeData)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async deleteIntake(id: number): Promise<{ success: boolean }> {
    try {
      const response = await del(`/intakes/${id}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async addIntakeItem(intakeId: number, item: CreateIntakeItem): Promise<IntakeResponse> {
    try {
      const response = await post<IntakeResponse>(`/intakes/${intakeId}/items`, item)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async removeIntakeItem(intakeId: number, itemId: number): Promise<IntakeResponse> {
    try {
      const response = await del<IntakeResponse>(`/intakes/${intakeId}/items/${itemId}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async logFood(foodId: number, quantity: number, mealType: string, consumedAt?: string): Promise<IntakeResponse> {
    const intakeData: CreateIntakeData = {
      consumed_at: consumedAt || new Date().toISOString(),
      meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      items: [{
        food_id: foodId,
        quantity_grams: quantity
      }]
    }
    return this.createIntake(intakeData)
  },
  async logRecipe(recipeId: number, servings: number, mealType: string, consumedAt?: string): Promise<IntakeResponse> {
    const intakeData: CreateIntakeData = {
      consumed_at: consumedAt || new Date().toISOString(),
      meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      items: [{
        recipe_id: recipeId,
        quantity_grams: servings * 100
      }]
    }
    return this.createIntake(intakeData)
  }
}
export const recommendationsApi = {
  async getNextMealRecommendations(params: {
    user_id: number;
    target_calories: number;
    consumed_calories?: number;
    consumed_protein?: number;
    consumed_carbs?: number;
    consumed_fat?: number;
    meal_type?: string;
  }): Promise<RecommendationResponse> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('user_id', params.user_id.toString())
      queryParams.append('target_calories', params.target_calories.toString())
      if (params.consumed_calories) queryParams.append('consumed_calories', params.consumed_calories.toString())
      if (params.consumed_protein) queryParams.append('consumed_protein', params.consumed_protein.toString())
      if (params.consumed_carbs) queryParams.append('consumed_carbs', params.consumed_carbs.toString())
      if (params.consumed_fat) queryParams.append('consumed_fat', params.consumed_fat.toString())
      if (params.meal_type) queryParams.append('meal_type', params.meal_type)
      const response = await recommendationGet<RecommendationResponse>(`/recommend/next-meal?${queryParams.toString()}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async generateDailyPlan(data: {
    user_id: number;
    user_profile: {
      age: number;
      gender: string;
      height_cm: number;
      weight_kg: number;
      activity_level: string;
      goal: string;
    };
    target_calories?: number;
    preferences?: string[];
    restrictions?: string[];
  }): Promise<{
    success: boolean;
    data?: {
      date: string;
      target_calories: number;
      target_protein: number;
      target_carbs: number;
      target_fat: number;
      meals: Array<{
        meal_type: string;
        foods: any[];
        recipes: any[];
        total_calories: number;
        total_protein: number;
        total_carbs: number;
        total_fat: number;
      }>;
      nutrition_score: number;
      recommendations: string[];
    };
  }> {
    try {
      const response = await recommendationPost('/recommend/daily-plan', data)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async analyzeNutritionGaps(data: {
    user_id: number;
    current_intake: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    target_calories: number;
    target_protein: number;
    target_carbs: number;
    target_fat: number;
    meal_type?: string;
  }): Promise<{
    success: boolean;
    data?: {
      gaps: Array<{
        nutrient: string;
        current: number;
        target: number;
        deficit: number;
        surplus: number;
        percentage_met: number;
        status: string;
      }>;
      priority_nutrients: string[];
      recommended_foods: any[];
      actionable_tips: string[];
      overall_score: number;
    };
  }> {
    try {
      const response = await recommendationPost('/recommend/analyze-gaps', data)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}
export default intakesApi