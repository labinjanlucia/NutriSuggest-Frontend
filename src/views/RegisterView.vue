<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="step-progress">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-indicator"
          :class="{ 'active': index === currentStep, 'completed': index < currentStep }"
        >
          <div class="step-number">
            <span v-if="index < currentStep">✓</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="step-label">{{ step.label }}</span>
        </div>
      </div>
      <div class="auth-header">
        <div class="logo-section">
          <div class="app-logo">🥗</div>
          <h1>{{ steps[currentStep].title }}</h1>
        </div>
        <p>{{ steps[currentStep].description }}</p>
      </div>
      <form @submit.prevent="handleNext" class="auth-form">
        <div v-show="currentStep === 0" class="step-content">
          <div class="form-group" :class="{ 'error': errors.email }">
            <label for="email">Email Address</label>
            <div class="input-wrapper">
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-input"
                placeholder="your@email.com"
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
                class="form-input"
                placeholder="Create a strong password"
                @blur="validatePassword"
                @input="clearError('password')"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <div class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :class="passwordStrength.class"
                  :style="{ width: passwordStrength.width + '%' }"
                ></div>
              </div>
              <span class="strength-text">{{ passwordStrength.text }}</span>
            </div>
            <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
          </div>
          <div class="form-group" :class="{ 'error': errors.confirmPassword }">
            <label for="confirmPassword">Confirm Password</label>
            <div class="input-wrapper">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                class="form-input"
                placeholder="Confirm your password"
                @blur="validateConfirmPassword"
                @input="clearError('confirmPassword')"
              />
              <span class="input-icon">🔒</span>
            </div>
            <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
          </div>
        </div>
        <div v-show="currentStep === 1" class="step-content">
          <div class="form-group" :class="{ 'error': errors.firstName }">
            <label for="firstName">First Name</label>
            <div class="input-wrapper">
              <input
                id="firstName"
                v-model="form.firstName"
                type="text"
                class="form-input"
                placeholder="Your first name"
                @blur="validateFirstName"
                @input="clearError('firstName')"
              />
              <span class="input-icon">👤</span>
            </div>
            <span v-if="errors.firstName" class="error-text">{{ errors.firstName }}</span>
          </div>
          <div class="form-group" :class="{ 'error': errors.lastName }">
            <label for="lastName">Last Name</label>
            <div class="input-wrapper">
              <input
                id="lastName"
                v-model="form.lastName"
                type="text"
                class="form-input"
                placeholder="Your last name"
                @blur="validateLastName"
                @input="clearError('lastName')"
              />
              <span class="input-icon">👤</span>
            </div>
            <span v-if="errors.lastName" class="error-text">{{ errors.lastName }}</span>
          </div>
          <div class="form-row">
            <div class="form-group" :class="{ 'error': errors.age }">
              <label for="age">Age</label>
              <div class="input-wrapper">
                <input
                  id="age"
                  v-model.number="form.age"
                  type="number"
                  min="13"
                  max="120"
                  class="form-input"
                  placeholder="25"
                  @blur="validateAge"
                  @input="clearError('age')"
                />
                <span class="input-icon">🎂</span>
              </div>
              <span v-if="errors.age" class="error-text">{{ errors.age }}</span>
            </div>
            <div class="form-group">
              <label for="gender">Gender</label>
              <div class="select-wrapper">
                <select
                  id="gender"
                  v-model="form.gender"
                  class="form-select"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div v-show="currentStep === 2" class="step-content">
          <div class="form-group">
            <label>What's your primary health goal?</label>
            <div class="goal-options">
              <label
                v-for="goal in healthGoals"
                :key="goal.value"
                class="goal-option"
                :class="{ 'selected': form.goal === goal.value }"
              >
                <input
                  type="radio"
                  :value="goal.value"
                  v-model="form.goal"
                  class="goal-radio"
                />
                <div class="goal-content">
                  <span class="goal-icon">{{ goal.icon }}</span>
                  <span class="goal-text">{{ goal.label }}</span>
                </div>
              </label>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="height">Height (cm)</label>
              <div class="input-wrapper">
                <input
                  id="height"
                  v-model.number="form.height"
                  type="number"
                  min="100"
                  max="250"
                  class="form-input"
                  placeholder="170"
                />
                <span class="input-icon">📏</span>
              </div>
            </div>
            <div class="form-group">
              <label for="weight">Weight (kg)</label>
              <div class="input-wrapper">
                <input
                  id="weight"
                  v-model.number="form.weight"
                  type="number"
                  min="30"
                  max="300"
                  class="form-input"
                  placeholder="70"
                />
                <span class="input-icon">⚖️</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="activityLevel">Activity Level</label>
            <div class="select-wrapper">
              <select
                id="activityLevel"
                v-model="form.activityLevel"
                class="form-select"
              >
                <option value="">Select activity level</option>
                <option value="sedentary">Sedentary (little/no exercise)</option>
                <option value="lightly_active">Lightly active (light exercise 1-3 days/week)</option>
                <option value="moderately_active">Moderately active (moderate exercise 3-5 days/week)</option>
                <option value="very_active">Very active (hard exercise 6-7 days/week)</option>
                <option value="extra_active">Extra active (very hard exercise, 2x/day)</option>
              </select>
            </div>
          </div>
        </div>
        <div v-if="authStore.error" class="error-message fade-in">
          <span class="error-icon">⚠️</span>
          {{ authStore.error }}
        </div>
        <div class="form-actions">
          <button
            v-if="currentStep > 0"
            type="button"
            @click="previousStep"
            class="btn btn-secondary"
            :disabled="authStore.isLoading"
          >
            Back
          </button>
          <button
            type="submit"
            :disabled="authStore.isLoading || !canProceed"
            class="btn btn-primary"
            :class="{ 'btn-full': currentStep === 0, 'loading': authStore.isLoading }"
          >
            <div v-if="authStore.isLoading" class="loading-spinner"></div>
            <span v-if="authStore.isLoading">Creating account...</span>
            <span v-else-if="currentStep < steps.length - 1">Continue</span>
            <span v-else>Create Account</span>
          </button>
        </div>
      </form>
      <div class="auth-footer">
        <p>
          Already have an account?
          <router-link to="/login" class="auth-link">Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const router = useRouter()
