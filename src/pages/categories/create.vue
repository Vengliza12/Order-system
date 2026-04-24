<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCategoryStore } from '@/stores'

const router = useRouter()
const categoryStore = useCategoryStore()
const { mutationError, submitting } = storeToRefs(categoryStore)

const form = reactive({
  name: '',
  description: '',
})

const successMessage = ref('')
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref('')

function resetForm() {
  form.name = ''
  form.description = ''
  successMessage.value = ''
  imageFile.value = null
  imagePreviewUrl.value = ''
  categoryStore.clearMutationError()
}

function onImageChange(files: File | File[] | null) {
  const selectedFile = Array.isArray(files) ? (files[0] ?? null) : files

  imageFile.value = selectedFile
  imagePreviewUrl.value = selectedFile ? URL.createObjectURL(selectedFile) : ''
}

async function submitForm() {
  successMessage.value = ''

  const created = await categoryStore.createCategory({
    name: form.name,
    description: form.description,
    imageFile: imageFile.value,
  })

  if (created) {
    successMessage.value = 'Category created successfully.'
    resetForm()
    router.push('/categories')
  }
}
</script>

<template>
  <div class="create-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Create Category
        </h1>
        <p class="page-subtitle">
          Create a new category in local state
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
                placeholder="fruit"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="form.description"
                label="Description"
                placeholder="Fresh fruits and seasonal produce"
                rows="3"
              />
            </VCol>

            <VCol cols="12">
              <VFileInput
                label="Category Image"
                accept="image/*"
                prepend-icon="bx-image-add"
                show-size
                @update:model-value="onImageChange"
              />
            </VCol>

            <VCol
              v-if="imagePreviewUrl"
              cols="12"
            >
              <VImg
                :src="imagePreviewUrl"
                max-width="220"
                rounded="lg"
                cover
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
