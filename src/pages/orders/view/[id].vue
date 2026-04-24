<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const { detailError, detailLoading } = storeToRefs(orderStore)

const orderId = computed(() => String(route.params.id ?? ''))

const form = reactive({
  id: '',
  invoice_number: '',
  table_id: 0,
  table_name: '',
  status: '',
  notes: '',
  subtotal: 0,
  tax_amount: 0,
  service_charge: 0,
  total: 0,
  created_at: '',
})

const items = ref<Array<{
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}>>([])

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
  items.value = order.items ?? []
}

onMounted(fetchOrder)
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          View Order
        </h1>
        <p class="page-subtitle">
          Order header and line items
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
          v-else-if="detailError"
          class="status-message error-message"
        >
          {{ detailError }}
        </div>

        <VForm v-else>
          <VRow>
            <VCol
              cols="12"
              md="6"
              class="detail-meta"
            >
              <span class="detail-id-label">Order ID:</span>
              <span class="detail-id-value">#{{ form.id }}</span>
            </VCol>

            <VCol
              cols="12"
              md="6"
              class="detail-actions"
            >
              <VBtn
                color="primary"
                @click="router.push(`/orders/edit/${orderId}`)"
              >
                Edit
              </VBtn>
              <VBtn
                color="secondary"
                variant="tonal"
                @click="router.push('/orders')"
              >
                Back
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
              <VTextField
                v-model="form.status"
                label="Status"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                :model-value="String(form.table_id)"
                label="Table ID"
                readonly
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
  color: #6e6e6e;
  font-size: 16px;
  font-weight: 700;
  padding-block: 6px;
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
</style>
