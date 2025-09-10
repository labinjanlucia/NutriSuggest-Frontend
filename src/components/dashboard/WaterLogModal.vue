<template>
  <div v-if="show" class="modal-backdrop" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>💧 Log Water Intake</h3>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>
      <div class="modal-content">
        <div class="current-progress">
          <div class="progress-info">
            <span class="progress-text">Today's progress</span>
            <span class="progress-amount">{{ todayAmount }}ml / {{ waterGoal }}ml</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
          <div class="progress-percentage">{{ Math.round(progressPercentage) }}%</div>
        </div>
        <div class="quick-amounts">
          <h4>Quick Add</h4>
          <div class="amount-buttons">
            <button
              v-for="amount in quickAmounts"
              :key="amount.ml"
              @click="addWater(amount.ml)"
              class="amount-btn"
              :class="{ 'popular': amount.popular }"
            >
              <span class="amount-icon">{{ amount.icon }}</span>
              <span class="amount-text">{{ amount.label }}</span>
              <span class="amount-ml">{{ amount.ml }}ml</span>
            </button>
          </div>
        </div>
        <div class="custom-amount">
          <h4>Custom Amount</h4>
          <div class="input-group">
            <input
              v-model.number="customAmount"
              type="number"
              min="1"
              max="2000"
              placeholder="Enter amount"
              class="amount-input"
            />
            <span class="input-suffix">ml</span>
            <button
              @click="addWater(customAmount)"
              :disabled="!customAmount || customAmount <= 0"
              class="add-custom-btn"
            >
              Add
            </button>
          </div>
        </div>
        <div class="recent-entries" v-if="todayEntries.length > 0">
          <h4>Today's Entries</h4>
          <div class="entries-list">
            <div
              v-for="entry in todayEntries.slice(0, 5)"
              :key="entry.id"
              class="entry-item"
            >
              <span class="entry-time">{{ formatTime(entry.logged_at) }}</span>
              <span class="entry-amount">{{ entry.amount }}ml</span>
              <button @click="removeEntry(entry.id)" class="remove-btn">×</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button @click="closeModal" class="cancel-btn">Done</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
interface WaterEntry {
  id: number
  amount: number
  logged_at: string
}
interface Props {
  show: boolean
  todayAmount: number
  waterGoal: number
  todayEntries: WaterEntry[]
}
const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  addWater: [amount: number]
  removeEntry: [id: number]
}>()
const customAmount = ref<number | null>(null)
const quickAmounts = [
  { icon: '🥤', label: 'Small glass', ml: 200, popular: true },
  { icon: '🥛', label: 'Large glass', ml: 250, popular: true },
  { icon: '🍶', label: 'Bottle (small)', ml: 330, popular: false },
  { icon: '💧', label: 'Bottle (500ml)', ml: 500, popular: true },
  { icon: '🚰', label: 'Water bottle', ml: 750, popular: false },
  { icon: '💧', label: 'Large bottle', ml: 1000, popular: false },
]
const progressPercentage = computed(() => {
  return Math.min((props.todayAmount / props.waterGoal) * 100, 100)
})
const addWater = (amount: number | null) => {
  if (amount && amount > 0 && amount <= 2000) {
    emit('addWater', amount)
    customAmount.value = null
  }
}
const removeEntry = (id: number) => {
  emit('removeEntry', id)
}
const closeModal = () => {
  emit('close')
}
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
</script>
<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}
@keyframes slideIn {
  from { transform: translateY(-20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.close-btn:hover {
  background: #f3f4f6;
  color: #6b7280;
}
.modal-content {
  padding: 1.5rem;
}
.current-progress {
  background: linear-gradient(135deg, #e0f2fe 0%, #e1f5fe 100%);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 2rem;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.progress-text {
  font-size: 0.875rem;
  color: #0369a1;
  font-weight: 500;
}
.progress-amount {
  font-size: 0.875rem;
  color: #0c4a6e;
  font-weight: 600;
}
.progress-bar {
  height: 8px;
  background: #bae6fd;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #0284c7);
  border-radius: 4px;
  transition: width 0.8s ease;
}
.progress-percentage {
  text-align: center;
  font-size: 0.75rem;
  color: #0369a1;
  font-weight: 600;
}
.quick-amounts, .custom-amount, .recent-entries {
  margin-bottom: 2rem;
}
.quick-amounts h4, .custom-amount h4, .recent-entries h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}
.amount-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}
.amount-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}
.amount-btn:hover {
  border-color: #06b6d4;
  background: #f0fdfa;
  transform: translateY(-1px);
}
.amount-btn.popular {
  border-color: #06b6d4;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
}
.amount-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}
.amount-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.25rem;
  text-align: center;
}
.amount-ml {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
}
.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.amount-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}
.amount-input:focus {
  outline: none;
  border-color: #06b6d4;
}
.input-suffix {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}
.add-custom-btn {
  padding: 0.75rem 1rem;
  background: #06b6d4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.add-custom-btn:hover:not(:disabled) {
  background: #0891b2;
}
.add-custom-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
.entries-list {
  max-height: 120px;
  overflow-y: auto;
}
.entry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}
.entry-item:last-child {
  border-bottom: none;
}
.entry-time {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}
.entry-amount {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
}
.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.remove-btn:hover {
  background: #fef2f2;
}
.modal-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}
.cancel-btn {
  padding: 0.5rem 1rem;
  background: #06b6d4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.cancel-btn:hover {
  background: #0891b2;
}
@media (max-width: 640px) {
  .modal-container {
    width: 95%;
    margin: 1rem;
  }
  .amount-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
  .amount-btn {
    padding: 0.5rem;
  }
  .amount-icon {
    font-size: 1.25rem;
  }
}
</style>