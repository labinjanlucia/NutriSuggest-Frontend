<template>
  <div class="auth-container">
    <div class="auth-card" :class="{ 'shake': hasError }">
      <div class="auth-header">
        <div class="logo-section">
          <div class="app-logo">🥗</div>
          <h1>Welcome back</h1>
        </div>
        <p>Sign in to your NutriSuggest account</p>
      </div>
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group" :class="{ 'error': errors.email }">
          <label for="email">Email</label>
          <div class="input-wrapper">
            <input
              id="email"
              v-model="form.email"
              type="email"
              :disabled="authStore.isLoading"
              class="form-input"
              placeholder="Enter your email"
              @blur="validateEmail"
              @input="clearError('email')"
            />
            <span class="input-icon">📧</span>
          </div>
          <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
        </div>
        <div class="form-group" :class="{ 'error': errors.password }">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :disabled="authStore.isLoading"
              class="form-input"
              placeholder="Enter your password"
              @blur="validatePassword"
              @input="clearError('password')"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="authStore.isLoading"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>
        <div class="form-actions">
          <button
            type="submit"
            :disabled="authStore.isLoading || !isFormValid"
            class="btn btn-primary btn-full"
            :class="{ 'loading': authStore.isLoading }"
          >
            <div v-if="authStore.isLoading" class="loading-spinner"></div>
            <span v-if="authStore.isLoading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </div>
        <div v-if="authStore.error" class="error-message fade-in">
          <span class="error-icon">⚠️</span>
          {{ authStore.error }}
        </div>
      </form>
      <div class="auth-footer">
        <p>
          Don't have an account?
          <router-link to="/register" class="auth-link">Sign up</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const router = useRouter()
const authStore = useAuthStore()
const showPassword = ref(false)
const hasError = ref(false)
const form = reactive({
  email: '',
  password: ''
})
const errors = reactive({
  email: '',
  password: ''
})
const isFormValid = computed(() => {
  return form.email && form.password && !errors.email && !errors.password
})
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email) {
    errors.email = 'Email is required'
  } else if (!emailRegex.test(form.email)) {
    errors.email = 'Please enter a valid email address'
  } else {
    errors.email = ''
  }
}
const validatePassword = () => {
  if (!form.password) {
    errors.password = 'Password is required'
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  } else {
    errors.password = ''
  }
}
const clearError = (field: keyof typeof errors) => {
  errors[field] = ''
}
watch(
  () => authStore.error,
  (newError) => {
    if (newError) {
      hasError.value = true
      setTimeout(() => {
        hasError.value = false
      }, 600)
    }
  }
)
const handleLogin = async () => {
  if (authStore.isLoading) return
  validateEmail()
  validatePassword()
  if (!isFormValid.value) return
  try {
    const success = await authStore.login({
      email: form.email,
      password: form.password
    })
    if (success) {
      const redirect = router.currentRoute.value.query.redirect as string
      router.push(redirect || '/dashboard')
    }
  } catch (error) {
    console.error('Login failed:', error)
  }
}
</script>
<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.auth-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
}
.auth-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 420px;
  max-width: 90vw;
  padding: 2.5rem;
  transform: translateY(0);
  transition: all 0.3s ease;
  box-sizing: border-box;
  position: relative;
}
.auth-card.shake {
  animation: shake 0.6s ease-in-out;
}
.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.app-logo {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}
.auth-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}
.auth-header p {
  color: #6b7280;
  margin: 0;
  font-size: 1rem;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.3s ease;
}
.form-group.error .input-wrapper {
  border-color: #ef4444;
}
.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s ease;
}
.input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}
.form-input {
  flex: 1;
  padding: 1.125rem 1rem 1.125rem 3rem;
  border: none;
  outline: none;
  font-size: 1.05rem;
  background: transparent;
}
.form-input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}
.input-icon {
  position: absolute;
  left: 1rem;
  color: #9ca3af;
  font-size: 1.2rem;
}
.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.password-toggle:hover {
  background-color: #f3f4f6;
}
.error-text {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  animation: fadeIn 0.3s ease;
}
.form-actions {
  margin-top: 0.5rem;
}
.btn {
  padding: 1.125rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
}
.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}
.btn-primary:active {
  transform: translateY(0);
}
.btn-full {
  width: 100%;
}
.btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff40;
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.error-message {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: fadeIn 0.3s ease;
}
.fade-in {
  animation: fadeIn 0.3s ease;
}
.error-icon {
  font-size: 1.2rem;
}
.auth-footer {
  margin-top: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.auth-footer p {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}
.auth-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}
.auth-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}
@media (min-width: 769px) {
  .auth-container {
    padding: 2rem;
  }
  .auth-card {
    max-width: 480px;
    padding: 3rem;
  }
  .auth-header h1 {
    font-size: 2.25rem;
  }
  .form-input {
    padding: 1.125rem 1rem 1.125rem 3rem;
    font-size: 1.05rem;
  }
  .btn {
    padding: 1.125rem 2rem;
    font-size: 1.05rem;
  }
}
@media (min-width: 1200px) {
  .auth-card {
    max-width: 500px;
    padding: 3.25rem;
  }
  .auth-header h1 {
    font-size: 2.5rem;
  }
}
@media (max-width: 768px) {
  .auth-card {
    max-width: 420px;
  }
}
@media (max-width: 480px) {
  .auth-container {
    padding: 0.5rem;
  }
  .auth-card {
    padding: 1.5rem;
    max-width: 100%;
  }
  .app-logo {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }
  .auth-header h1 {
    font-size: 1.5rem;
  }
  .form-input {
    padding: 1rem 1rem 1rem 3rem;
    font-size: 1rem;
  }
  .btn {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
}
</style>