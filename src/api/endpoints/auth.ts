import { get, post, put, handleApiError } from '../client'
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  UserResponse,
  UserProfile
} from '@/types'
export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await post<AuthResponse>('/auth/login', credentials)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await post<AuthResponse>('/auth/register', userData)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await get<UserResponse>('/auth/me')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserResponse> {
    try {
      const response = await put<UserResponse>('/auth/profile', profileData)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async deleteAccount(): Promise<{ success: boolean }> {
    try {
      const response = await post<{ success: boolean }>('/auth/delete-account', {})
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
  async calculateNutritionTargets(profileData: {
    age: number;
    gender: string;
    weight_kg: number;
    height_cm: number;
    activity_level: string;
    goal: string;
  }): Promise<{
    success: boolean;
    data?: {
      targets: {
        target_calories: number;
        target_protein_g: number;
        target_carbs_g: number;
        target_fat_g: number;
      };
    };
  }> {
    try {
      const response = await post('/auth/calculate-targets', profileData)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}
export default authApi