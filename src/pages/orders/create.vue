<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderStore, useProductStore, useTableStore } from '@/stores'

type DraftOrderItem = {
  product_id: number | null
  quantity: number
}

type ResolvedOrderItem = {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'served', 'paid', 'cancelled']
const TAX_RATE = 0.1
const SERVICE_RATE = 0.05

const router = useRouter()
const orderStore = useOrderStore()
const tableStore = useTableStore()
const productStore = useProductStore()
const { submitting, mutationError } = storeToRefs(orderStore)
const { items: tables } = storeToRefs(tableStore)
const { items: products } = storeToRefs(productStore)

const form = reactive({
  table_id: null as number | null,
  status: 'pending',
  notes: '',
})

const orderItems = ref<DraftOrderItem[]>([
  { product_id: null, quantity: 1 },
])

const successMessage = ref('')

function isResolvedOrderItem(item: ResolvedOrderItem | null): item is ResolvedOrderItem {
  return item !== null
}

const tableOptions = computed(() => {
  return tables.value.map(table => ({
    title: `${table.name} (${table.code})`,
    value: table.id,
  }))
})

const productOptions = computed(() => {
  return products.value.map(product => ({
    title: `${product.name} - $${Number(product.price).toFixed(2)}`,
    value: product.id,
  }))
})

const resolvedItems = computed(() => {
  return orderItems.value
    .map((item, index) => {
      const product = products.value.find(entry => entry.id === item.product_id)

      if (!product)
        return null

      const quantity = Math.max(1, Number(item.quantity) || 1)
      const unitPrice = Number(product.price)

      return {
        id: index + 1,
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        line_total: unitPrice * quantity,
      }
    })
    .filter(isResolvedOrderItem)
})

const subtotal = computed(() => {
  return resolvedItems.value.reduce((sum, item) => sum + item.line_total, 0)
})

const taxAmount = computed(() => subtotal.value * TAX_RATE)
const serviceCharge = computed(() => subtotal.value * SERVICE_RATE)
const total = computed(() => subtotal.value + taxAmount.value + serviceCharge.value)

function formatCurrency(value: number) {
  return orderStore.formatCurrency(value)
}

function addItemRow() {
  orderItems.value.push({
    product_id: null,
    quantity: 1,
  })
}

function removeItemRow(index: number) {
  orderItems.value.splice(index, 1)

  if (!orderItems.value.length)
    addItemRow()
}

function resetForm() {
  form.table_id = tableOptions.value[0]?.value ?? null
  form.status = 'pending'
  form.notes = ''
  orderItems.value = [{ product_id: null, quantity: 1 }]
  successMessage.value = ''
  orderStore.clearMutationError()
}

async function submitForm() {
  successMessage.value = ''

  const selectedTable = tables.value.find(table => table.id === form.table_id)

  if (!selectedTable) {
    orderStore.mutationError = 'Please select a table'

    return
  }

  if (!resolvedItems.value.length) {
    orderStore.mutationError = 'Please add at least one valid product'

    return
  }

  const created = await orderStore.createOrder({
    table_id: selectedTable.id,
    table_name: selectedTable.name,
    status: form.status,
    notes: form.notes.trim() || null,
    items: resolvedItems.value,
    subtotal: subtotal.value,
    tax_amount: taxAmount.value,
    service_charge: serviceCharge.value,
    total: total.value,
  })

  if (created) {
    successMessage.value = 'Order created successfully.'
    resetForm()
    router.push('/orders')
  }
}

onMounted(async () => {
  await Promise.all([
    tableStore.fetchTables(),
    productStore.fetchProducts(),
  ])

  if (!form.table_id)
    form.table_id = tableOptions.value[0]?.value ?? null
})
</script>

<template>
  <div class="create-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Create Order
        </h1>
        <p class="page-subtitle">
          Build a new order from local tables and products
        </p>
      </div>
    </div>

    <VCard class="form-card">
      <VCardText>
        <VForm @submit.prevent="submitForm">
          <VRow>
            <VCol
              cols="12"
              class="d-flex gap-4 justify-end"
            >
              <VBtn
                type="submit"
                :loading="submitting"
              >
                Create
              </VBtn>

              <VBtn
                type="button"
                color="secondary"
                variant="tonal"
                @click="resetForm"
              >
                Reset
              </VBtn>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="form.table_id"
                label="Table"
                :items="tableOptions"
                :disabled="tableOptions.length === 0"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="form.status"
                label="Status"
                :items="STATUS_OPTIONS"
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="form.notes"
                label="Notes"
                rows="3"
                placeholder="Special instructions or remarks"
              />
            </VCol>

            <VCol cols="12">
              <div class="section-header">
                <div class="section-title">
                  Order Items
                </div>
                <VBtn
                  type="button"
                  size="small"
                  color="primary"
                  variant="tonal"
                  @click="addItemRow"
                >
                  Add Item
                </VBtn>
              </div>
            </VCol>

            <VCol
              v-for="(item, index) in orderItems"
              :key="index"
              cols="12"
            >
              <div class="item-row">
                <VSelect
                  v-model="item.product_id"
                  class="item-field"
                  label="Product"
                  :items="productOptions"
                  :disabled="productOptions.length === 0"
                />

                <VTextField
                  v-model.number="item.quantity"
                  class="qty-field"
                  label="Qty"
                  type="number"
                  min="1"
                />

                <VBtn
                  type="button"
                  color="error"
                  variant="text"
                  @click="removeItemRow(index)"
                >
                  Remove
                </VBtn>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="summary-card">
                <div class="summary-line">
                  <span>Subtotal</span>
                  <span>{{ formatCurrency(subtotal) }}</span>
                </div>
                <div class="summary-line">
                  <span>Tax</span>
                  <span>{{ formatCurrency(taxAmount) }}</span>
                </div>
                <div class="summary-line">
                  <span>Service Charge</span>
                  <span>{{ formatCurrency(serviceCharge) }}</span>
                </div>
                <div class="summary-line total-line">
                  <span>Total</span>
                  <span>{{ formatCurrency(total) }}</span>
                </div>
              </div>
            </VCol>

            <VCol
              v-if="mutationError"
              cols="12"
            >
              <div class="status-message error-message">
                {{ mutationError }}
              </div>
            </VCol>

            <VCol
              v-if="successMessage"
              cols="12"
            >
              <div class="status-message success-message">
                {{ successMessage }}
              </div>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.create-page {
  display: grid;
  gap: 20px;
}

.page-title {
  margin: 0;
  font-size: 28px;
}

.page-subtitle {
  color: #6b7280;
  margin-block: 4px 0;
  margin-inline: 0;
}

.form-card {
  border-radius: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.item-row {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) 140px 100px;
}

.summary-card {
  border-radius: 12px;
  background: #f8fafc;
  padding: 16px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-block-end: 8px;
}

.summary-line:last-child {
  margin-block-end: 0;
}

.total-line {
  border-top: 1px solid #e2e8f0;
  font-weight: 700;
  margin-block-start: 12px;
  padding-block-start: 12px;
}

.status-message {
  border-radius: 10px;
  padding-block: 12px;
  padding-inline: 14px;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
}

.success-message {
  background: #f0fdf4;
  color: #15803d;
}
</style>
