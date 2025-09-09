import { get, post, put, del, handleApiError } from '../client'
import type {
  Recipe,
  CreateRecipeData,
  RecipeSearchParams,
  RecipesResponse,
  RecipeResponse
} from '@/types'
export const recipesApi = {
  async searchRecipes(params: any = {}): Promise<RecipesResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params.q) queryParams.append('q', params.q)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.my_recipes !== undefined) {
        queryParams.append('my_recipes', params.my_recipes.toString())
      }
      if (params.show_public !== undefined) {
        queryParams.append('show_public', params.show_public.toString())
      }
      if (params.created_by_me === 'true' || params.created_by_me === true) {
        queryParams.append('my_recipes', 'true')
        queryParams.append('show_public', 'false')
      }
      if (params.is_public === 'true' || params.is_public === true) {
        queryParams.append('show_public', 'true')
        queryParams.append('my_recipes', 'false')
      }
      const url = `/recipes/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await get<RecipesResponse>(url)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getPopularRecipes(): Promise<RecipesResponse> {
    try {
      const response = await get<RecipesResponse>('/recipes/popular')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getUserRecipes(page: number = 1, limit: number = 10): Promise<RecipesResponse> {
    try {
      const response = await get<RecipesResponse>(`/recipes/my/recipes?page=${page}&limit=${limit}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getRecipeById(id: number): Promise<RecipeResponse> {
    try {
      const response = await get<RecipeResponse>(`/recipes/${id}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getRecipeNutrition(id: number, servings?: number): Promise<{
    success: boolean;
    data?: {
      nutrition: {
        total: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
        };
        per_serving: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
        };
      };
      servings: number;
    };
  }> {
    try {
      const url = `/recipes/${id}/nutrition${servings ? `?servings=${servings}` : ''}`
      const response = await get(url)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async createRecipe(recipeData: CreateRecipeData): Promise<RecipeResponse> {
    try {
      const response = await post<RecipeResponse>('/recipes', recipeData)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async updateRecipe(id: number, recipeData: Partial<CreateRecipeData>): Promise<RecipeResponse> {
    try {
      const response = await put<RecipeResponse>(`/recipes/${id}`, recipeData)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async deleteRecipe(id: number): Promise<{ success: boolean }> {
    try {
      const response = await del(`/recipes/${id}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async addIngredient(recipeId: number, ingredient: {
    food_id: number;
    quantity_grams: number;
  }): Promise<RecipeResponse> {
    try {
      const response = await post<RecipeResponse>(`/recipes/${recipeId}/ingredients`, ingredient)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async updateIngredient(recipeId: number, ingredientId: number, data: {
    quantity_grams: number;
  }): Promise<RecipeResponse> {
    try {
      const response = await put<RecipeResponse>(`/recipes/${recipeId}/ingredients/${ingredientId}`, data)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async removeIngredient(recipeId: number, ingredientId: number): Promise<RecipeResponse> {
    try {
      const response = await del<RecipeResponse>(`/recipes/${recipeId}/ingredients/${ingredientId}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}
export default recipesApi