<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface CategoryApiItem {
  id: number
  name: string
  description: string
  image_url: string
  created_at: string
}

interface ProductDetail {
  id: number
  name: string
  description: string
  category: string
  price: number
  stock: number
  image_url: string
  created_at: string
}

const route = useRoute()
const router = useRouter()

const productId = computed(() => String(route.params.id ?? ''))
const productApiUrl = computed(() => `http://localhost:8000/products/${productId.value}`)
const productImageApiUrl = computed(() => `http://localhost:8000/products/${productId.value}/image`)
const categoryApiUrl = 'http://localhost:8000/categories/'

const categoryOptions = ref<string[]>([])
const categoryLoading = ref(false)
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
  category: '',
  price: 0,
  stock: 0,
  image_url: '',
})

function onImageChange(files: File | File[] | null) {
  const selectedFile = Array.isArray(files) ? (files[0] ?? null) : files

  imageFile.value = selectedFile
  imagePreviewUrl.value = selectedFile ? URL.createObjectURL(selectedFile) : form.image_url
}

async function fetchCategories() {
  categoryLoading.value = true

  try {
    const response = await fetch(categoryApiUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok)
      throw new Error(`Failed to fetch categories: ${response.status}`)

    const data = await response.json()
    const categories = Array.isArray(data) ? data : []

    categoryOptions.value = categories.map((c: CategoryApiItem) => c.name)
  }
  catch (error) {
    categoryOptions.value = []
    if (!errorMessage.value)
      errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch categories'
  }
  finally {
    categoryLoading.value = false
  }
}

async function fetchProduct() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(productApiUrl.value, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok)
      throw new Error(`Failed to fetch product: ${response.status}`)

    const data: ProductDetail = await response.json()

    form.id = String(data.id)
    form.name = data.name
    form.description = data.description
    form.category = data.category
    form.price = data.price
    form.stock = data.stock
    form.image_url = data.image_url
    imagePreviewUrl.value = data.image_url
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch product'
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
    // Step 1: Update product fields as JSON
    const response = await fetch(productApiUrl.value, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
      }),
    })

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null)
      const detail = errorJson?.detail ?? `Status ${response.status}`
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
    }

    // Step 2: Upload image separately using field name 'image' (as backend expects)
    if (imageFile.value) {
      const imageFormData = new FormData()

      imageFormData.append('image', imageFile.value, imageFile.value.name) // ✅ 'image' not 'image_url'

      const imageResponse = await fetch(productImageApiUrl.value, {
        method: 'PUT',
        headers: { Accept: 'application/json' },
        body: imageFormData,
      })

      if (!imageResponse.ok) {
        const imageErrorJson = await imageResponse.json().catch(() => null)
        const imageDetail = imageErrorJson?.detail ?? `Status ${imageResponse.status}`
        throw new Error(typeof imageDetail === 'string' ? imageDetail : JSON.stringify(imageDetail))
      }
    }

    successMessage.value = 'Product updated successfully.'
    router.push('/product')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to update product'
  }
  finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCategories()
  fetchProduct()
})
</script>

<template>
  <div class="edit-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Edit Product
        </h1>
        <p class="page-subtitle">
          Update product information
        </p>
      </div>
    </div>

    <VCard class="form-card">
      <VCardText>
        <div
          v-if="loading"
          class="status-message"
        >
          Loading product...
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
          <!-- Inline error shown during submit -->
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
              <span class="detail-id-label">Product ID</span>
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
                @click="router.push('/product')"
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
                v-model="form.name"
                label="Name"
                placeholder="Name"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="form.category"
                label="Category"
                :items="categoryOptions"
                :loading="categoryLoading"
                :disabled="categoryLoading || categoryOptions.length === 0"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="form.price"
                label="Price"
                type="number"
                min="0"
                step="0.01"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="form.stock"
                label="Stock"
                type="number"
                min="0"
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
                label="Product Image"
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

.mb-4 {
  margin-block-end: 16px;
}
</style>
