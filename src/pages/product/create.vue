<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCategoryStore, useProductStore } from '@/stores'

const router = useRouter()
const categoryStore = useCategoryStore()
const productStore = useProductStore()
const { categoryNames } = storeToRefs(categoryStore)
const { mutationError, submitting } = storeToRefs(productStore)

const form = reactive({
  name: '',
  description: '',
  category: '',
  price: 0,
  stock: 0,
})

const successMessage = ref('')
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref('')

function resetForm() {
  form.name = ''
  form.description = ''
  form.category = categoryNames.value[0] || ''
  form.price = 0
  form.stock = 0
  successMessage.value = ''
  imageFile.value = null
  imagePreviewUrl.value = ''
  productStore.clearMutationError()
}

function onImageChange(files: File | File[] | null) {
  const selectedFile = Array.isArray(files) ? (files[0] ?? null) : files

  imageFile.value = selectedFile
  imagePreviewUrl.value = selectedFile ? URL.createObjectURL(selectedFile) : ''
}

async function submitForm() {
  successMessage.value = ''

  const created = await productStore.createProduct({
    name: form.name,
    description: form.description,
    category: form.category,
    price: Number(form.price),
    stock: Number(form.stock),
    imageFile: imageFile.value,
  })

  if (created) {
    successMessage.value = 'Product created successfully.'
    resetForm()
    router.push('/product')
  }
}

onMounted(() => {
  categoryStore.fetchCategories().then(() => {
    if (!form.category && categoryNames.value.length > 0)
      form.category = categoryNames.value[0]
  })
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
          Create a new product in local state
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
