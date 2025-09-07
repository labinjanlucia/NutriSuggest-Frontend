import { get, post, put, del, handleApiError } from '../client'
import type {
  Food,
  CreateFoodData,
  FoodSearchParams,
  FoodsResponse,
  FoodResponse
} from '@/types'
export const foodsApi = {
  async searchFoods(params: any = {}): Promise<FoodsResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params.q) queryParams.append('search', params.q)
      if (params.search) queryParams.append('search', params.search)
      if (params.brand) queryParams.append('brand', params.brand)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.created_by_me === 'true' || params.created_by_me === true) {
        queryParams.append('created_by_me', 'true')
        queryParams.append('show_public', 'false')
      }
      if (params.is_public === 'true' || params.is_public === true) {
        queryParams.append('show_public', 'true')
        queryParams.append('created_by_me', 'false')
      }
      const url = `/foods/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await get<FoodsResponse>(url)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getPopularFoods(): Promise<FoodsResponse> {
    try {
      const response = await get<FoodsResponse>('/foods/popular')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getUserFoods(page: number = 1, limit: number = 10): Promise<FoodsResponse> {
    try {
      const response = await get<FoodsResponse>(`/foods/my/foods?page=${page}&limit=${limit}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getFoodById(id: number): Promise<FoodResponse> {
    try {
      const response = await get<FoodResponse>(`/foods/${id}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getFoodNutrition(id: number, quantity?: number): Promise<{
    success: boolean;
    data?: {
      nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
      };
      quantity_grams: number;
    };
  }> {
    try {
      const url = `/foods/${id}/nutrition${quantity ? `?quantity=${quantity}` : ''}`
      const response = await get(url)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async createFood(foodData: CreateFoodData): Promise<FoodResponse> {
    try {
      const response = await post<FoodResponse>('/foods', foodData)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async updateFood(id: number, foodData: Partial<CreateFoodData>): Promise<FoodResponse> {
    try {
      const response = await put<FoodResponse>(`/foods/${id}`, foodData)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async deleteFood(id: number): Promise<{ success: boolean }> {
    try {
      const response = await del(`/foods/${id}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getFoodByBarcode(barcode: string): Promise<FoodResponse> {
    try {
      const response = await get<FoodResponse>(`/foods/barcode/${barcode}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}
export default foodsApi