const authStore = useAuthStore()
const currentStep = ref(0)
const showPassword = ref(false)
const steps = [
  {
    label: 'Account',
    title: 'Create your account',
    description: 'Start by setting up your login credentials'
  },
  {
    label: 'Personal',
    title: 'Tell us about yourself',
    description: 'Help us personalize your experience'
  },
  {
    label: 'Goals',
    title: 'Set your health goals',
    description: 'Let us help you achieve your nutrition targets'
  }
]
const healthGoals = [
  { value: 'weight_loss', label: 'Lose weight', icon: '⬇️' },
  { value: 'weight_gain', label: 'Gain weight', icon: '⬆️' },
  { value: 'muscle_gain', label: 'Build muscle', icon: '💪' },
  { value: 'maintenance', label: 'Maintain weight', icon: '⚖️' },
  { value: 'general_health', label: 'General health', icon: '🌟' }
]
const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  age: null as number | null,
  gender: '',
  goal: '',
  height: null as number | null,
  weight: null as number | null,
  activityLevel: ''
})
const errors = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  age: ''
})
const passwordStrength = computed(() => {
  if (!form.password) return { width: 0, class: '', text: '' }
  let score = 0
  let feedback = []
  if (form.password.length >= 8) score++
  else feedback.push('8+ characters')
  if (/[a-z]/.test(form.password)) score++
  else feedback.push('lowercase')
  if (/[A-Z]/.test(form.password)) score++
  else feedback.push('uppercase')
  if (/\d/.test(form.password)) score++
  else feedback.push('number')
  if (/[^\w\s]/.test(form.password)) score++
  else feedback.push('special char')
  const strength = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  const classes = ['very-weak', 'weak', 'fair', 'good', 'strong']
  return {
    width: (score / 5) * 100,
    class: classes[score - 1] || 'very-weak',
    text: strength[score - 1] || 'Very weak'
  }
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
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
    errors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  } else {
    errors.password = ''
  }
}
const validateConfirmPassword = () => {
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  } else {
    errors.confirmPassword = ''
  }
}
const validateFirstName = () => {
  if (!form.firstName) {
    errors.firstName = 'First name is required'
  } else if (form.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters'
  } else {
    errors.firstName = ''
  }
}
const validateLastName = () => {
  if (!form.lastName) {
    errors.lastName = 'Last name is required'
  } else if (form.lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters'
  } else {
    errors.lastName = ''
  }
}
const validateAge = () => {
  if (!form.age) {
    errors.age = 'Age is required'
  } else if (form.age < 13 || form.age > 120) {
    errors.age = 'Please enter a valid age (13-120)'
  } else {
    errors.age = ''
  }
}
const clearError = (field: keyof typeof errors) => {
  errors[field] = ''
}
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return form.email && form.password && form.confirmPassword &&
             !errors.email && !errors.password && !errors.confirmPassword &&
             form.password === form.confirmPassword
    case 1:
      return form.firstName && form.lastName && form.age &&
             !errors.firstName && !errors.lastName && !errors.age
    case 2:
      return form.goal
    default:
      return false
  }
})
const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}
const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}
const handleNext = async () => {
  if (currentStep.value < steps.length - 1) {
    if (currentStep.value === 0) {
      validateEmail()
      validatePassword()
      validateConfirmPassword()
    } else if (currentStep.value === 1) {
      validateFirstName()
      validateLastName()
      validateAge()
    }
    if (canProceed.value) {
      nextStep()
    }
  } else {
    await handleRegister()
  }
}
const handleRegister = async () => {
  if (!canProceed.value) return
  const success = await authStore.register({
    email: form.email,
    password: form.password,
    confirmPassword: form.confirmPassword
  })
  if (success) {
    router.push('/dashboard')
  }
}
</script>
<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.auth-container {
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
}
.auth-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 520px;
  max-width: 90vw;
  max-height: calc(100vh - 2rem);
  padding: 2rem;
  transform: translateY(0);
  transition: all 0.3s ease;
  box-sizing: border-box;
  position: relative;
  animation: fadeIn 0.6s ease;
  overflow-y: auto;
  margin: auto;
}
.step-progress {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
}
.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  position: relative;
}
.step-indicator:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 20px;
  left: 60%;
  right: -40%;
  height: 2px;
  background: #e5e7eb;
  transition: background 0.3s ease;
}
.step-indicator.completed:not(:last-child)::after {
  background: #3b82f6;
}
.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}
.step-indicator.active .step-number {
  background: #3b82f6;
  color: white;
  transform: scale(1.1);
}
.step-indicator.completed .step-number {
  background: #10b981;
  color: white;
}
.step-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-align: center;
}
.step-indicator.active .step-label {
  color: #3b82f6;
  font-weight: 600;
}
.step-indicator.completed .step-label {
  color: #10b981;
}
.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.app-logo {
  font-size: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}
