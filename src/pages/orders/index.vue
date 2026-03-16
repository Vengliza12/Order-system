<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Tables from '@/components/TableStatic.vue'

interface OrderItemApi {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

interface OrderApiItem {
  id: number
  table_id: number
  table_name: string
  status: string
  notes: string | null
  subtotal: number
  tax_amount: number
  service_charge: number
  total: number
  invoice_number: string
  items: OrderItemApi[]
  created_at: string
}

interface DeleteTarget {
  id: number
  invoice_number: string
}

const API_URL = 'http://localhost:8000/orders/'
const router = useRouter()

const headers = [
  { title: '#', key: 'id' },
  { title: 'Invoice', key: 'invoice_number' },
  { title: 'Table', key: 'table_name' },
  { title: 'Status', key: 'status', type: 'status' },
  { title: 'Product Codes', key: 'product_codes' },
  { title: 'Products', key: 'product_names' },
  { title: 'Qty', key: 'total_quantity' },
  { title: 'Total', key: 'total' },
]

const orders = ref<OrderApiItem[]>([])
const loading = ref(false)
const errorMessage = ref('')
const deleteDialog = ref(false)
const deleteTarget = ref<DeleteTarget | null>(null)
const deleting = ref(false)

function formatCurrency(value: number) {
  return `$${Number(value ?? 0).toFixed(2)}`
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime()))
    return value

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const tableItems = computed(() => {
  return orders.value.map(order => ({
    id: order.id,
    invoice_number: order.invoice_number,
    table_name: order.table_name,
    status: order.status,
    product_codes: order.items.map(item => item.product_id).join(', '),
    product_names: order.items.map(item => item.product_name).join(', '),
    total_quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
    total: formatCurrency(order.total),
    created_at: formatDate(order.created_at),
  }))
})

const cards = computed(() => {
  const totalOrders = orders.value.length
  const pendingOrders = orders.value.filter(order => order.status === 'pending').length

  const totalRevenue = orders.value.reduce((sum, order) => sum + Number(order.total ?? 0), 0)

  const totalItems = orders.value.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
  }, 0)

  return [
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: 'mdi:receipt-text-outline',
      color: '#3b82f6',
    },
    {
      title: 'Pending Orders',
      value: pendingOrders,
      icon: 'mdi:clock-outline',
      color: '#f59e0b',
    },
    {
      title: 'Items Sold',
      value: totalItems,
      icon: 'mdi:food-outline',
      color: '#22c55e',
    },
    {
      title: 'Revenue',
      value: formatCurrency(totalRevenue),
      icon: 'mdi:cash-multiple',
      color: '#8b5cf6',
    },
  ]
})

async function fetchOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok)
      throw new Error(`Request failed with status ${response.status}`)

    const data = await response.json()

    if (Array.isArray(data))
      orders.value = data
    else if (data && Array.isArray(data.results))
      orders.value = data.results
    else if (data && Array.isArray(data.data))
      orders.value = data.data
    else
      orders.value = []
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch orders'
    orders.value = []
  }
  finally {
    loading.value = false
  }
}

function handleView(item: { id: number }) {
  router.push(`/orders/view/${item.id}`)
}

function handleEdit(item: { id: number }) {
  router.push(`/orders/edit/${item.id}`)
}

function handleDelete(item: DeleteTarget) {
  deleteTarget.value = item
  deleteDialog.value = true
}

function cancelDelete() {
  deleteDialog.value = false
  deleteTarget.value = null
}

async function confirmDelete() {
  if (!deleteTarget.value)
    return

  deleting.value = true

  try {
    const response = await fetch(`${API_URL}${deleteTarget.value.id}/`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok)
      throw new Error(`Delete failed with status ${response.status}`)

    deleteDialog.value = false
    deleteTarget.value = null
    await fetchOrders()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to delete order'
    deleteDialog.value = false
  }
  finally {
    deleting.value = false
  }
}

onMounted(fetchOrders)
</script>

<template>
  <div>
    <div class="card-container">
      <div
        v-for="(card, index) in cards"
        :key="index"
        class="card"
      >
        <div class="card-header">
          <Icon
            :icon="card.icon"
            class="icon"
            :style="{ color: card.color }"
          />
          <span>{{ card.title }}</span>
        </div>

        <div class="card-value">
          {{ card.value }}
        </div>
      </div>
    </div>

    <p
      v-if="loading"
      class="status-text"
    >
      Loading orders...
    </p>

    <p
      v-else-if="errorMessage"
      class="status-text error-text"
    >
      {{ errorMessage }}
    </p>

    <Tables
      title="Order List"
      subtitle="Manage and view all order headers with product codes"
      :headers="headers"
      :items="tableItems"
      item-key="id"
      :show-create-button="false"
      create-label="Create"
      create-route="/orders/create"
      @view="handleView"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <Teleport to="body">
      <Transition name="dialog">
        <div
          v-if="deleteDialog"
          class="dialog-overlay"
          @click.self="cancelDelete"
        >
          <div class="dialog-box">
            <div class="dialog-icon-wrap">
              <div class="dialog-icon">
                <Icon icon="mdi:trash-can-outline" />
              </div>
            </div>

            <h2 class="dialog-title">
              Delete Order
            </h2>

            <p class="dialog-message">
              Are you sure you want to delete
              <span class="dialog-name">"{{ deleteTarget?.invoice_number }}"</span>?
              This action cannot be undone.
            </p>

            <div class="dialog-actions">
              <button
                class="btn-cancel"
                :disabled="deleting"
                @click="cancelDelete"
              >
                Cancel
              </button>
              <button
                class="btn-delete"
                :disabled="deleting"
                @click="confirmDelete"
              >
                <Icon
                  v-if="deleting"
                  icon="mdi:loading"
                  class="spin"
                />
                <span>{{ deleting ? 'Deleting...' : 'Delete' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.card-container {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(4, 1fr);
  margin-block-end: 20px;
}

.card {
  padding: 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 9px rgba(0, 0, 0, 8%);
}

.card-header {
  display: flex;
  align-items: center;
  color: #555;
  font-size: 14px;
  gap: 10px;
}

.icon {
  font-size: 28px;
}

.card-value {
  font-size: 26px;
  font-weight: bold;
  margin-block-start: 10px;
}

.status-text {
  color: #555;
  margin-block: 0 16px;
}

.error-text {
  color: #ef4444;
}

.dialog-overlay {
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 40%);
  inset: 0;
}

.dialog-box {
  border-radius: 20px;
  background: white;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 18%);
  inline-size: 100%;
  max-inline-size: 400px;
  padding-block: 36px 28px;
  padding-inline: 32px;
  text-align: center;
}

.dialog-icon-wrap {
  display: flex;
  justify-content: center;
  margin-block-end: 18px;
}

.dialog-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fef2f2;
  block-size: 64px;
  color: #ef4444;
  font-size: 32px;
  inline-size: 64px;
}

.dialog-title {
  color: #111827;
  font-size: 20px;
  font-weight: 700;
  margin-block: 0 10px;
  margin-inline: 0;
}

.dialog-message {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
  margin-block: 0 28px;
  margin-inline: 0;
}

.dialog-name {
  color: #374151;
  font-weight: 600;
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-delete {
  flex: 1;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding-block: 10px;
  padding-inline: 16px;
  transition: all 0.15s ease;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: white;
  gap: 6px;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.btn-cancel:disabled,
.btn-delete:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .dialog-box,
.dialog-leave-active .dialog-box {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-box,
.dialog-leave-to .dialog-box {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 0.8s linear infinite;
}
</style>
