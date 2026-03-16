<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    default: 'Dessert List',
  },
  subtitle: {
    type: String,
    default: 'Manage all desserts in the system',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...',
  },
  createLabel: {
    type: String,
    default: 'Create',
  },
  createRoute: {
    type: String,
    default: '/form-layouts',
  },
  itemKey: {
    type: String,
    default: 'name',
  },
  items: {
    type: [Array, Object],
    default: () => [],
  },
  headers: {
    type: Array,
    default: () => [],
  },
  showCreateButton: {
    type: Boolean,
    default: true,
  },
  showActions: {
    type: Boolean,
    default: true,
  },
  showViewAction: {
    type: Boolean,
    default: true,
  },
  showEditAction: {
    type: Boolean,
    default: true,
  },
  showDeleteAction: {
    type: Boolean,
    default: true,
  },
  disableViewAction: {
    type: Boolean,
    default: false,
  },
  disableEditAction: {
    type: Boolean,
    default: false,
  },
  disableDeleteAction: {
    type: Boolean,
    default: false,
  },
  enablePagination: {
    type: Boolean,
    default: true,
  },
  itemsPerPage: {
    type: Number,
    default: 5,
  },
})

const emit = defineEmits(['create', 'view', 'edit', 'delete'])

const router = useRouter()

const search = ref('')
const currentPage = ref(1)

function extractItemsFromHeaders(headers) {
  const row = headers.reduce((result, header) => {
    Object.entries(header).forEach(([key, value]) => {
      if (!['title', 'key'].includes(key))
        result[key] = value
    })

    return result
  }, {})

  return Object.keys(row).length > 0 ? [row] : []
}

const normalizedItems = computed(() => {
  if (Array.isArray(props.items))
    return props.items

  return props.items ? [props.items] : []
})

const displayItems = computed(() => {
  if (normalizedItems.value.length > 0)
    return normalizedItems.value

  return extractItemsFromHeaders(props.headers)
})

const resolvedHeaders = computed(() => {
  if (props.headers.length > 0)
    return props.headers

  const firstItem = displayItems.value[0]

  if (!firstItem)
    return []

  return Object.keys(firstItem).map(key => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    key,
  }))
})

const filteredItems = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  if (!keyword)
    return displayItems.value

  return displayItems.value.filter(item =>
    resolvedHeaders.value.some(header =>
      String(item[header.key] ?? '')
        .toLowerCase()
        .includes(keyword),
    ),
  )
})

const totalPages = computed(() => {
  if (!props.enablePagination)
    return 1

  return Math.max(1, Math.ceil(filteredItems.value.length / props.itemsPerPage))
})

const paginatedItems = computed(() => {
  if (!props.enablePagination)
    return filteredItems.value

  const start = (currentPage.value - 1) * props.itemsPerPage

  return filteredItems.value.slice(start, start + props.itemsPerPage)
})

const paginationMeta = computed(() => {
  if (filteredItems.value.length === 0)
    return '0-0 of 0'

  if (!props.enablePagination)
    return `1-${filteredItems.value.length} of ${filteredItems.value.length}`

  const start = (currentPage.value - 1) * props.itemsPerPage + 1
  const end = Math.min(currentPage.value * props.itemsPerPage, filteredItems.value.length)

  return `${start}-${end} of ${filteredItems.value.length}`
})

watch(search, () => {
  currentPage.value = 1
})

watch(totalPages, value => {
  if (currentPage.value > value)
    currentPage.value = value
})

function goToCreate() {
  emit('create')

  if (props.createRoute)
    router.push(props.createRoute)
}

function editItem(item) {
  emit('edit', item)
}

function deleteItem(item) {
  emit('delete', item)
}

function viewItem(item) {
  emit('view', item)
}

function getItemKey(item, index) {
  return item[props.itemKey] ?? index
}

function isImageColumn(header) {
  return header.type === 'image'
}

function isStatusColumn(header) {
  return header.type === 'status'
}

function getStatusClass(value) {
  const normalizedValue = String(value ?? '').toLowerCase()

  if (normalizedValue === 'pending')
    return 'status-badge status-pending'

  if (normalizedValue === 'confirmed')
    return 'status-badge status-confirmed'

  if (normalizedValue === 'preparing')
    return 'status-badge status-preparing'

  if (normalizedValue === 'served')
    return 'status-badge status-served'

  if (normalizedValue === 'paid')
    return 'status-badge status-paid'

  if (normalizedValue === 'active')
    return 'status-badge status-active'

  if (normalizedValue === 'inactive')
    return 'status-badge status-inactive'

  if (normalizedValue === 'completed')
    return 'status-badge status-completed'

  if (normalizedValue === 'cancelled')
    return 'status-badge status-cancelled'

  return 'status-badge status-default'
}

function getImageAlt(item, header) {
  return item.name || header.title
}
</script>

