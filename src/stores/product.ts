import { defineStore } from 'pinia'
import { fileToDataUrl, getErrorMessage, getNextId, loadCollection, saveCollection } from './helpers'

export interface ProductItem {
  id: number
  name: string
  description: string
  category: string
  price: number
  stock: number
  image_url: string
  created_at: string
}

interface ProductPayload {
  name: string
  description: string
  category: string
  price: number
  stock: number
  imageFile?: File | null
}

const STORAGE_KEY = 'mobile-order-smart.products'

function buildProductImagePlaceholder(name: string) {
  const label = (name.trim().slice(0, 2) || 'PR').toUpperCase()

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="160" viewBox="0 0 220 160">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1d4ed8"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="220" height="160" rx="18" fill="url(#g)"/>
      <circle cx="170" cy="42" r="26" fill="rgba(255,255,255,0.16)"/>
      <circle cx="56" cy="120" r="34" fill="rgba(255,255,255,0.12)"/>
      <text x="110" y="92" font-size="42" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">${label}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const useProductStore = defineStore('products', {
  state: () => ({
    items: [] as ProductItem[],
    currentProduct: null as ProductItem | null,
    listLoading: false,
    detailLoading: false,
    submitting: false,
    deleting: false,
    listError: '',
    detailError: '',
    mutationError: '',
  }),

  getters: {
    tableItems: state => state.items.map(product => ({
      id: product.id,
      image_url: product.image_url,
      name: product.name,
      category: product.category,
      price: `$${Number(product.price).toFixed(2)}`,
      stock: product.stock,
    })),

    cards: state => {
      const totalProducts = state.items.length
      const availableProducts = state.items.filter(product => product.stock > 0).length
      const outOfStockProducts = state.items.filter(product => product.stock === 0).length

      const newProducts = state.items.filter(product => {
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
    },
  },

  actions: {
    syncStorage() {
      saveCollection(STORAGE_KEY, this.items)
    },

    clearMutationError() {
      this.mutationError = ''
    },

    async fetchProducts() {
      this.listLoading = true
      this.listError = ''

      try {
        this.items = loadCollection<ProductItem>(STORAGE_KEY)
      }
      catch (error) {
        this.listError = getErrorMessage(error, 'Failed to load products')
        this.items = []
      }
      finally {
        this.listLoading = false
      }
    },

    async fetchProductById(id: string | number) {
      this.detailLoading = true
      this.detailError = ''

      try {
        const resolvedId = Number(id)

        if (!this.items.length)
          this.items = loadCollection<ProductItem>(STORAGE_KEY)

        this.currentProduct = this.items.find(item => item.id === resolvedId) ?? null

        if (!this.currentProduct)
          throw new Error('Product not found')

        return this.currentProduct
      }
      catch (error) {
        this.detailError = getErrorMessage(error, 'Failed to load product')
        this.currentProduct = null

        return null
      }
      finally {
        this.detailLoading = false
      }
    },

    async createProduct(payload: ProductPayload) {
      this.submitting = true
      this.mutationError = ''

      try {
        const id = getNextId(this.items)

        const imageUrl = payload.imageFile
          ? await fileToDataUrl(payload.imageFile)
          : buildProductImagePlaceholder(payload.name)

        const createdProduct: ProductItem = {
          id,
          name: payload.name.trim(),
          description: payload.description.trim(),
          category: payload.category,
          price: Number(payload.price),
          stock: Number(payload.stock),
          image_url: imageUrl,
          created_at: new Date().toISOString(),
        }

        this.items = [createdProduct, ...this.items]
        this.syncStorage()

        return createdProduct
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to create product')

        return null
      }
      finally {
        this.submitting = false
      }
    },

    async updateProduct(id: string | number, payload: ProductPayload) {
      this.submitting = true
      this.mutationError = ''

      try {
        const resolvedId = Number(id)
        const currentProduct = this.items.find(item => item.id === resolvedId)

        if (!currentProduct)
          throw new Error('Product not found')

        const imageUrl = payload.imageFile
          ? await fileToDataUrl(payload.imageFile)
          : currentProduct.image_url

        const updatedProduct: ProductItem = {
          ...currentProduct,
          name: payload.name.trim(),
          description: payload.description.trim(),
          category: payload.category,
          price: Number(payload.price),
          stock: Number(payload.stock),
          image_url: imageUrl,
        }

        this.currentProduct = updatedProduct
        this.items = this.items.map(item => item.id === updatedProduct.id ? updatedProduct : item)
        this.syncStorage()

        return updatedProduct
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to update product')

        return null
      }
      finally {
        this.submitting = false
      }
    },

    async deleteProduct(id: number) {
      this.deleting = true
      this.mutationError = ''

      try {
        this.items = this.items.filter(item => item.id !== id)
        this.syncStorage()

        return true
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to delete product')

        return false
      }
      finally {
        this.deleting = false
      }
    },
  },
})
