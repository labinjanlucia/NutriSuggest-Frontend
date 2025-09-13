<template>
  <div class="profile-view">
    <div class="profile-header">
      <h1>Profile Settings</h1>
      <p>Update your personal information and nutrition goals</p>
    </div>
    <div class="profile-content">
      <form @submit.prevent="handleSubmit" class="profile-form">
        <div class="form-section">
          <h2>Personal Information</h2>
          <div class="form-row">
            <div class="form-group">
              <label for="age">Age</label>
              <input
                id="age"
                v-model.number="form.age"
                type="number"
                min="13"
                max="120"
                placeholder="Enter your age"
              />
            </div>
            <div class="form-group">
              <label for="gender">Gender</label>
              <select id="gender" v-model="form.gender">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="height">Height (cm)</label>
              <input
                id="height"
                v-model.number="form.height_cm"
                type="number"
                min="100"
                max="250"
                placeholder="Enter height in cm"
              />
            </div>
            <div class="form-group">
              <label for="weight">Weight (kg)</label>
              <input
                id="weight"
                v-model.number="form.weight_kg"
                type="number"
                min="30"
                max="300"
                step="0.1"
                placeholder="Enter weight in kg"
              />
            </div>
          </div>
        </div>
        <div class="form-section">
          <h2>Activity & Goals</h2>
          <div class="form-group">
            <label for="activity">Activity Level</label>
            <select id="activity" v-model="form.activity_level">
              <option value="">Select activity level</option>
              <option value="sedentary">Sedentary (little/no exercise)</option>
              <option value="light">Lightly active (light exercise 1-3 days/week)</option>
              <option value="moderate">Moderately active (moderate exercise 3-5 days/week)</option>
              <option value="active">Active (hard exercise 6-7 days/week)</option>
              <option value="very_active">Very active (very hard exercise/physical job)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="goal">Goal</label>
            <select id="goal" v-model="form.goal">
              <option value="">Select your goal</option>
              <option value="lose_weight">Lose weight</option>
              <option value="maintain">Maintain current weight</option>
              <option value="gain_weight">Gain weight</option>
              <option value="gain_muscle">Build muscle</option>
            </select>
          </div>
        </div>
        <div class="form-section">
          <h2>💧 Water Goal</h2>
          <div class="form-group">
            <label for="waterGoal">Daily Water Target (ml)</label>
            <input
              id="waterGoal"
              v-model.number="form.target_water_ml"
              type="number"
              min="500"
              max="5000"
              step="50"
              placeholder="Enter daily water goal in ml"
            />
            <div class="field-hint">
              Recommended: 2000ml (about 8 glasses). Adjust based on your activity level.
            </div>
          </div>
        </div>
        <div v-if="calculatedTargets || isCalculating" class="calculated-targets">
          <h2>
            <LoadingSpinner v-if="isCalculating" size="small" />
            {{ isCalculating ? 'Calculating Your Targets...' : 'Your Nutrition Targets' }}
          </h2>
          <div v-if="calculatedTargets && !isCalculating" class="targets-grid">
            <div class="target-item">
              <span class="target-label">Daily Calories</span>
              <span class="target-value">{{ calculatedTargets.target_calories }}</span>
            </div>
            <div class="target-item">
              <span class="target-label">Protein</span>
              <span class="target-value">{{ calculatedTargets.target_protein_g }}g</span>
            </div>
            <div class="target-item">
              <span class="target-label">Carbs</span>
              <span class="target-value">{{ calculatedTargets.target_carbs_g }}g</span>
            </div>
            <div class="target-item">
              <span class="target-label">Fat</span>
              <span class="target-value">{{ calculatedTargets.target_fat_g }}g</span>
            </div>
          </div>
        </div>
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>
        <div class="form-actions">
          <button
            type="submit"
            class="save-button"
            :disabled="authStore.isLoading || !canCalculate"
          >
            <LoadingSpinner v-if="authStore.isLoading" size="small" />
            {{ authStore.isLoading ? 'Saving...' : 'Save Profile' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
const router = useRouter()
const authStore = useAuthStore()
const calculatedTargets = ref<any>(null)
const isCalculating = ref(false)
const form = reactive({
  age: null as number | null,
  gender: '',
  height_cm: null as number | null,
  weight_kg: null as number | null,
  activity_level: '',
  goal: '',
  target_water_ml: 2000 as number | null
})
const canCalculate = computed(() => {
  return form.age && form.gender && form.height_cm && form.weight_kg && form.activity_level && form.goal
})
const calculateTargets = async () => {
  console.log('DEBUG: calculateTargets called - canCalculate.value:', canCalculate.value)
  if (!canCalculate.value) {
    console.log('DEBUG: calculateTargets early return - canCalculate is false')
    return
  }
  
  console.log('DEBUG: calculateTargets - starting calculation with form data:', {
    age: form.age,
    gender: form.gender,
    weight_kg: form.weight_kg,
    height_cm: form.height_cm,
    activity_level: form.activity_level,
    goal: form.goal
  })
  
  isCalculating.value = true
  try {
    const targets = await authStore.calculateNutritionTargets({
      age: form.age!,
      gender: form.gender,
      weight_kg: form.weight_kg!,
      height_cm: form.height_cm!,
      activity_level: form.activity_level,
      goal: form.goal
    })
    console.log('DEBUG: calculateTargets - received targets:', targets)
    if (targets) {
      calculatedTargets.value = targets
      console.log('DEBUG: calculateTargets - set calculatedTargets.value to:', calculatedTargets.value)
    } else {
      console.log('DEBUG: calculateTargets - no targets returned')
    }
  } catch (error) {
    console.error('Error calculating targets:', error)
  } finally {
    isCalculating.value = false
  }
}
const handleSubmit = async () => {
  try {
    console.log('DEBUG: handleSubmit - form data:', form)
    console.log('DEBUG: handleSubmit - calculatedTargets.value:', calculatedTargets.value)
    console.log('DEBUG: handleSubmit - canCalculate.value:', canCalculate.value)
    
    if (!calculatedTargets.value && canCalculate.value) {
      console.log('Auto-calculating nutrition targets...')
      await calculateTargets()
      console.log('DEBUG: After calculateTargets - calculatedTargets.value:', calculatedTargets.value)
    } else {
      console.log('DEBUG: Skipping auto-calculation - calculatedTargets exists or canCalculate is false')
    }
    
    const profileData: any = {}
    if (form.age) profileData.age = form.age
    if (form.gender) profileData.gender = form.gender
    if (form.height_cm) profileData.height_cm = form.height_cm
    if (form.weight_kg) profileData.weight_kg = form.weight_kg
    if (form.activity_level) profileData.activity_level = form.activity_level
    if (form.goal) profileData.goal = form.goal
    if (form.target_water_ml) profileData.target_water_ml = form.target_water_ml
    
    if (calculatedTargets.value) {
      profileData.target_calories = calculatedTargets.value.target_calories
      profileData.target_protein_g = calculatedTargets.value.target_protein_g
      profileData.target_carbs_g = calculatedTargets.value.target_carbs_g
      profileData.target_fat_g = calculatedTargets.value.target_fat_g
      console.log('Including calculated targets in profile save:', calculatedTargets.value)
    } else {
      console.log('No calculated targets available to save')
    }
    const response = await fetch('' + import.meta.env.VITE_API_URL + '/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(profileData)
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        await authStore.refreshUser()
        router.push('/dashboard')
      }
    } else {
      console.error('Failed to update profile')
    }
  } catch (error) {
    console.error('Error updating profile:', error)
  }
}
watch([
  () => form.age,
  () => form.gender,
  () => form.height_cm,
  () => form.weight_kg,
  () => form.activity_level,
  () => form.goal
], () => {
  if (canCalculate.value) {
    clearTimeout(calculateTargets.debounce)
    calculateTargets.debounce = setTimeout(calculateTargets, 1000)
  }
}, { deep: true })
calculateTargets.debounce = null
onMounted(async () => {
  const profile = authStore.userProfile
  if (profile) {
    if (profile.age) form.age = profile.age
    if (profile.gender) form.gender = profile.gender
    if (profile.height_cm) form.height_cm = profile.height_cm
    if (profile.weight_kg) form.weight_kg = profile.weight_kg
    if (profile.activity_level) form.activity_level = profile.activity_level
    if (profile.goal) form.goal = profile.goal
    if (profile.target_water_ml) form.target_water_ml = profile.target_water_ml
    if (profile.target_calories) {
      calculatedTargets.value = {
        target_calories: profile.target_calories,
        target_protein_g: profile.target_protein_g,
        target_carbs_g: profile.target_carbs_g,
        target_fat_g: profile.target_fat_g
      }
    } else if (canCalculate.value) {
      await calculateTargets()
    }
  }
})
</script>
<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.profile-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  animation: fadeIn 0.6s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 140px);
  justify-content: flex-start;
  box-sizing: border-box;
}
.profile-header {
  text-align: center;
  margin-bottom: 3rem;
}
.profile-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.profile-header p {
  color: #6b7280;
  margin: 0;
  font-size: 1.1rem;
}
.profile-content {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.profile-form {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 10px 40px -15px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
  width: 100%;
  max-width: 700px;
}
.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #f1f5f9;
  animation: slideIn 0.5s ease;
}
.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
.form-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.form-section h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 2px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.form-group input,
.form-group select {
  padding: 1rem 1.25rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafbfc;
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  background: white;
  transform: translateY(-1px);
}
.form-group input:hover,
.form-group select:hover {
  border-color: #9ca3af;
  background: white;
}
.field-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
  line-height: 1.4;
}
.calculated-targets {
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  animation: fadeIn 0.6s ease;
}
.calculated-targets h2 {
  font-size: 1.375rem;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 1.5rem 0;
  text-align: center;
}
.targets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1.5rem;
}
.target-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}
.target-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.target-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.target-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e40af;
}
.error-message {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
.save-button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}
.save-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}
@media (max-width: 768px) {
  .profile-view {
    padding: 1rem;
  }
  .profile-form {
    padding: 1.5rem;
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .form-actions {
    flex-direction: column;
  }
  .targets-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .profile-header h1 {
    font-size: 2rem;
  }
  .targets-grid {
    grid-template-columns: 1fr;
  }
  .target-item {
    padding: 1rem;
  }
}
</style>