<template>
  <div class="table-card">
    <!-- Header -->
    <div class="table-header">
      <div>
        <h2
          v-if="title"
          class="title"
        >
          {{ title }}
        </h2>
        <p
          v-if="subtitle"
          class="subtitle"
        >
          {{ subtitle }}
        </p>
      </div>

      <div class="header-actions">
        <VTextField
          v-model="search"
          :placeholder="searchPlaceholder"
          density="compact"
          variant="outlined"
          prepend-inner-icon="bx-search"
          hide-details
          class="search-input"
        />

        <VBtn
          v-if="showCreateButton"
          color="primary"
          class="create-btn"
          height="30"
          @click="goToCreate"
        >
          {{ createLabel }}
        </VBtn>
      </div>
    </div>

    <!-- Table -->
    <VTable
      class="custom-table"
      striped="even"
    >
      <thead>
        <tr>
          <th
            v-for="header in resolvedHeaders"
            :key="header.key"
          >
            {{ header.title }}
          </th>

          <th
            v-if="showActions"
            class="text-center"
          >
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(item, index) in paginatedItems"
          :key="getItemKey(item, index)"
        >
          <td
            v-for="header in resolvedHeaders"
            :key="header.key"
            :class="{ name: header.key === resolvedHeaders[0]?.key }"
          >
            <img
              v-if="isImageColumn(header) && item[header.key]"
              :src="item[header.key]"
              :alt="getImageAlt(item, header)"
              class="table-image"
            >
            <span
              v-else-if="isStatusColumn(header)"
              :class="getStatusClass(item[header.key])"
            >
              {{ item[header.key] }}
            </span>
            <span v-else>
              {{ item[header.key] }}
            </span>
          </td>

          <td
            v-if="showActions"
            class="text-center action-buttons"
          >
            <VBtn
              v-if="showViewAction"
              icon="bx-show"
              size="small"
              variant="text"
              color="info"
              :disabled="disableViewAction"
              @click="viewItem(item)"
            />

            <VBtn
              v-if="showEditAction"
              icon="bx-edit"
              size="small"
              variant="text"
              color="primary"
              :disabled="disableEditAction"
              @click="editItem(item)"
            />

            <VBtn
              v-if="showDeleteAction"
              icon="bx-trash"
              size="small"
              variant="text"
              color="error"
              :disabled="disableDeleteAction"
              @click="deleteItem(item)"
            />
          </td>
        </tr>

        <tr v-if="paginatedItems.length === 0">
          <td
            :colspan="resolvedHeaders.length + (showActions ? 1 : 0)"
            class="empty-state text-center"
          >
            No data found
          </td>
        </tr>
      </tbody>
    </VTable>

    <div
      v-if="enablePagination && filteredItems.length > 0"
      class="pagination-wrap"
    >
      <span class="pagination-meta">{{ paginationMeta }}</span>

      <VPagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="1"
        density="comfortable"
        show-arrows
      />
    </div>
  </div>
</template>

<style scoped>
.table-card {
  padding: 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 6%);
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 18px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  color: #777;
  font-size: 13px;
  margin-block-start: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  inline-size: 220px;
}

.custom-table {
  overflow: hidden;
  border-radius: 10px;
}

.custom-table thead {
  background: #f8fafc;
}

.custom-table th {
  padding: 14px;
  font-weight: 600;
}

.custom-table td {
  padding: 14px;
}

.table-image {
  display: block;
  border-radius: 8px;
  block-size: 48px;
  inline-size: 48px;
  object-fit: cover;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding-block: 7px;
  padding-inline: 12px;
  text-transform: capitalize;
}

.status-pending {
  border-color: #f59e0b;
  background: #fffbeb;
  color: #b45309;
}

.status-completed {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #15803d;
}

.status-confirmed {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
}

.status-preparing {
  border-color: #f97316;
  background: #fff7ed;
  color: #c2410c;
}

.status-served {
  border-color: #14b8a6;
  background: #f0fdfa;
  color: #0f766e;
}

.status-paid {
  border-color: #16a34a;
  background: #f0fdf4;
  color: #166534;
}

.status-active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #15803d;
}

.status-inactive {
  border-color: #64748b;
  background: #f8fafc;
  color: #475569;
}

.status-cancelled {
  border-color: #ef4444;
  background: #fef2f2;
  color: #b91c1c;
}

.status-default {
  border-color: #94a3b8;
  background: #f8fafc;
  color: #475569;
}

.empty-state {
  color: #777;
}

.custom-table tbody tr:hover {
  background: #f5f7fb;
  transition: 0.2s;
}

.name {
  font-weight: 500;
}

.action-buttons v-btn {
  margin-block: 0;
  margin-inline: 2px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-block-start: 16px;
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-block-start: 18px;
}

.pagination-meta {
  color: #64748b;
  font-size: 13px;
}
</style>
