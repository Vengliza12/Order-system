<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface OrderItemDetail {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

interface OrderDetail {
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
  items: OrderItemDetail[]
  created_at: string
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'served', 'paid', 'cancelled']

const route = useRoute()
const router = useRouter()

const orderId = computed(() => String(route.params.id ?? ''))
const apiUrl = computed(() => `http://10.1.42.168:8000/orders/${orderId.value}`)
const statusApiUrl = computed(() => `http://10.1.42.168:8000/orders/${orderId.value}/status`)

const form = reactive({
  id: '',
  invoice_number: '',
  table_id: 0,
  table_name: '',
  status: 'pending',
  notes: '',
  subtotal: 0,
  tax_amount: 0,
  service_charge: 0,
  total: 0,
  created_at: '',
})

const items = ref<OrderItemDetail[]>([])
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

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

async function fetchOrder() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(apiUrl.value, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok)
      throw new Error(`Failed to fetch order: ${response.status}`)

    const data: OrderDetail = await response.json()

    form.id = String(data.id)
    form.invoice_number = data.invoice_number
    form.table_id = data.table_id
    form.table_name = data.table_name
    form.status = data.status
    form.notes = data.notes ?? ''
    form.subtotal = data.subtotal
    form.tax_amount = data.tax_amount
    form.service_charge = data.service_charge
    form.total = data.total
    form.created_at = data.created_at
    items.value = data.items ?? []
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch order'
  }
  finally {
    loading.value = false
  }
}

async function submitForm() {
  submitting.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(statusApiUrl.value, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: form.status,
      }),
    })

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null)
      const detail = errorJson?.detail ?? `Status ${response.status}`
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
    }

    router.push('/orders')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to update order'
  }
  finally {
    submitting.value = false
  }
}

onMounted(fetchOrder)
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
          v-if="loading"
          class="status-message"
        >
          Loading order...
        </div>

        <div
          v-else-if="errorMessage && !form.id"
          class="status-message error-message"
        >
          {{ errorMessage }}
        </div>

        <VForm
          v-else
          @submit.prevent="submitForm"
        >
          <div
            v-if="errorMessage && form.id"
            class="status-message error-message mb-4"
          >
            {{ errorMessage }}
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
              <VTextField
                v-model="form.table_name"
                label="Table Name"
                readonly
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
                readonly
              />
            </VCol>

            <VCol cols="12">
              <div class="section-title">
                Order Items
              </div>

              <VTable class="items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in items"
                    :key="item.id"
                  >
                    <td>{{ item.id }}</td>
                    <td>{{ item.product_id }}</td>
                    <td>{{ item.product_name }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ formatCurrency(item.unit_price) }}</td>
                    <td>{{ formatCurrency(item.line_total) }}</td>
                  </tr>
                  <tr v-if="items.length === 0">
                    <td
                      colspan="6"
                      class="empty-cell"
                    >
                      No order items
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                :model-value="formatCurrency(form.subtotal)"
                label="Subtotal"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                :model-value="formatCurrency(form.tax_amount)"
                label="Tax"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                :model-value="formatCurrency(form.service_charge)"
                label="Service Charge"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                :model-value="formatCurrency(form.total)"
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
  margin-block-end: 12px;
}

.items-table {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.empty-cell {
  padding: 16px;
  color: #6b7280;
  text-align: center;
}

.mb-4 {
  margin-block-end: 16px;
}
</style>
