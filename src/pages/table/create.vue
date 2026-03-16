<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const TABLE_API_URL = 'http://localhost:8000/tables/'

const form = reactive({
  name: '',
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

function resetForm() {
  form.name = ''
  errorMessage.value = ''
  successMessage.value = ''
}

async function submitForm() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await fetch(TABLE_API_URL, {
      method: 'POST',
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

    successMessage.value = 'Table created successfully.'
    resetForm()
    router.push('/table')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to create table'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="create-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Create Table
        </h1>
        <p class="page-subtitle">
          Create a new table header
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
                :loading="loading"
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

            <VCol cols="12">
              <VTextField
                v-model="form.name"
                label="Name"
                placeholder="A01"
                required
              />
            </VCol>

            <VCol
              v-if="errorMessage"
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

.success-message {
  background: #f0fdf4;
  color: #15803d;
}
</style>
