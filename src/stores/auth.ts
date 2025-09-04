import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/endpoints/auth'
import { setStoredToken, removeStoredToken, getStoredToken } from '@/api/client'
import type { User, LoginCredentials, RegisterData, UserProfile } from '@/types'
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isLoading = computed(() => loading.value)
  const userProfile = computed(() => user.value?.profile)
  const hasCompleteProfile = computed(() => {
    if (!userProfile.value) return false
    const required = ['age', 'gender', 'height_cm', 'weight_kg', 'activity_level', 'goal']
    return required.every(field => userProfile.value![field as keyof UserProfile] != null)
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
  const setUser = (userData: User, authToken: string) => {
    user.value = userData
    token.value = authToken
    setStoredToken(authToken)
    error.value = null
  }
  const clearAuth = () => {
    user.value = null
    token.value = null
    removeStoredToken()
    error.value = null
  }
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      const response = await authApi.login(credentials)
      if (response.success && response.data) {
        setUser(response.data.user, response.data.token)
        return true
      } else {
        setError('Login failed. Please check your credentials.')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
      return false
    } finally {
      loading.value = false
    }
  }
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      const response = await authApi.register(userData)
      if (response.success && response.data) {
        setUser(response.data.user, response.data.token)
        return true
      } else {
        setError('Registration failed. Please try again.')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
      return false
    } finally {
      loading.value = false
    }
  }
  const logout = () => {
    clearAuth()
  }
  const checkAuth = async (): Promise<boolean> => {
    const storedToken = getStoredToken()
    if (!storedToken) {
      clearAuth()
      return false
    }
    try {
      token.value = storedToken
      const response = await authApi.getCurrentUser()
      if (response.success && response.data) {
        user.value = response.data.user
        return true
      } else {
        clearAuth()
        return false
      }
    } catch (err) {
      clearAuth()
      return false
    }
  }
  const updateProfile = async (profileData: Partial<UserProfile>): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      const response = await authApi.updateProfile(profileData)
      if (response.success && response.data) {
        user.value = response.data.user
        return true
      } else {
        setError('Failed to update profile. Please try again.')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.')
      return false
    } finally {
      loading.value = false
    }
  }
  const calculateNutritionTargets = async (profileData: {
    age: number;
    gender: string;
    weight_kg: number;
    height_cm: number;
    activity_level: string;
    goal: string;
  }): Promise<{
    target_calories: number;
    target_protein_g: number;
    target_carbs_g: number;
    target_fat_g: number;
  } | null> => {
    try {
      const response = await authApi.calculateNutritionTargets(profileData)
      if (response.success && response.data) {
        return response.data.targets
      }
      return null
    } catch (err) {
      console.error('Failed to calculate nutrition targets:', err)
      return null
    }
  }
  const refreshUser = async (): Promise<void> => {
    if (!isAuthenticated.value) return
    try {
      const response = await authApi.getCurrentUser()
      if (response.success && response.data) {
        user.value = response.data.user
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err)
    }
  }
  const deleteAccount = async (): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      const response = await authApi.deleteAccount()
      if (response.success) {
        clearAuth()
        return true
      } else {
        setError('Failed to delete account. Please try again.')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account.')
      return false
    } finally {
      loading.value = false
    }
  }
  const initialize = () => {
    window.addEventListener('auth:unauthorized', () => {
      clearAuth()
    })
  }
  return {
      user,
    token,
    loading,
    error,
      isAuthenticated,
    isLoading,
    userProfile,
    hasCompleteProfile,
      login,
    register,
    logout,
    checkAuth,
    updateProfile,
    calculateNutritionTargets,
    refreshUser,
    deleteAccount,
    setError,
    initialize
  }
})