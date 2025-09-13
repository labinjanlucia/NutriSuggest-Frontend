<template>
  <div class="settings-view">
    <div class="page-header">
      <div class="header-content">
        <h1>⚙️ Settings</h1>
        <p>Manage your account preferences and app settings</p>
      </div>
      <div class="header-actions">
        <router-link to="/dashboard" class="back-button">
          <span>⬅️</span> Dashboard
        </router-link>
      </div>
    </div>
    <div class="settings-grid">
      <div class="settings-card">
        <div class="card-header">
          <div class="card-icon">👤</div>
          <h2>Account Information</h2>
        </div>
        <div class="card-content">
          <div class="info-item">
            <div class="info-label">Email Address</div>
            <div class="info-value">{{ authStore.user?.email || 'Not available' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Member Since</div>
            <div class="info-value">{{ memberSince }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Account Status</div>
            <div class="info-value">
              <span class="status-badge active">Active</span>
            </div>
          </div>
        </div>
      </div>
      <div class="settings-card">
        <div class="card-header">
          <div class="card-icon">🎯</div>
          <h2>Profile & Goals</h2>
        </div>
        <div class="card-content">
          <div class="info-item" v-if="userProfile">
            <div class="info-label">Age</div>
            <div class="info-value">{{ userProfile.age || 'Not set' }}</div>
          </div>
          <div class="info-item" v-if="userProfile">
            <div class="info-label">Goal</div>
            <div class="info-value">{{ userProfile.goal ? userProfile.goal.replace('_', ' ').charAt(0).toUpperCase() + userProfile.goal.replace('_', ' ').slice(1) : 'Not set' }}</div>
          </div>
          <div class="info-item" v-if="userProfile">
            <div class="info-label">Activity Level</div>
            <div class="info-value">{{ userProfile.activity_level ? userProfile.activity_level.charAt(0).toUpperCase() + userProfile.activity_level.slice(1) : 'Not set' }}</div>
          </div>
          <div class="info-item" v-if="userProfile?.target_calories">
            <div class="info-label">Daily Calorie Target</div>
            <div class="info-value">{{ userProfile.target_calories }} calories</div>
          </div>
          <div class="info-item" v-if="userProfile?.target_protein_g">
            <div class="info-label">Protein Target</div>
            <div class="info-value">{{ userProfile.target_protein_g }}g</div>
          </div>
          <div class="info-item" v-if="!userProfile">
            <div class="info-label">Profile Status</div>
            <div class="info-value">Profile not loaded</div>
          </div>
          <div class="action-item">
            <router-link to="/profile" class="action-button primary">
              <span>✏️</span> Edit Profile & Goals
            </router-link>
          </div>
        </div>
      </div>
      <div class="settings-card">
        <div class="card-header">
          <div class="card-icon">👩‍⚕️</div>
          <h2>User Role</h2>
        </div>
        <div class="card-content">
          <div class="info-item">
            <div class="info-label">Current Role</div>
            <div class="info-value">
              <span class="status-badge" :class="isNutritionist ? 'nutritionist' : 'standard'">
                {{ isNutritionist ? 'Nutritionist' : 'Standard User' }}
              </span>
            </div>
          </div>
          <div class="action-item">
            <div class="toggle-container">
              <label class="toggle-label">
                <input
                  type="checkbox"
                  v-model="isNutritionist"
                  @change="toggleNutritionistRole"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-text">Nutritionist Role</span>
              </label>
              <p class="toggle-description">
                Nutritionists can share public content that appears at the top of food/recipe lists for all users.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="settings-card">
        <div class="card-header">
          <div class="card-icon">🔒</div>
          <h2>Data & Privacy</h2>
        </div>
        <div class="card-content">
          <div class="action-item">
            <button @click="exportData" class="action-button secondary">
              <span>📥</span> Export My Data
            </button>
          </div>
          <div class="action-item">
            <button @click="deleteAccount" class="action-button danger">
              <span>🗑️</span> Delete Account
            </button>
          </div>
        </div>
      </div>
      <div class="settings-card danger-card">
        <div class="card-header">
          <div class="card-icon">🚪</div>
          <h2>Account Actions</h2>
        </div>
        <div class="card-content">
          <div class="action-item">
            <button @click="handleLogout" class="action-button danger large">
              <span>🚪</span> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNutritionStore } from '@/stores/nutrition'
const router = useRouter()
const authStore = useAuthStore()
const nutritionStore = useNutritionStore()
const isNutritionist = ref(false)
const userProfile = ref<any>(null)
const memberSince = computed(() => {
  if (authStore.user?.created_at) {
    return new Date(authStore.user.created_at).toLocaleDateString()
  }
  return 'Unknown'
})
const loadNutritionistStatus = async () => {
  try {
    const response = await fetch('' + import.meta.env.VITE_API_URL + '/profile/nutritionist-status', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const result = await response.json()
      console.log('Profile API response:', result)
      isNutritionist.value = result.data?.is_nutritionist || false
      console.log('Loaded nutritionist status:', isNutritionist.value)
    } else {
      console.error('Profile API response not ok:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('Error loading nutritionist status:', error)
  }
}
const toggleNutritionistRole = async () => {
  try {
    console.log('Saving nutritionist status:', isNutritionist.value)
    const response = await fetch('' + import.meta.env.VITE_API_URL + '/profile/nutritionist-status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        is_nutritionist: isNutritionist.value
      })
    })
    if (response.ok) {
      const result = await response.json()
      console.log('Nutritionist role updated successfully:', result)
    } else {
      console.error('Failed to update nutritionist role:', response.status, response.statusText)
      const errorData = await response.text()
      console.error('Error response:', errorData)
      isNutritionist.value = !isNutritionist.value
    }
  } catch (error) {
    console.error('Error updating nutritionist role:', error)
    isNutritionist.value = !isNutritionist.value
  }
}
const loadProfileData = async () => {
  try {
    const response = await fetch('' + import.meta.env.VITE_API_URL + '/profile', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const result = await response.json()
      console.log('Profile data loaded:', result)
      userProfile.value = result.data?.profile
      console.log('userProfile.value set to:', userProfile.value)
    } else {
      console.error('Failed to load profile data:', response.status)
    }
  } catch (error) {
    console.error('Error loading profile data:', error)
  }
}
onMounted(() => {
  loadNutritionistStatus()
  loadProfileData()
})
const exportData = async () => {
  try {
    const exportButton = document.querySelector('.action-button.secondary') as HTMLButtonElement
    if (exportButton) {
      exportButton.textContent = '⏳ Exporting...'
      exportButton.disabled = true
    }
    const exportData = {
      export_info: {
        date: new Date().toISOString(),
        app: 'NutriSuggest',
        version: '1.0',
        user_id: authStore.user?.id
      },
      account: {
        email: authStore.user?.email,
        created_at: authStore.user?.created_at,
        profile: userProfile.value
      },
      nutrition_data: {},
      weight_data: {},
      water_data: {},
      custom_foods: [],
      custom_recipes: [],
      meal_plans: []
    }
    const { get } = await import('@/api/client')
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    try {
      const nutritionResponse = await get(`/intakes?start_date=${startDate}&end_date=${endDate}`)
      exportData.nutrition_data = nutritionResponse.data
    } catch (error) {
      console.log('Could not fetch nutrition history:', error)
    }
    try {
      const weightResponse = await get('/weights/history?limit=100')
      exportData.weight_data = weightResponse.data
    } catch (error) {
      console.log('Could not fetch weight history:', error)
    }
    const waterStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    try {
      const waterResponse = await get(`/water/weekly?startDate=${waterStartDate}`)
      exportData.water_data = waterResponse.data
    } catch (error) {
      console.log('Could not fetch water history:', error)
    }
    try {
      const foodsResponse = await get('/foods/search?my_foods=true&show_public=false&limit=100')
      exportData.custom_foods = foodsResponse.data.data.foods || []
    } catch (error) {
      console.log('Could not fetch custom foods:', error)
    }
    try {
      const recipesResponse = await get('/recipes/search?my_recipes=true&show_public=false&limit=100')
      exportData.custom_recipes = recipesResponse.data.data.recipes || []
    } catch (error) {
      console.log('Could not fetch custom recipes:', error)
    }
    const mealPlanStartDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    try {
      const mealPlansResponse = await get(`/meal-plans?start_date=${mealPlanStartDate}&end_date=${endDate}`)
      exportData.meal_plans = mealPlansResponse.data.data || []
    } catch (error) {
      console.log('Could not fetch meal plans:', error)
    }
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nutrisuggest-complete-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    alert('Your complete data has been exported successfully! The file contains your profile, nutrition history, weight logs, water intake, custom foods, recipes, and meal plans.')
  } catch (error) {
    console.error('Export failed:', error)
    alert('Failed to export data. Please try again.')
  } finally {
    const exportButton = document.querySelector('.action-button.secondary') as HTMLButtonElement
    if (exportButton) {
      exportButton.innerHTML = '<span>📥</span> Export My Data'
      exportButton.disabled = false
    }
  }
}
const deleteAccount = async () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    if (confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      try {
        const success = await authStore.deleteAccount()
        if (success) {
          alert('Your account has been successfully deleted.')
          router.push('/register')
        } else {
          alert('Failed to delete account. Please try again or contact support.')
        }
      } catch (error) {
        console.error('Error deleting account:', error)
        alert('An error occurred while deleting your account. Please contact support.')
      }
    }
  }
}
const handleLogout = () => {
  if (confirm('Are you sure you want to sign out?')) {
    authStore.logout()
    router.push('/login')
  }
}
</script>
<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.settings-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  animation: fadeInUp 0.6s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}
.header-content h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.header-content p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}
.header-actions {
  display: flex;
  align-items: center;
}
.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-weight: 500;
  transition: all 0.3s ease;
}
.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 900px;
  justify-content: center;
  margin: 0 auto;
}
.settings-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
}
.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.settings-card.danger-card {
  border-color: #fee2e2;
  background: #fffbfb;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}
.card-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.card-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}
.card-content {
  padding: 1.5rem 2rem;
}
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f8fafc;
}
.info-item:last-child {
  border-bottom: none;
}
.info-label {
  font-weight: 600;
  color: #374151;
}
.info-value {
  color: #6b7280;
  font-weight: 500;
}
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.status-badge.active {
  background: #dcfce7;
  color: #166534;
}
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid #f8fafc;
}
.preference-item:last-child {
  border-bottom: none;
}
.preference-info {
  flex: 1;
}
.preference-label {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}
.preference-desc {
  font-size: 0.875rem;
  color: #6b7280;
}
.toggle-switch {
  width: 50px;
  height: 26px;
  background: #e5e7eb;
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;
}
.toggle-switch:hover {
  background: #d1d5db;
}
.toggle-slider {
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.toggle-slider.active {
  left: 26px;
  background: white;
}
.toggle-switch:has(.toggle-slider.active) {
  background: #3b82f6;
}
.action-item {
  margin: 1rem 0;
}
.action-item:first-child {
  margin-top: 0;
}
.action-item:last-child {
  margin-bottom: 0;
}
.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}
.action-button.primary {
  background: #3b82f6;
  color: white;
}
.action-button.primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}
.action-button.secondary {
  background: #f8fafc;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.action-button.secondary:hover {
  background: #f1f5f9;
  border-color: #d1d5db;
}
.action-button.danger {
  background: #ef4444;
  color: white;
}
.action-button.danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
}
.action-button.large {
  padding: 1rem 2rem;
  font-size: 1rem;
  width: 100%;
  justify-content: center;
}
@media (max-width: 768px) {
  .settings-view {
    padding: 1rem;
  }
  .page-header {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
    text-align: center;
  }
  .header-content h1 {
    font-size: 2rem;
  }
  .header-actions {
    justify-content: center;
  }
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .card-header,
  .card-content {
    padding: 1.5rem;
  }
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
@media (max-width: 480px) {
  .info-item,
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .action-button {
    width: 100%;
    justify-content: center;
  }
}
.toggle-container {
  width: 100%;
}
.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 1rem;
}
.toggle-input {
  display: none;
}
.toggle-slider {
  position: relative;
  width: 50px;
  height: 26px;
  background-color: #ccc;
  border-radius: 26px;
  transition: all 0.3s ease;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  top: 3px;
  left: 3px;
  transition: all 0.3s ease;
}
.toggle-input:checked + .toggle-slider {
  background-color: #10b981;
}
.toggle-input:checked + .toggle-slider::before {
  transform: translateX(24px);
}
.toggle-text {
  font-weight: 600;
  color: #374151;
}
.toggle-description {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}
.status-badge.nutritionist {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}
.status-badge.standard {
  background: #e5e7eb;
  color: #374151;
}
</style>