.auth-header h1 {
  font-size: 2rem;
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
  gap: 1.5rem;
}
.step-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: slideIn 0.4s ease;
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
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.input-wrapper,
.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s ease;
}
.input-wrapper:focus-within,
.select-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}
.form-input,
.form-select {
  flex: 1;
  padding: 1.125rem 1rem 1.125rem 3rem;
  border: none;
  outline: none;
  font-size: 1.05rem;
  background: transparent;
}
.form-select {
  padding-left: 1rem;
  cursor: pointer;
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
.password-strength {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}
.strength-bar {
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}
.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}
.strength-fill.very-weak { background: #ef4444; }
.strength-fill.weak { background: #f97316; }
.strength-fill.fair { background: #eab308; }
.strength-fill.good { background: #22c55e; }
.strength-fill.strong { background: #10b981; }
.strength-text {
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 60px;
}
.goal-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.goal-option {
  position: relative;
  cursor: pointer;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
  background: white;
}
.goal-option:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.goal-option.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}
.goal-radio {
  position: absolute;
  opacity: 0;
}
.goal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}
.goal-icon {
  font-size: 2rem;
}
.goal-text {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}
.error-text {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  animation: fadeIn 0.3s ease;
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
.error-icon {
  font-size: 1.2rem;
}
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
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
  flex: 1;
}
.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}
.btn-secondary {
  background: #f8fafc;
  color: #64748b;
  border: 2px solid #e2e8f0;
}
.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
}
.btn-full {
  flex: none;
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
.auth-footer {
  margin-top: 2rem;
  text-align: center;
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
  .auth-card {
    max-width: 640px;
    padding: 3.5rem;
  }
  .auth-header h1 {
    font-size: 2.25rem;
  }
  .form-input,
  .form-select {
    padding: 1.25rem 1rem 1.25rem 3rem;
    font-size: 1.1rem;
  }
  .btn {
    padding: 1.25rem 2.5rem;
    font-size: 1.1rem;
  }
  .goal-options {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 1200px) {
  .auth-card {
    max-width: 720px;
    padding: 4rem;
  }
  .auth-header h1 {
    font-size: 2.5rem;
  }
  .goal-options {
    grid-template-columns: repeat(5, 1fr);
  }
}
@media (max-width: 768px) {
  .auth-card {
    max-width: 520px;
  }
  .goal-options {
    grid-template-columns: 1fr 1fr;
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
  .form-row {
    grid-template-columns: 1fr;
  }
  .goal-options {
    grid-template-columns: 1fr;
  }
  .step-progress {
    padding: 0;
  }
  .step-label {
    display: none;
  }
  .form-input,
  .form-select {
    padding: 1rem 1rem 1rem 3rem;
    font-size: 1rem;
  }
  .btn {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
}
</style>