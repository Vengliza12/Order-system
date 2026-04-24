<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore, useProductStore, useTableStore } from '@/stores'

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'served', 'paid', 'cancelled']
const TAX_RATE = 0.1
const SERVICE_RATE = 0.05

type ResolvedOrderItem = {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const tableStore = useTableStore()
const productStore = useProductStore()
const { detailError, detailLoading, mutationError, submitting } = storeToRefs(orderStore)
const { items: tables } = storeToRefs(tableStore)
const { items: products } = storeToRefs(productStore)

const orderId = computed(() => String(route.params.id ?? ''))

function isResolvedOrderItem(item: ResolvedOrderItem | null): item is ResolvedOrderItem {
  return item !== null
}

const form = reactive({
  id: '',
  invoice_number: '',
  table_id: null as number | null,
  table_name: '',
  status: 'pending',
  notes: '',
  subtotal: 0,
  tax_amount: 0,
  service_charge: 0,
  total: 0,
  created_at: '',
})

const orderItems = ref<Array<{
  product_id: number | null
  quantity: number
}>>([])

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

function formatDate(value: string) {
  return orderStore.formatCreatedAt(value)
}

async function fetchOrder() {
  const order = await orderStore.fetchOrderById(orderId.value)

  if (!order)
    return

  form.id = String(order.id)
  form.invoice_number = order.invoice_number
  form.table_id = order.table_id
  form.table_name = order.table_name
  form.status = order.status
  form.notes = order.notes ?? ''
  form.subtotal = order.subtotal
  form.tax_amount = order.tax_amount
  form.service_charge = order.service_charge
  form.total = order.total
  form.created_at = order.created_at
  orderItems.value = (order.items ?? []).map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
  }))
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

async function submitForm() {
  const selectedTable = tables.value.find(table => table.id === form.table_id)

  if (!selectedTable) {
    orderStore.mutationError = 'Please select a table'

    return
  }

  if (!resolvedItems.value.length) {
    orderStore.mutationError = 'Please add at least one valid product'

    return
  }

  const updated = await orderStore.updateOrder(orderId.value, {
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

  if (updated)
    router.push('/orders')
}

onMounted(async () => {
  await Promise.all([
    tableStore.fetchTables(),
    productStore.fetchProducts(),
  ])

  await fetchOrder()
})
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Edit Order
        </h1>
        <p class="page-subtitle">
          Update order status
        </p>
      </div>
    </div>

    <VCard class="form-card">
      <VCardText>
        <div
          v-if="detailLoading"
          class="status-message"
        >
          Loading order...
        </div>

        <div
          v-else-if="detailError && !form.id"
          class="status-message error-message"
        >
          {{ detailError }}
        </div>

        <VForm
          v-else
          @submit.prevent="submitForm"
        >
          <div
            v-if="mutationError && form.id"
            class="status-message error-message mb-4"
          >
            {{ mutationError }}
          </div>

          <VRow>
            <VCol
              cols="12"
              md="6"
              class="detail-meta"
            >
              <span class="detail-id-label">Order ID</span>
              <span class="detail-id-value">#{{ form.id }}</span>
            </VCol>

            <VCol
              cols="12"
              md="6"
              class="detail-actions"
            >
              <VBtn
                color="secondary"
                variant="tonal"
                @click="router.push(`/orders/view/${orderId}`)"
              >
                Cancel
              </VBtn>

              <VBtn
                type="submit"
                color="primary"
                :loading="submitting"
              >
                Save
              </VBtn>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.invoice_number"
                label="Invoice Number"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="form.status"
                :items="STATUS_OPTIONS"
                label="Status"
              />
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
              <VTextField
                :model-value="formatDate(form.created_at)"
                label="Created At"
                readonly
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="form.notes"
                label="Notes"
                rows="3"
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

            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                :model-value="formatCurrency(subtotal)"
                label="Subtotal"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                :model-value="formatCurrency(taxAmount)"
                label="Tax"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                :model-value="formatCurrency(serviceCharge)"
                label="Service Charge"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                :model-value="formatCurrency(total)"
                label="Total"
                readonly
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.page-wrap {
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

.status-message {
  border-radius: 10px;
  padding-block: 12px;
  padding-inline: 14px;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-id-label {
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
}

.detail-id-value {
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
  padding-block: 6px;
  padding-inline: 12px;
}

.detail-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.item-row {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) 140px 100px;
}

.mb-4 {
  margin-block-end: 16px;
}
</style>
