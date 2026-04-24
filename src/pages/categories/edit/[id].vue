<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategoryStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const { detailLoading, mutationError, submitting } = storeToRefs(categoryStore)

const categoryId = computed(() => String(route.params.id ?? ''))
const successMessage = ref('')
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref('')

const form = reactive({
  id: '',
  name: '',
  description: '',
  image_url: '',
})

function onImageChange(files: File | File[] | null) {
  const selectedFile = Array.isArray(files) ? (files[0] ?? null) : files

  imageFile.value = selectedFile
  imagePreviewUrl.value = selectedFile ? URL.createObjectURL(selectedFile) : form.image_url
}

async function fetchCategory() {
  const category = await categoryStore.fetchCategoryById(categoryId.value)

  if (!category)
    return

  form.id = String(category.id)
  form.name = category.name
  form.description = category.description
  form.image_url = category.image_url ?? ''
  imagePreviewUrl.value = category.image_url ?? ''
}

async function submitForm() {
  successMessage.value = ''

  const updated = await categoryStore.updateCategory(categoryId.value, {
    name: form.name,
    description: form.description,
    imageFile: imageFile.value,
  })

  if (updated) {
    successMessage.value = 'Category updated successfully.'
    router.push('/categories')
  }
}

onMounted(fetchCategory)
</script>

<template>
  <div class="edit-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Edit Category
        </h1>
        <p class="page-subtitle">
          Update category information
        </p>
      </div>
    </div>

    <VCard class="form-card">
      <VCardText>
        <div
          v-if="detailLoading"
          class="status-message"
        >
          Loading category...
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
              <span class="detail-id-label">Category ID</span>
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
                @click="router.push(`/categories/view/${categoryId}`)"
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
                placeholder="fruit"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="form.description"
                label="Description"
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
              v-if="mutationError && form.id"
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
