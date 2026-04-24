<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface CategoryDetail {
  id: number
  name: string
  description: string
  image_url: string | null
  created_at: string
}

const route = useRoute()
const router = useRouter()

const categoryId = computed(() => String(route.params.id ?? ''))
const apiUrl = computed(() => `http://10.1.42.168:8000/categories/${categoryId.value}`)

const form = reactive({
  id: '',
  name: '',
  description: '',
  image_url: '',
})

const loading = ref(false)
const errorMessage = ref('')

async function fetchCategory() {
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

    const data: CategoryDetail = await response.json()

    form.id = String(data.id)
    form.name = data.name
    form.description = data.description
    form.image_url = data.image_url ?? ''
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch category'
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchCategory)
</script>

<template>
  <div class="create-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          View Category
        </h1>
        <p class="page-subtitle">
          Category information
        </p>
      </div>
    </div>

    <VCard class="form-card">
      <VCardText>
        <div
          v-if="loading"
          class="status-message"
        >
          Loading category...
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
              <span class="detail-id-label">ID:</span>
              <span class="detail-id-value">{{ form.id }}</span>
            </VCol>

            <VCol
              cols="12"
              md="6"
              class="detail-actions"
            >
              <VBtn
                color="primary"
                @click="router.push(`/categories/edit/${categoryId}`)"
              >
                Edit
              </VBtn>
              <VBtn
                color="secondary"
                variant="tonal"
                @click="router.push('/categories')"
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

            <VCol cols="12">
              <VTextarea
                v-model="form.description"
                label="Description"
                rows="3"
                readonly
              />
            </VCol>

            <VCol
              v-if="form.image_url"
              cols="12"
            >
              <VImg
                :src="form.image_url"
                max-width="220"
                rounded="lg"
                cover
              />
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
