<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface TableDetail {
  id: number
  name: string
  code: string
  is_active: boolean
  qr_url: string
  created_at: string
}

const route = useRoute()
const router = useRouter()

const tableId = computed(() => String(route.params.id ?? ''))
const apiUrl = computed(() => `http://10.1.42.168:8000/tables/${tableId.value}`)

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  id: '',
  name: '',
  code: '',
  is_active: false,
  qr_url: '',
  created_at: '',
})

const qrImageUrl = computed(() => {
  return form.code ? `http://10.1.42.168:8000/tables/qr/${form.code}` : ''
})

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime()))
    return value

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

async function fetchTable() {
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
      throw new Error(`Failed to fetch table: ${response.status}`)

    const data: TableDetail = await response.json()

    form.id = String(data.id)
    form.name = data.name
    form.code = data.code
    form.is_active = data.is_active
    form.qr_url = data.qr_url
    form.created_at = data.created_at
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch table'
  }
  finally {
    loading.value = false
  }
}

async function submitForm() {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await fetch(apiUrl.value, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.name,
      }),
    })

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null)
      const detail = errorJson?.detail ?? `Status ${response.status}`
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
    }

    successMessage.value = 'Table updated successfully.'
    router.push(`/table/view/${tableId.value}`)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to update table'
  }
  finally {
    submitting.value = false
  }
}

onMounted(fetchTable)
</script>

<template>
  <div class="edit-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Edit Table
        </h1>
        <p class="page-subtitle">
          Update table information
        </p>
      </div>
    </div>

    <VCard class="form-card">
      <VCardText>
        <div
          v-if="loading"
          class="status-message"
        >
          Loading table...
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
          <VRow>
            <VCol
              cols="12"
              md="6"
              class="detail-meta"
            >
              <span class="detail-id-label">Table ID</span>
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
                @click="router.push(`/table/view/${tableId}`)"
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

            <VCol cols="12">
              <VTextField
                v-model="form.name"
                label="Name"
                placeholder="A01"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.code"
                label="Code"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                :model-value="form.is_active ? 'Active' : 'Inactive'"
                label="Status"
                readonly
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="form.qr_url"
                label="QR URL"
                readonly
              />
            </VCol>

            <VCol
              v-if="qrImageUrl"
              cols="12"
            >
              <VImg
                :src="qrImageUrl"
                max-width="240"
                rounded="lg"
                cover
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                :model-value="formatDate(form.created_at)"
                label="Created At"
                readonly
              />
            </VCol>

            <VCol
              v-if="errorMessage && form.id"
              cols="12"
            >
              <div class="status-message error-message">
                {{ errorMessage }}
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
.edit-page {
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

.success-message {
  background: #f0fdf4;
  color: #15803d;
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
</style>
