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
const categoryApiUrl = computed(() => `http://10.1.42.168:8000/categories/${categoryId.value}`)
const categoryImageApiUrl = computed(() => `http://10.1.42.168:8000/categories/${categoryId.value}/image`)

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
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
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(categoryApiUrl.value, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok)
      throw new Error(`Failed to fetch category: ${response.status}`)

    const data: CategoryDetail = await response.json()

    form.id = String(data.id)
    form.name = data.name
    form.description = data.description
    form.image_url = data.image_url ?? ''
    imagePreviewUrl.value = data.image_url ?? ''
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch category'
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
    const response = await fetch(categoryApiUrl.value, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        image_url: form.image_url,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Request failed with status ${response.status}`)
    }

    if (imageFile.value) {
      const imageFormData = new FormData()

      imageFormData.append('image', imageFile.value, imageFile.value.name)

      const imageResponse = await fetch(categoryImageApiUrl.value, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
        },
        body: imageFormData,
      })

      if (!imageResponse.ok) {
        const imageErrorText = await imageResponse.text()
        throw new Error(imageErrorText || `Image update failed with status ${imageResponse.status}`)
      }
    }

    successMessage.value = 'Category updated successfully.'
    router.push('/categories')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to update category'
  }
  finally {
    submitting.value = false
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
          v-if="loading"
          class="status-message"
        >
          Loading category...
        </div>

        <!--
          <div
          v-else-if="errorMessage && !form.id"
          class="status-message error-message"
          >
          {{ errorMessage }}
          </div>
        -->

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
