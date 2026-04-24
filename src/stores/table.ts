import { defineStore } from 'pinia'

export interface TableApiItem {
  id: number
  name: string
  code: string
  is_active: boolean
  qr_url: string
  created_at: string
}

interface TablePayload {
  name: string
}

const STORAGE_KEY = 'mobile-order-smart.tables'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function buildQrPlaceholder(code: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="12" fill="#ffffff"/>
      <rect x="10" y="10" width="100" height="100" rx="10" fill="#111827"/>
      <rect x="22" y="22" width="24" height="24" fill="#ffffff"/>
      <rect x="74" y="22" width="24" height="24" fill="#ffffff"/>
      <rect x="22" y="74" width="24" height="24" fill="#ffffff"/>
      <rect x="56" y="56" width="10" height="10" fill="#ffffff"/>
      <rect x="72" y="56" width="10" height="10" fill="#ffffff"/>
      <rect x="56" y="72" width="26" height="10" fill="#ffffff"/>
      <text x="60" y="112" font-size="12" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">${code}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime()))
    return value

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function createTableCode(name: string, id: number) {
  const normalizedName = name
    .trim()
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]+/g, '')
    .slice(0, 6)

  const fallbackCode = `TB${String(id).padStart(3, '0')}`

  return normalizedName || fallbackCode
}

function getNextId(items: TableApiItem[]) {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
}

function getStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null
}

function loadTablesFromStorage() {
  const storage = getStorage()

  if (!storage)
    return [] as TableApiItem[]

  const raw = storage.getItem(STORAGE_KEY)

  if (!raw)
    return []

  try {
    const parsed = JSON.parse(raw) as unknown

    return Array.isArray(parsed) ? parsed as TableApiItem[] : []
  }
  catch {
    return []
  }
}

function saveTablesToStorage(items: TableApiItem[]) {
  const storage = getStorage()

  if (storage)
    storage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const useTableStore = defineStore('tables', {
  state: () => ({
    items: [] as TableApiItem[],
    currentTable: null as TableApiItem | null,
    listLoading: false,
    detailLoading: false,
    submitting: false,
    deleting: false,
    listError: '',
    detailError: '',
    mutationError: '',
  }),

  getters: {
    tableItems: state => state.items.map(table => ({
      id: table.id,
      name: table.name,
      code: table.code,
      status: table.is_active ? 'active' : 'inactive',
      qr_image_url: buildQrPlaceholder(table.code),
      qr_url: table.qr_url,
      created_at: formatDate(table.created_at),
    })),

    cards: state => {
      const totalTables = state.items.length
      const activeTables = state.items.filter(table => table.is_active).length
      const inactiveTables = state.items.filter(table => !table.is_active).length
      const newTables = state.items.filter(table => {
        const createdDate = new Date(table.created_at)
        const ageInMs = Date.now() - createdDate.getTime()

        return ageInMs <= 7 * 24 * 60 * 60 * 1000
      }).length

      return [
        {
          title: 'Total Tables',
          value: totalTables,
          icon: 'mdi:table-furniture',
          color: '#3b82f6',
        },
        {
          title: 'Active Tables',
          value: activeTables,
          icon: 'mdi:check-circle',
          color: '#22c55e',
        },
        {
          title: 'Inactive Tables',
          value: inactiveTables,
          icon: 'mdi:close-circle',
          color: '#ef4444',
        },
        {
          title: 'New Tables',
          value: newTables,
          icon: 'mdi:new-box',
          color: '#f59e0b',
        },
      ]
    },
  },

  actions: {
    syncStorage() {
      saveTablesToStorage(this.items)
    },

    clearMutationError() {
      this.mutationError = ''
    },

    async fetchTables() {
      this.listLoading = true
      this.listError = ''

      try {
        this.items = loadTablesFromStorage()
      }
      catch (error) {
        this.listError = getErrorMessage(error, 'Failed to load tables')
        this.items = []
      }
      finally {
        this.listLoading = false
      }
    },

    async fetchTableById(id: string | number) {
      this.detailLoading = true
      this.detailError = ''

      try {
        const resolvedId = Number(id)

        if (!this.items.length)
          this.items = loadTablesFromStorage()

        this.currentTable = this.items.find(item => item.id === resolvedId) ?? null

        if (!this.currentTable)
          throw new Error('Table not found')

        return this.currentTable
      }
      catch (error) {
        this.detailError = getErrorMessage(error, 'Failed to load table')
        this.currentTable = null

        return null
      }
      finally {
        this.detailLoading = false
      }
    },

    async createTable(payload: TablePayload) {
      this.submitting = true
      this.mutationError = ''

      try {
        const id = getNextId(this.items)
        const createdTable: TableApiItem = {
          id,
          name: payload.name.trim(),
          code: createTableCode(payload.name, id),
          is_active: true,
          qr_url: `table://${id}`,
          created_at: new Date().toISOString(),
        }

        this.items = [createdTable, ...this.items]
        this.syncStorage()

        return createdTable
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to create table')

        return null
      }
      finally {
        this.submitting = false
      }
    },

    async updateTable(id: string | number, payload: TablePayload) {
      this.submitting = true
      this.mutationError = ''

      try {
        const resolvedId = Number(id)
        const currentTable = this.items.find(item => item.id === resolvedId)

        if (!currentTable)
          throw new Error('Table not found')

        const updatedTable: TableApiItem = {
          ...currentTable,
          name: payload.name.trim(),
        }

        this.currentTable = updatedTable
        this.items = this.items.map(item => item.id === updatedTable.id ? updatedTable : item)
        this.syncStorage()

        return updatedTable
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to update table')

        return null
      }
      finally {
        this.submitting = false
      }
    },

    async deleteTable(id: number) {
      this.deleting = true
      this.mutationError = ''

      try {
        this.items = this.items.filter(item => item.id !== id)
        this.syncStorage()

        return true
      }
      catch (error) {
        this.mutationError = getErrorMessage(error, 'Failed to delete table')

        return false
      }
      finally {
        this.deleting = false
      }
    },
  },
})
