<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategoryStore, useProductStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const productStore = useProductStore()
const { categoryNames } = storeToRefs(categoryStore)
const { detailError, detailLoading, mutationError, submitting } = storeToRefs(productStore)

const productId = computed(() => String(route.params.id ?? ''))
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

async function fetchProduct() {
  const product = await productStore.fetchProductById(productId.value)

  if (!product)
    return

  form.id = String(product.id)
  form.name = product.name
  form.description = product.description
  form.category = product.category
  form.price = product.price
  form.stock = product.stock
  form.image_url = product.image_url
  imagePreviewUrl.value = product.image_url
}

async function submitForm() {
  successMessage.value = ''

  const updated = await productStore.updateProduct(productId.value, {
    name: form.name,
    description: form.description,
    category: form.category,
    price: Number(form.price),
    stock: Number(form.stock),
    imageFile: imageFile.value,
  })

  if (updated) {
    successMessage.value = 'Product updated successfully.'
    router.push('/product')
  }
}

onMounted(() => {
  categoryStore.fetchCategories()
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
          v-if="detailLoading"
          class="status-message"
        >
          Loading product...
        </div>

        <div
          v-else-if="detailError && !form.id"
          class="status-message error-message"
        >
          {{ detailError }}
        </div>

        <VForm
          v-else
          @submit.prevent="submitForm"
        >
          <div
            v-if="mutationError && form.id"
            class="status-message error-message mb-4"
          >
            {{ mutationError }}
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
                :items="categoryNames"
                :disabled="categoryNames.length === 0"
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
