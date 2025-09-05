<template>
  <div class="loading-spinner" :class="{ 'spinner-overlay': overlay }">
    <div class="spinner" :class="sizeClass">
      <div class="bounce1"></div>
      <div class="bounce2"></div>
      <div class="bounce3"></div>
    </div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
interface Props {
  size?: 'small' | 'medium' | 'large'
  text?: string
  overlay?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  overlay: false
})
const sizeClass = computed(() => `spinner-${props.size}`)
</script>
<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}
.spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.2rem;
}
.spinner-small {
  gap: 0.15rem;
}
.spinner-small > div {
  width: 8px;
  height: 8px;
}
.spinner-medium > div {
  width: 12px;
  height: 12px;
}
.spinner-large {
  gap: 0.3rem;
}
.spinner-large > div {
  width: 16px;
  height: 16px;
}
.spinner > div {
  background-color: #3b82f6;
  border-radius: 100%;
  display: inline-block;
  animation: sk-bouncedelay 1.4s infinite ease-in-out both;
}
.spinner .bounce1 {
  animation-delay: -0.32s;
}
.spinner .bounce2 {
  animation-delay: -0.16s;
}
.loading-text {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}
@keyframes sk-bouncedelay {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1.0);
  }
}
</style>