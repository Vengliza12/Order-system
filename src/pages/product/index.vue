<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Tables from '@/components/TableStatic.vue'

interface ProductApiItem {
  id: number
  name: string
  description: string
  category: string
  price: number
  stock: number
  image_url: string
  created_at: string
}

const API_URL = 'http://localhost:8000/products/'
const router = useRouter()

const headers = [
  { title: '#', key: 'id' },
  { title: 'Image', key: 'image_url', type: 'image' },
  { title: 'Name', key: 'name' },
  { title: 'Category', key: 'category' },
  { title: 'Price', key: 'price' },
  { title: 'Stock', key: 'stock' },
]

const products = ref<ProductApiItem[]>([])
const loading = ref(false)
const errorMessage = ref('')

const tableItems = computed(() => {
  return products.value.map(product => ({
    id: product.id,
    image_url: product.image_url,
    name: product.name,
    category: product.category,
    price: `$${Number(product.price).toFixed(2)}`,
    stock: product.stock,
  }))
})

const cards = computed(() => {
  const totalProducts = products.value.length
  const availableProducts = products.value.filter(p => p.stock > 0).length
  const outOfStockProducts = products.value.filter(p => p.stock === 0).length

  const newProducts = products.value.filter(product => {
    const createdDate = new Date(product.created_at)
    const ageInMs = Date.now() - createdDate.getTime()

    return ageInMs <= 7 * 24 * 60 * 60 * 1000
  }).length

  return [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: 'mdi:package-variant',
      color: '#3b82f6',
    },
    {
      title: 'Available Products',
      value: availableProducts,
      icon: 'mdi:check-circle',
      color: '#22c55e',
    },
    {
      title: 'Out of Stock',
      value: outOfStockProducts,
      icon: 'mdi:close-circle',
      color: '#ef4444',
    },
    {
      title: 'New Products',
      value: newProducts,
      icon: 'mdi:new-box',
      color: '#f59e0b',
    },
  ]
})

async function fetchProducts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok)
      throw new Error(`Request failed with status ${response.status}`)

    const data = await response.json()

    // Handle both array and paginated response shapes
    if (Array.isArray(data)) {
      products.value = data
    }
    else if (data && Array.isArray(data.results)) {
      products.value = data.results
    }
    else if (data && Array.isArray(data.data)) {
      products.value = data.data
    }
    else {
      console.warn('Unexpected response shape:', data)
      products.value = []
    }
  }
  catch (error) {
    // CORS errors show as generic TypeError — give a helpful message
    if (error instanceof TypeError && error.message === 'Failed to fetch')
      errorMessage.value = 'Network error: possible CORS issue or server is unreachable. Check the console for details.'

    else
      errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch products'

    console.error('[fetchProducts] Error:', error)
    products.value = []
  }
  finally {
    loading.value = false
  }
}

function handleView(item: { id: number }) {
  router.push(`/product/view/${item.id}`)
}

function handleEdit(item: { id: number }) {
  router.push(`/product/edit/${item.id}`)
}

onMounted(fetchProducts)
</script>

<template>
  <div>
    <!-- Product Cards -->
    <div class="card-container">
      <div
        v-for="(card, index) in cards"
        :key="index"
        class="card"
      >
        <div class="card-header">
          <Icon
            :icon="card.icon"
            class="icon"
            :style="{ color: card.color }"
          />
          <span>{{ card.title }}</span>
        </div>
        <div class="card-value">
          {{ card.value }}
        </div>
      </div>
    </div>
  </div>

  <!-- Table -->
  <Tables
    title="Product List"
    subtitle="Manage and view all products "
    :headers="headers"
    :items="tableItems"
    item-key="id"
    create-route="/product/create"
    @view="handleView"
    @edit="handleEdit"
  />
</template>

<style scoped>
.card-container {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(4, 1fr);
  margin-block-end: 20px;
}

.card {
  padding: 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 9px rgba(0, 0, 0, 8%);
}

.card-header {
  display: flex;
  align-items: center;
  color: #555;
  font-size: 14px;
  gap: 10px;
}

.icon {
  font-size: 28px;
}

.card-value {
  font-size: 26px;
  font-weight: bold;
  margin-block-start: 10px;
}

.error-banner {
  display: flex;
  align-items: center;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #ef4444;
  font-size: 14px;
  gap: 10px;
  margin-block-end: 16px;
  padding-block: 12px;
  padding-inline: 16px;
}

.error-icon {
  flex-shrink: 0;
  font-size: 20px;
}

.retry-btn {
  display: flex;
  align-items: center;
  border: none;
  border-radius: 6px;
  background: #ef4444;
  color: white;
  cursor: pointer;
  font-size: 13px;
  gap: 4px;
  margin-inline-start: auto;
  padding-block: 6px;
  padding-inline: 12px;
}

.retry-btn:hover {
  background: #dc2626;
}

.loading-banner {
  display: flex;
  align-items: center;
  border-radius: 8px;
  background: #eff6ff;
  color: #3b82f6;
  font-size: 14px;
  gap: 8px;
  margin-block-end: 16px;
  padding-block: 12px;
  padding-inline: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
  font-size: 20px;
}
</style>
