<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface CategoryApiItem {
  id: number
  name: string
  description: string
  image_url: string
  created_at: string
}

interface ProductCreatedResponse {
  id: number
  name: string
  description: string
  category: string
  price: number
  stock: number
  image_url: string
  created_at: string
}

const PRODUCT_API_URL = 'http://10.1.42.168:8000/products/'
const CATEGORY_API_URL = 'http://10.1.42.168:8000/categories/'

const categoryOptions = ref<string[]>([])
const categoryLoading = ref(false)

const form = reactive({
  name: '',
  description: '',
  category: '',
  price: 0,
  stock: 0,
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref('')

function resetForm() {
  form.name = ''
  form.description = ''
  form.category = categoryOptions.value[0] || ''
  form.price = 0
  form.stock = 0
  errorMessage.value = ''
  successMessage.value = ''
  imageFile.value = null
  imagePreviewUrl.value = ''
}

function onImageChange(files: File | File[] | null) {
  const selectedFile = Array.isArray(files) ? (files[0] ?? null) : files

  imageFile.value = selectedFile
  imagePreviewUrl.value = selectedFile ? URL.createObjectURL(selectedFile) : ''
}

async function fetchCategories() {
  categoryLoading.value = true

  try {
    const response = await fetch(CATEGORY_API_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok)
      throw new Error(`Failed to fetch categories: ${response.status}`)

    const data = await response.json()
    const categories = Array.isArray(data) ? data : []

    categoryOptions.value = categories.map((category: CategoryApiItem) => category.name)

    if (!form.category && categoryOptions.value.length > 0)
      form.category = categoryOptions.value[0]
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

async function submitForm() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Step 1: Create product with JSON
    const response = await fetch(PRODUCT_API_URL, {
      method: 'POST',
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
        image_url: '',
      }),
    })

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null)
      const detail = errorJson?.detail ?? `Status ${response.status}`
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
    }

    const created: ProductCreatedResponse = await response.json()

    // Step 2: Upload image separately if provided
    if (imageFile.value) {
      const imageFormData = new FormData()

      imageFormData.append('image', imageFile.value, imageFile.value.name)

      const imageResponse = await fetch(`http://10.1.42.168:8000/products/${created.id}/image`, {
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

    successMessage.value = 'Product created successfully.'
    resetForm()
    router.push('/product')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to create product'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="create-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Create Product
        </h1>
        <p class="page-subtitle">
          Submit a new product to the API
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
                placeholder="Description"
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
