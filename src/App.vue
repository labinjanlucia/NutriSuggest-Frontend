<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppNavigation from '@/components/AppNavigation.vue'
const route = useRoute()
const authStore = useAuthStore()
const shouldShowNavigation = () => {
  const guestRoutes = ['login', 'register', 'not-found']
  return !guestRoutes.includes(route.name as string)
}
onMounted(async () => {
  authStore.initialize()
  await authStore.checkAuth()
})
</script>
<template>
  <div id="app">
    <AppNavigation v-if="shouldShowNavigation() && authStore.isAuthenticated" />
    <main :class="{ 'with-nav': shouldShowNavigation() && authStore.isAuthenticated }">
      <RouterView />
    </main>
  </div>
</template>
<style>
* {
  box-sizing: border-box;
}
html {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #2c3e50;
}
body {
  margin: 0;
  background: #f8fafc;
}
#app {
  min-height: 100vh;
}
main {
  min-height: 100vh;
  transition: margin-left 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
}
main.with-nav {
  margin-left: 250px;
  width: calc(100% - 250px);
  display: flex;
  justify-content: center;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 768px) {
  main.with-nav {
    margin-left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
  }
}
</style>