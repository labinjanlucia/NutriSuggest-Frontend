<template>
  <div id="app">
    <AppNavigation v-if="authStore.isAuthenticated" />
    <div :class="{ 'main-content': authStore.isAuthenticated }">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth';
import AppNavigation from './components/AppNavigation.vue';

const authStore = useAuthStore();
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.main-content {
  margin-left: 260px;
  padding: 2rem;
  min-height: 100vh;
}

@media (max-width: 1024px) {
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
}
</style>