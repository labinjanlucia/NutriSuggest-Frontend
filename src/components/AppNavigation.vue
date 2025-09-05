<template>
  <nav class="app-navigation">
    <div class="nav-header">
      <div class="nav-brand">
        <h2>NutriSuggest</h2>
      </div>
    </div>
    <div class="nav-content">
      <div class="nav-section">
        <ul class="nav-menu">
          <li class="nav-item">
            <router-link to="/dashboard" class="nav-link">
              <span class="nav-icon">📊</span>
              Dashboard
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/foods" class="nav-link">
              <span class="nav-icon">🍎</span>
              Foods
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/recipes" class="nav-link">
              <span class="nav-icon">📝</span>
              Recipes
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/nutrition" class="nav-link">
              <span class="nav-icon">📈</span>
              Analytics
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/weight" class="nav-link">
              <span class="nav-icon">⚖️</span>
              Weight
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/meal-planner" class="nav-link">
              <span class="nav-icon">🗓️</span>
              Meal Planner
            </router-link>
          </li>
        </ul>
      </div>
      <div class="nav-section">
        <div class="nav-section-title">Assistant</div>
        <ul class="nav-menu">
          <li class="nav-item">
            <button @click="getSmartMealSuggestion" class="nav-link nav-button" :disabled="isLoadingSuggestions">
              <span class="nav-icon">⭐</span>
              {{ isLoadingSuggestions ? 'Getting...' : 'Meal Suggestion' }}
            </button>
          </li>
        </ul>
      </div>
      <div class="nav-section">
        <div class="nav-section-title">Account</div>
        <ul class="nav-menu">
          <li class="nav-item">
            <router-link to="/profile" class="nav-link">
              <span class="nav-icon">👤</span>
              Profile
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/settings" class="nav-link">
              <span class="nav-icon">⚙️</span>
              Settings
            </router-link>
          </li>
        </ul>
      </div>
    </div>
    <div class="nav-footer">
      <div class="user-info">
        <div class="user-avatar">
          {{ getUserInitials() }}
        </div>
        <div class="user-details">
          <div class="user-email">{{ authStore.user?.email }}</div>
          <button @click="handleLogout" class="logout-link">
            Sign out
          </button>
        </div>
      </div>
    </div>
  </nav>
  <MealSuggestionsModal
    :is-visible="showSuggestionsModal"
    @close="closeSuggestionsModal"
    @suggestion-added="handleSuggestionAdded"
  />
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MealSuggestionsModal from '@/components/meal/MealSuggestionsModal.vue'
const router = useRouter()
const authStore = useAuthStore()
const isLoadingSuggestions = ref(false)
const showSuggestionsModal = ref(false)
const getUserInitials = (): string => {
  const email = authStore.user?.email
  if (!email) return '?'
  const parts = email.split('@')[0].split('.')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return email.charAt(0).toUpperCase()
}
const handleLogout = () => {
  if (confirm('Are you sure you want to sign out?')) {
    authStore.logout()
    router.push('/login')
  }
}
const getSmartMealSuggestion = () => {
  if (!authStore.token) return
  showSuggestionsModal.value = true
}
const closeSuggestionsModal = () => {
  showSuggestionsModal.value = false
}
const handleSuggestionAdded = (suggestion: any, date: string, mealType: string) => {
  const mealName = suggestion.item?.name || 'Unknown meal'
  console.log(`Successfully added suggestion: ${mealName} for ${mealType} on ${date}`)
  if (router.currentRoute.value.path === '/meal-planner') {
    window.dispatchEvent(new CustomEvent('refresh-meal-planner'))
  } else {
    setTimeout(() => {
      const message = `✅ Added "${mealName}" to your ${mealType} on ${date}!\n\nWould you like to view your meal planner to see it on the calendar?`
      if (confirm(message)) {
        router.push('/meal-planner').then(() => {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refresh-meal-planner'))
          }, 100)
        })
      }
    }, 300)
  }
}
</script>
<style scoped>
.app-navigation {
  position: fixed;
  left: 0;
  top: 0;
  width: 250px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}
.nav-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.nav-brand h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}
.nav-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}
.nav-section {
  margin-bottom: 2rem;
}
.nav-section:last-child {
  margin-bottom: 0;
}
.nav-section-title {
  padding: 0 1.5rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.nav-menu {
  list-style: none;
  margin: 0;
  padding: 0;
}
.nav-item {
  margin: 0;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: #6b7280;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}
.nav-link:hover {
  background: #f3f4f6;
  color: #374151;
}
.nav-link.router-link-active {
  background: #eff6ff;
  color: #2563eb;
  border-right: 3px solid #2563eb;
}
.nav-button {
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}
.nav-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.nav-icon {
  font-size: 1.125rem;
  line-height: 1;
}
.nav-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.user-avatar {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}
.user-details {
  flex: 1;
  min-width: 0;
}
.user-email {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  truncate: true;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.logout-link {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  margin-top: 0.25rem;
}
.logout-link:hover {
  color: #374151;
}
@media (max-width: 768px) {
  .app-navigation {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  .app-navigation.mobile-open {
    transform: translateX(0);
  }
}
</style>