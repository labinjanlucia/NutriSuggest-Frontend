<template>
  <div class="modal-overlay" v-if="show" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>Shopping List</h3>
        <p class="date-range">{{ formatDateRange(startDate, endDate) }}</p>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="date-selector">
          <div class="date-input-group">
            <label for="start-date">From:</label>
            <input
              id="start-date"
              v-model="localStartDate"
              type="date"
              class="date-input"
              @change="updateShoppingList"
            />
          </div>
          <div class="date-input-group">
            <label for="end-date">To:</label>
            <input
              id="end-date"
              v-model="localEndDate"
              type="date"
              class="date-input"
              @change="updateShoppingList"
            />
          </div>
          <button class="refresh-btn" @click="updateShoppingList" :disabled="loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Generating shopping list...</p>
        </div>
        <div v-else-if="shoppingList" class="shopping-list-content">
          <div class="list-summary">
            <div class="summary-item">
              <span class="summary-label">Total Items:</span>
              <span class="summary-value">{{ shoppingList?.items?.length || 0 }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Total Weight:</span>
              <span class="summary-value">{{ totalWeight.toFixed(0) }}g</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Checked Off:</span>
              <span class="summary-value">{{ checkedItemsCount }}/{{ shoppingList?.items?.length || 0 }}</span>
            </div>
          </div>
          <div class="list-controls">
            <div class="search-wrapper">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <input
                v-model="searchFilter"
                type="text"
                placeholder="Search items..."
                class="search-input"
              />
            </div>
            <div class="filter-controls">
              <label class="checkbox-label">
                <input
                  v-model="hideCheckedItems"
                  type="checkbox"
                  class="checkbox"
                />
                Hide checked items
              </label>
            </div>
          </div>
          <div v-if="filteredItems.length === 0 && (shoppingList?.items?.length || 0) === 0" class="empty-state">
            <div class="empty-icon">🛒</div>
            <h4>No items needed</h4>
            <p>Add some meal plans for this period to generate a shopping list!</p>
          </div>
          <div v-else-if="filteredItems.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <h4>No matching items</h4>
            <p>Try adjusting your search or filters.</p>
          </div>
          <div v-else class="shopping-items">
            <div
              v-for="item in filteredItems"
              :key="item.food.id"
              class="shopping-item"
              :class="{ 'checked': item.checked }"
            >
              <label class="item-checkbox-label">
                <input
                  v-model="item.checked"
                  type="checkbox"
                  class="item-checkbox"
                  @change="saveCheckedState"
                />
                <span class="checkmark"></span>
              </label>
              <div class="item-details">
                <h4 class="item-name">{{ item.food.name }}</h4>
                <p v-if="item.food.brand" class="item-brand">{{ item.food.brand }}</p>
                <div class="item-quantity">
                  <span class="quantity-amount">{{ formatQuantity(item.total_grams) }}</span>
                  <span class="quantity-unit">{{ getQuantityUnit(item.total_grams) }}</span>
                </div>
              </div>
              <button
                class="remove-item-btn"
                @click="removeItem(item.food.id)"
                title="Remove from list"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h4>Failed to load shopping list</h4>
          <p>{{ error }}</p>
          <button class="retry-btn" @click="updateShoppingList">Try Again</button>
        </div>
        <div class="modal-actions">
          <button class="clear-all-btn" @click="clearAllChecked" v-if="checkedItemsCount > 0">
            Clear Checked Items
          </button>
          <button class="export-btn" @click="exportShoppingList" v-if="shoppingList?.items?.length && shoppingList.items.length > 0">
            📋 Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
interface Props {
  show: boolean
  startDate: string
  endDate: string
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
  startDate: '',
  endDate: ''
})
const emit = defineEmits<{
  close: []
}>()
interface ShoppingListItem {
  food: {
    id: number
    name: string
    brand?: string
  }
  total_grams: number
  checked: boolean
}
interface ShoppingListResponse {
  start_date: string
  end_date: string
  items: Omit<ShoppingListItem, 'checked'>[]
}
const loading = ref(false)
const error = ref<string | null>(null)
const shoppingList = ref<ShoppingListResponse | null>(null)
const localStartDate = ref('')
const localEndDate = ref('')
const searchFilter = ref('')
const hideCheckedItems = ref(false)
const checkedItemsState = ref<Record<number, boolean>>({})
const enhancedItems = computed(() => {
  if (!shoppingList.value) return []
  return shoppingList.value.items.map(item => ({
    ...item,
    checked: checkedItemsState.value[item.food.id] || false
  }))
})
const filteredItems = computed(() => {
  let items = enhancedItems.value
  if (searchFilter.value.trim()) {
    const search = searchFilter.value.toLowerCase()
    items = items.filter(item =>
      item.food.name.toLowerCase().includes(search) ||
      (item.food.brand && item.food.brand.toLowerCase().includes(search))
    )
  }
  if (hideCheckedItems.value) {
    items = items.filter(item => !item.checked)
  }
  return items
})
const totalWeight = computed(() => {
  return enhancedItems.value.reduce((total, item) => total + item.total_grams, 0)
})
const checkedItemsCount = computed(() => {
  return enhancedItems.value.filter(item => item.checked).length
})
const formatDateRange = (start: string, end: string) => {
  if (!start || !end) return ''
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}
const formatQuantity = (grams: number) => {
  if (grams >= 1000) {
    return (grams / 1000).toFixed(1)
  }
  return Math.round(grams)
}
const getQuantityUnit = (grams: number) => {
  return grams >= 1000 ? 'kg' : 'g'
}
const closeModal = () => {
  emit('close')
}
const updateShoppingList = async () => {
  if (!localStartDate.value || !localEndDate.value) return
  loading.value = true
  error.value = null
  try {
    console.log('ShoppingListModal: Fetching shopping list for dates:', localStartDate.value, 'to', localEndDate.value)
    const { get } = await import('@/api/client')
    const response = await get(`/meal-plans/shopping-list?start_date=${localStartDate.value}&end_date=${localEndDate.value}`)
    console.log('ShoppingListModal: Shopping list response:', response.data)
    shoppingList.value = response.data.data
    loadCheckedStates()
  } catch (err) {
    console.error('Shopping list error:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load shopping list'
    shoppingList.value = null
  } finally {
    loading.value = false
  }
}
const saveCheckedState = () => {
  const checkedStates: Record<number, boolean> = {}
  enhancedItems.value.forEach(item => {
    if (item.checked) {
      checkedStates[item.food.id] = true
    }
  })
  localStorage.setItem(`shopping-list-checked-${localStartDate.value}-${localEndDate.value}`, JSON.stringify(checkedStates))
  checkedItemsState.value = checkedStates
}
const loadCheckedStates = () => {
  const saved = localStorage.getItem(`shopping-list-checked-${localStartDate.value}-${localEndDate.value}`)
  if (saved) {
    try {
      checkedItemsState.value = JSON.parse(saved)
    } catch (e) {
      checkedItemsState.value = {}
    }
  } else {
    checkedItemsState.value = {}
  }
}
const removeItem = (foodId: number) => {
  if (!shoppingList.value) return
  shoppingList.value.items = shoppingList.value.items.filter(item => item.food.id !== foodId)
  delete checkedItemsState.value[foodId]
  saveCheckedState()
}
const clearAllChecked = () => {
  if (!shoppingList.value) return
  const uncheckedItems = shoppingList.value.items.filter(item => !checkedItemsState.value[item.food.id])
  shoppingList.value.items = uncheckedItems
  checkedItemsState.value = {}
  saveCheckedState()
}
const exportShoppingList = () => {
  if (!shoppingList.value) return
  let text = `Shopping List (${formatDateRange(localStartDate.value, localEndDate.value)})\n\n`
  enhancedItems.value.forEach(item => {
    const status = item.checked ? '✓' : '☐'
    const quantity = `${formatQuantity(item.total_grams)}${getQuantityUnit(item.total_grams)}`
    const brand = item.food.brand ? ` (${item.food.brand})` : ''
    text += `${status} ${item.food.name}${brand} - ${quantity}\n`
  })
  text += `\nTotal Items: ${shoppingList.value.items.length}`
  text += `\nTotal Weight: ${totalWeight.value.toFixed(0)}g`
  navigator.clipboard.writeText(text).then(() => {
    console.log('Shopping list copied to clipboard')
  }).catch(err => {
    console.error('Failed to copy to clipboard:', err)
  })
}
watch(() => props.show, (isShown) => {
  if (isShown) {
    localStartDate.value = props.startDate
    localEndDate.value = props.endDate
    updateShoppingList()
  }
})
watch([() => props.startDate, () => props.endDate], ([newStart, newEnd]) => {
  localStartDate.value = newStart
  localEndDate.value = newEnd
  if (props.show) {
    updateShoppingList()
  }
})
onMounted(() => {
  if (props.show) {
    localStartDate.value = props.startDate
    localEndDate.value = props.endDate
    updateShoppingList()
  }
})
</script>
<style scoped>
.modal-overlay {
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
  backdrop-filter: blur(4px);
}
.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: modalSlideUp 0.3s ease-out;
}
@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.modal-header {
  position: relative;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
}
.modal-header h3 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}
.date-range {
  margin: 0;
  color: #059669;
  font-size: 0.95rem;
  font-weight: 500;
}
.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s ease;
}
.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
}
.modal-body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}
.date-selector {
  display: flex;
  gap: 12px;
  align-items: end;
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}
.date-input-group {
  flex: 1;
}
.date-input-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}
.date-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}
.date-input:focus {
  outline: none;
  border-color: #059669;
}
.refresh-btn {
  padding: 8px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.refresh-btn:hover:not(:disabled) {
  background: #047857;
}
.refresh-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #6b7280;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #059669;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.list-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f0fdf4;
  border-radius: 12px;
}
.summary-item {
  text-align: center;
}
.summary-label {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 4px;
}
.summary-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #059669;
}
.list-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}
.search-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 10px;
  color: #9ca3af;
}
.search-input {
  width: 100%;
  padding: 8px 8px 8px 36px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}
