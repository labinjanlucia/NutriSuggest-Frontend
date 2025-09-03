<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="not-found-icon">🔍</div>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <router-link to="/" class="home-button">
        Go Home
      </router-link>
    </div>
  </div>
</template>
<script setup lang="ts">
</script>
<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}
.not-found-content {
  text-align: center;
  padding: 2rem;
}
.not-found-icon {
  font-size: 6rem;
  margin-bottom: 2rem;
}
.not-found-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
}
.not-found-content p {
  color: #6b7280;
  margin: 0 0 2rem 0;
  font-size: 1.125rem;
}
.home-button {
  background: #3b82f6;
  color: white;
  text-decoration: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  display: inline-block;
  transition: background-color 0.2s;
}
.home-button:hover {
  background: #2563eb;
}
</style>