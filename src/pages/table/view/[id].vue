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

const loading = ref(false)
const errorMessage = ref('')

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
      throw new Error(`Request failed with status ${response.status}`)

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

onMounted(fetchTable)
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          View Table
        </h1>
        <p class="page-subtitle">
          Table information
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
          v-else-if="errorMessage"
          class="status-message error-message"
        >
          {{ errorMessage }}
        </div>

        <VForm v-else>
          <VRow>
            <VCol
              cols="12"
              md="6"
              class="detail-meta"
            >
              <span class="detail-id-label">Table ID:</span>
              <span class="detail-id-value">{{ form.id }}</span>
            </VCol>

            <VCol
              cols="12"
              md="6"
              class="detail-actions"
            >
              <VBtn
                color="primary"
                @click="router.push(`/table/edit/${tableId}`)"
              >
                Edit
              </VBtn>
              <VBtn
                color="secondary"
                variant="tonal"
                @click="router.push('/table')"
              >
                Back
              </VBtn>
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="form.name"
                label="Name"
                readonly
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
  color: #6b6b6b;
  font-size: 14px;
  font-weight: 700;
  padding-block: 6px;
}

.detail-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
</style>
