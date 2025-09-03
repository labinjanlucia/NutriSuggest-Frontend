import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getStoredToken } from '@/api/client'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: to => {
        return getStoredToken() ? '/dashboard' : '/login'
      }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        requiresGuest: true,
        title: 'Login - NutriSuggest'
      }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: {
        requiresGuest: true,
        title: 'Register - NutriSuggest'
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Dashboard - NutriSuggest'
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Profile - NutriSuggest'
      }
    },
    {
      path: '/foods',
      name: 'foods',
      component: () => import('../views/FoodsView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Foods - NutriSuggest'
      }
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: () => import('../views/RecipesView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Recipes - NutriSuggest'
      }
    },
    {
      path: '/nutrition',
      name: 'nutrition',
      component: () => import('../views/NutritionView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Nutrition Analysis - NutriSuggest'
      }
    },
    {
      path: '/weight',
      name: 'weight',
      component: () => import('../views/WeightView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Weight Tracking - NutriSuggest'
      }
    },
    {
      path: '/meal-planner',
      name: 'meal-planner',
      component: () => import('../views/MealPlannerView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Meal Planner - NutriSuggest'
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Settings - NutriSuggest'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: {
        title: '404 - Page Not Found'
      }
    }
  ]
})
router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  const authStore = useAuthStore()
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      const isAuthenticated = await authStore.checkAuth()
      if (!isAuthenticated) {
        return {
          name: 'login',
          query: { redirect: to.fullPath }
        }
      }
    }
    const profileRequiredRoutes = ['dashboard', 'nutrition']
    if (profileRequiredRoutes.includes(to.name as string) && !authStore.hasCompleteProfile) {
      return { name: 'profile' }
    }
  }
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})
router.afterEach(() => {
  window.scrollTo(0, 0)
})
export default router