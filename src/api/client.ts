import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const RECOMMENDATION_API_URL = import.meta.env.VITE_RECOMMENDATION_API_URL || 'http://localhost:8000/api'
const TOKEN_KEY = 'nutrisuggest_token'
export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}
export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}
export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})
export const recommendationClient: AxiosInstance = axios.create({
  baseURL: RECOMMENDATION_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})
const attachTokenInterceptor = (config: any): any => {
  const token = getStoredToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}
const responseInterceptor = (response: AxiosResponse) => response
const errorInterceptor = (error: AxiosError) => {
  if (error.response) {
    const status = error.response.status
    switch (status) {
      case 401:
        removeStoredToken()
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        break
      case 403:
        console.error('Access forbidden:', error.response.data)
        break
      case 404:
        console.error('Resource not found:', error.response.data)
        break
      case 422:
        console.error('Validation error:', error.response.data)
        break
      case 500:
        console.error('Server error:', error.response.data)
        break
      default:
        console.error(`HTTP ${status}:`, error.response.data)
    }
  } else if (error.request) {
    console.error('Network error:', error.request)
    window.dispatchEvent(new CustomEvent('network:error', {
      detail: { message: 'Network connection failed. Please check your internet connection.' }
    }))
  } else {
    console.error('Request error:', error.message)
  }
  return Promise.reject(error)
}
apiClient.interceptors.request.use(attachTokenInterceptor)
apiClient.interceptors.response.use(responseInterceptor, errorInterceptor)
recommendationClient.interceptors.request.use(attachTokenInterceptor)
recommendationClient.interceptors.response.use(responseInterceptor, errorInterceptor)
export const handleApiError = (error: unknown): string => {
  const err = error as any
  if (err.response?.data?.error) {
    return err.response.data.error
  }
  if (err.response?.data?.message) {
    return err.response.data.message
  }
  if (err.message) {
    return err.message
  }
  return 'An unexpected error occurred'
}
export const isNetworkError = (error: unknown): boolean => {
  const err = error as any
  return !err.response && err.request
}
export const isValidationError = (error: unknown): boolean => {
  const err = error as any
  return err.response?.status === 422 || err.response?.status === 400
}
export const getValidationErrors = (error: unknown): Record<string, string> => {
  const errors: Record<string, string> = {}
  const err = error as any
  if (err.response?.data?.details) {
    const details = err.response.data.details
    if (Array.isArray(details)) {
      details.forEach((errItem: any) => {
        if (errItem.path && errItem.path.length > 0) {
          const field = errItem.path[errItem.path.length - 1]
          errors[field] = errItem.message
        }
      })
    } else if (typeof details === 'object') {
      Object.keys(details).forEach(field => {
        errors[field] = details[field]
      })
    }
  }
  return errors
}
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      const err = error as any
      if (err.response?.status >= 400 &&
          err.response?.status < 500 &&
          err.response?.status !== 429) {
        throw error
      }
      if (i === maxRetries) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  throw lastError
}
export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.get<T>(url, config)
}
export const post = <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.post<T>(url, data, config)
}
export const put = <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.put<T>(url, data, config)
}
export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.delete<T>(url, config)
}
export const recommendationGet = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return recommendationClient.get<T>(url, config)
}
export const recommendationPost = <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return recommendationClient.post<T>(url, data, config)
}
export default apiClient