import { defineStore } from 'pinia'
import { fileToDataUrl, formatDate, getErrorMessage, getNextId, loadCollection, saveCollection } from './helpers'

export interface CategoryItem {
  id: number
  name: string
  description: string
  image_url: string | null
  created_at: string
}

interface CategoryPayload {
  name: string
  description: string
  imageFile?: File | null
}

const STORAGE_KEY = 'mobile-order-smart.categories'

export const useCategoryStore = defineStore('categories', {
  state: () => ({
    items: [] as CategoryItem[],
    currentCategory: null as CategoryItem | null,
    listLoading: false,
    detailLoading: false,
    submitting: false,
    deleting: false,
    listError: '',
    detailError: '',
    mutationError: '',
  }),

  getters: {
    tableItems: state => state.items.map(category => ({
      id: category.id,
      image_url: category.image_url,
      name: category.name,
      description: category.description,
    })),

    cards: state => {
      const totalCategories = state.items.length

      const newCategories = state.items.filter(category => {
        const createdDate = new Date(category.created_at)
        const ageInMs = Date.now() - createdDate.getTime()

        return ageInMs <= 7 * 24 * 60 * 60 * 1000
      }).length

      return [
        {
          title: 'Total Categories',
          value: totalCategories,
          icon: 'mdi:package-variant',
          color: '#3b82f6',
        },
        {
          title: 'New Categories',
          value: newCategories,
          icon: 'mdi:new-box',
          color: '#f59e0b',
        },
      ]
    },

    categoryNames: state => state.items.map(category => category.name),

    categoryOptions: state => state.items.map(category => ({
      title: category.name,
      value: category.name,
    })),
  },

  actions: {
    syncStorage() {
      saveCollection(STORAGE_KEY, this.items)
    },

    clearMutationError() {
      this.mutationError = ''
    },

    async fetchCategories() {
      this.listLoading = true
      this.listError = ''

      try {
        this.items = loadCollection<CategoryItem>(STORAGE_KEY)
      }
      catch (error) {
        this.listError = getErrorMessage(error, 'Failed to load categories')
        this.items = []
      }
      finally {
        this.listLoading = false
      }
    },

    async fetchCategoryById(id: string | number) {
      this.detailLoading = true
      this.detailError = ''

      try {
        const resolvedId = Number(id)

        if (!this.items.length)
          this.items = loadCollection<CategoryItem>(STORAGE_KEY)

        this.currentCategory = this.items.find(item => item.id === resolvedId) ?? null

        if (!this.currentCategory)
          throw new Error('Category not found')

        return this.currentCategory
      }
      catch (error) {
        this.detailError = getErrorMessage(error, 'Failed to load category')
        this.currentCategory = null

        return null
      }
      finally {
        this.detailLoading = false
      }
    },

    async createCategory(payload: CategoryPayload) {
      this.submitting = true
      this.mutationError = ''

      try {
        const id = getNextId(this.items)
        const imageUrl = payload.imageFile ? await fileToDataUrl(payload.imageFile) : null

        const createdCategory: CategoryItem = {
          id,
          name: payload.name.trim(),
          description: payload.description.trim(),
          image_url: imageUrl,
          created_at: new Date().toISOString(),
        }

        this.items = [createdCategory, ...this.items]
        this.syncStorage()

        return createdCategory
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to create category')

        return null
      }
      finally {
        this.submitting = false
      }
    },

    async updateCategory(id: string | number, payload: CategoryPayload) {
      this.submitting = true
      this.mutationError = ''

      try {
        const resolvedId = Number(id)
        const currentCategory = this.items.find(item => item.id === resolvedId)

        if (!currentCategory)
          throw new Error('Category not found')

        const imageUrl = payload.imageFile
          ? await fileToDataUrl(payload.imageFile)
          : currentCategory.image_url

        const updatedCategory: CategoryItem = {
          ...currentCategory,
          name: payload.name.trim(),
          description: payload.description.trim(),
          image_url: imageUrl,
        }

        this.currentCategory = updatedCategory
        this.items = this.items.map(item => item.id === updatedCategory.id ? updatedCategory : item)
        this.syncStorage()

        return updatedCategory
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to update category')

        return null
      }
      finally {
        this.submitting = false
      }
    },

    async deleteCategory(id: number) {
      this.deleting = true
      this.mutationError = ''

      try {
        this.items = this.items.filter(item => item.id !== id)
        this.syncStorage()

        return true
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to delete category')

        return false
      }
      finally {
        this.deleting = false
      }
    },

    formatCreatedAt(value: string) {
      return formatDate(value)
    },
  },
})