.search-input:focus {
  outline: none;
  border-color: #059669;
}
.filter-controls {
  display: flex;
  align-items: center;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
}
.checkbox {
  width: 16px;
  height: 16px;
  accent-color: #059669;
}
.empty-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}
.empty-icon, .error-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}
.empty-state h4, .error-state h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #374151;
}
.empty-state p, .error-state p {
  margin: 0;
  font-size: 0.95rem;
}
.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.retry-btn:hover {
  background: #047857;
}
.shopping-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.shopping-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
}
.shopping-item.checked {
  background: #f9fafb;
  border-color: #d1d5db;
}
.shopping-item.checked .item-name {
  text-decoration: line-through;
  color: #9ca3af;
}
.item-checkbox-label {
  position: relative;
  cursor: pointer;
}
.item-checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}
.item-checkbox:checked {
  background: #059669;
  border-color: #059669;
}
.checkmark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.item-checkbox:checked + .checkmark {
  opacity: 1;
}
.checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}
.item-details {
  flex: 1;
}
.item-name {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  transition: all 0.2s ease;
}
.item-brand {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 0.85rem;
}
.item-quantity {
  display: flex;
  align-items: center;
  gap: 4px;
}
.quantity-amount {
  font-weight: 600;
  color: #059669;
}
.quantity-unit {
  color: #6b7280;
  font-size: 0.9rem;
}
.remove-item-btn {
  padding: 8px;
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
}
.remove-item-btn:hover {
  background: #fef2f2;
}
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
.clear-all-btn, .export-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.clear-all-btn {
  background: #fef2f2;
  color: #dc2626;
}
.clear-all-btn:hover {
  background: #fee2e2;
}
.export-btn {
  background: #059669;
  color: white;
}
.export-btn:hover {
  background: #047857;
}
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
  .modal-header {
    padding: 16px;
  }
  .modal-body {
    padding: 16px;
  }
  .date-selector {
    flex-direction: column;
    align-items: stretch;
  }
  .list-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .list-summary {
    grid-template-columns: 1fr;
  }
  .modal-actions {
    flex-direction: column;
  }
}
</style>