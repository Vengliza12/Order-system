import { defineStore } from 'pinia'
import { formatDate, getErrorMessage, getNextId, loadCollection, saveCollection } from './helpers'
import { useProductStore } from './product'

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface OrderRecord {
  id: number
  table_id: number
  table_name: string
  status: string
  notes: string | null
  subtotal: number
  tax_amount: number
  service_charge: number
  total: number
  invoice_number: string
  items: OrderItem[]
  created_at: string
}

interface OrderPayload {
  table_id: number
  table_name: string
  status: string
  notes: string | null
  items: OrderItem[]
  subtotal: number
  tax_amount: number
  service_charge: number
  total: number
}

const STORAGE_KEY = 'mobile-order-smart.orders'

function formatCurrency(value: number) {
  return `$${Number(value ?? 0).toFixed(2)}`
}

function createInvoiceNumber(id: number) {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')

  return `INV-${y}${m}${d}-${String(id).padStart(4, '0')}`
}

function summarizeItemQuantities(items: OrderItem[]) {
  return items.reduce<Record<number, number>>((accumulator, item) => {
    accumulator[item.product_id] = (accumulator[item.product_id] ?? 0) + item.quantity

    return accumulator
  }, {})
}

export const useOrderStore = defineStore('orders', {
  state: () => ({
    items: [] as OrderRecord[],
    currentOrder: null as OrderRecord | null,
    listLoading: false,
    detailLoading: false,
    submitting: false,
    deleting: false,
    listError: '',
    detailError: '',
    mutationError: '',
  }),

  getters: {
    tableItems: state => state.items.map(order => ({
      id: order.id,
      invoice_number: order.invoice_number,
      table_name: order.table_name,
      status: order.status,
      product_codes: order.items.map(item => item.product_id).join(', '),
      product_names: order.items.map(item => item.product_name).join(', '),
      total_quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: formatCurrency(order.total),
      created_at: formatDate(order.created_at),
    })),

    cards: state => {
      const totalOrders = state.items.length
      const pendingOrders = state.items.filter(order => order.status === 'pending').length
      const totalRevenue = state.items.reduce((sum, order) => sum + Number(order.total ?? 0), 0)

      const totalItems = state.items.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
      }, 0)

      return [
        {
          title: 'Total Orders',
          value: totalOrders,
          icon: 'mdi:receipt-text-outline',
          color: '#3b82f6',
        },
        {
          title: 'Pending Orders',
          value: pendingOrders,
          icon: 'mdi:clock-outline',
          color: '#f59e0b',
        },
        {
          title: 'Items Sold',
          value: totalItems,
          icon: 'mdi:food-outline',
          color: '#22c55e',
        },
        {
          title: 'Revenue',
          value: formatCurrency(totalRevenue),
          icon: 'mdi:cash-multiple',
          color: '#8b5cf6',
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

    async applyStockChanges(previousItems: OrderItem[], nextItems: OrderItem[]) {
      const productStore = useProductStore()

      if (!productStore.items.length)
        await productStore.fetchProducts()

      const previousQuantities = summarizeItemQuantities(previousItems)
      const nextQuantities = summarizeItemQuantities(nextItems)

      const productIds = new Set([
        ...Object.keys(previousQuantities).map(Number),
        ...Object.keys(nextQuantities).map(Number),
      ])

      const updatedProducts = productStore.items.map(product => {
        if (!productIds.has(product.id))
          return product

        const previousQuantity = previousQuantities[product.id] ?? 0
        const nextQuantity = nextQuantities[product.id] ?? 0
        const nextStock = product.stock + previousQuantity - nextQuantity

        if (nextStock < 0)
          throw new Error(`Insufficient stock for ${product.name}`)

        return {
          ...product,
          stock: nextStock,
        }
      })

      productStore.items = updatedProducts

      if (productStore.currentProduct)
        productStore.currentProduct = updatedProducts.find(product => product.id === productStore.currentProduct?.id) ?? null

      productStore.syncStorage()
    },

    async fetchOrders() {
      this.listLoading = true
      this.listError = ''

      try {
        this.items = loadCollection<OrderRecord>(STORAGE_KEY)
      }
      catch (error) {
        this.listError = getErrorMessage(error, 'Failed to load orders')
        this.items = []
      }
      finally {
        this.listLoading = false
      }
    },

    async fetchOrderById(id: string | number) {
      this.detailLoading = true
      this.detailError = ''

      try {
        const resolvedId = Number(id)

        if (!this.items.length)
          this.items = loadCollection<OrderRecord>(STORAGE_KEY)

        this.currentOrder = this.items.find(item => item.id === resolvedId) ?? null

        if (!this.currentOrder)
          throw new Error('Order not found')

        return this.currentOrder
      }
      catch (error) {
        this.detailError = getErrorMessage(error, 'Failed to load order')
        this.currentOrder = null

        return null
      }
      finally {
        this.detailLoading = false
      }
    },

    async createOrder(payload: OrderPayload) {
      this.submitting = true
      this.mutationError = ''

      try {
        const id = getNextId(this.items)

        const normalizedItems = payload.items.map((item, index) => ({
          ...item,
          id: index + 1,
        }))

        await this.applyStockChanges([], normalizedItems)

        const createdOrder: OrderRecord = {
          id,
          table_id: payload.table_id,
          table_name: payload.table_name,
          status: payload.status,
          notes: payload.notes,
          subtotal: payload.subtotal,
          tax_amount: payload.tax_amount,
          service_charge: payload.service_charge,
          total: payload.total,
          invoice_number: createInvoiceNumber(id),
          items: normalizedItems,
          created_at: new Date().toISOString(),
        }

        this.items = [createdOrder, ...this.items]
        this.syncStorage()

        return createdOrder
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to create order')

        return null
      }
      finally {
        this.submitting = false
      }
    },

    async updateOrder(id: string | number, payload: OrderPayload) {
      this.submitting = true
      this.mutationError = ''

      try {
        const resolvedId = Number(id)
        const currentOrder = this.items.find(item => item.id === resolvedId)

        if (!currentOrder)
          throw new Error('Order not found')

        const normalizedItems = payload.items.map((item, index) => ({
          ...item,
          id: index + 1,
        }))

        await this.applyStockChanges(currentOrder.items, normalizedItems)

        const updatedOrder: OrderRecord = {
          ...currentOrder,
          table_id: payload.table_id,
          table_name: payload.table_name,
          status: payload.status,
          notes: payload.notes,
          subtotal: payload.subtotal,
          tax_amount: payload.tax_amount,
          service_charge: payload.service_charge,
          total: payload.total,
          items: normalizedItems,
        }

        this.currentOrder = updatedOrder
        this.items = this.items.map(item => item.id === updatedOrder.id ? updatedOrder : item)
        this.syncStorage()

        return updatedOrder
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to update order')

        return null
      }
      finally {
        this.submitting = false
      }
    },

    async updateOrderStatus(id: string | number, status: string) {
      this.submitting = true
      this.mutationError = ''

      try {
        const resolvedId = Number(id)
        const currentOrder = this.items.find(item => item.id === resolvedId)

        if (!currentOrder)
          throw new Error('Order not found')

        const updatedOrder: OrderRecord = {
          ...currentOrder,
          status,
        }

        this.currentOrder = updatedOrder
        this.items = this.items.map(item => item.id === updatedOrder.id ? updatedOrder : item)
        this.syncStorage()

        return updatedOrder
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to update order')

        return null
      }
      finally {
        this.submitting = false
      }
    },

    async deleteOrder(id: number) {
      this.deleting = true
      this.mutationError = ''

      try {
        const currentOrder = this.items.find(item => item.id === id)

        if (!currentOrder)
          throw new Error('Order not found')

        await this.applyStockChanges(currentOrder.items, [])
        this.items = this.items.filter(item => item.id !== id)
        this.syncStorage()

        return true
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to delete order')

        return false
      }
      finally {
        this.deleting = false
      }
    },

    formatCurrency,
    formatCreatedAt(value: string) {
      return formatDate(value)
    },
  },
})
