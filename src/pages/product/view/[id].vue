<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const { detailError, detailLoading } = storeToRefs(productStore)

const productId = computed(() => String(route.params.id ?? ''))

const form = reactive({
  id: '',
  name: '',
  description: '',
  category: '',
  price: 0,
  stock: 0,
  image_url: '',
})

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
}

onMounted(fetchProduct)
</script>

<template>
  <div class="create-page">
    <div class="page-header ">
      <div>
        <h1 class="page-title">
          View Product
        </h1>
        <p class="page-subtitle">
          Product information
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
          v-else-if="detailError"
          class="status-message error-message"
        >
          {{ detailError }}
        </div>

        <VForm v-else>
          <VRow>
            <VCol
              cols="12"
              md="6"
              class="detail-meta"
            >
              <span class="detail-id-label">ID :</span>
              <span class="detail-id-value">{{ form.id }}</span>
            </VCol>

            <VCol
              cols="12"
              md="6"
              class="detail-actions"
            >
              <VBtn
                color="primary"
                @click="router.push(`/product/edit/${productId}`)"
              >
                Edit
              </VBtn>
              <VBtn
                color="secondary"
                variant="tonal"
                @click="router.push('/product')"
              >
                Back
              </VBtn>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.name"
                label="Name"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.category"
                label="Category"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.price"
                label="Price"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.stock"
                label="Stock"
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
  padding-inline-start: 5px;
}

.detail-id-value {
  color: #6e6e6e;
  font-size: 16px;
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
