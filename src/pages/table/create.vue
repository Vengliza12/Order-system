<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTableStore } from '@/stores'

const router = useRouter()
const tableStore = useTableStore()
const { mutationError, submitting } = storeToRefs(tableStore)

const form = reactive({
  name: '',
})

const successMessage = ref('')

function resetForm() {
  form.name = ''
  successMessage.value = ''
  tableStore.clearMutationError()
}

async function submitForm() {
  successMessage.value = ''

  const created = await tableStore.createTable({
    name: form.name,
  })

  if (created) {
    successMessage.value = 'Table created successfully.'
    resetForm()
    router.push('/table')
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

            <VCol cols="12">
              <VTextField
                v-model="form.name"
                label="Name"
                placeholder="A01"
                required
              />
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
