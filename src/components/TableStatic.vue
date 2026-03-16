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
})

const emit = defineEmits(['create', 'view', 'edit', 'delete'])

const router = useRouter()

const search = ref('')
const page = ref(1)
const itemsPerPage = 10

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

watch(search, () => {
  page.value = 1
})

const pageCount = computed(() => {
  return Math.ceil(filteredItems.value.length / itemsPerPage)
})

const paginatedItems = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredItems.value.slice(start, end)
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

function getImageAlt(item, header) {
  return item.name || header.title
}
</script>

<template>
  <div class="table-card">
    <!-- Header -->
    <div class="table-header">
      <div>
        <h2 v-if="title" class="title">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="subtitle">
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
    <VTable class="custom-table" striped="even">
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

            <span v-else>
              {{ item[header.key] }}
            </span>
          </td>

          <td
            v-if="showActions"
            class="text-center action-buttons"
          >
            <VBtn
              icon="bx-show"
              size="small"
              variant="text"
              color="info"
              @click="viewItem(item)"
            />

            <VBtn
              icon="bx-edit"
              size="small"
              variant="text"
              color="primary"
              @click="editItem(item)"
            />

            <VBtn
              icon="bx-trash"
              size="small"
              variant="text"
              color="error"
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

    <!-- Pagination -->
    <div class="pagination-wrapper">
      <VPagination
        v-model="page"
        :length="pageCount"
        :total-visible="5"
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
  margin-bottom: 18px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  color: #777;
  font-size: 13px;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 220px;
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
  width: 48px;
  height: 48px;
  object-fit: cover;
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
  margin: 0 2px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
