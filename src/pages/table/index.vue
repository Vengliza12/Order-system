<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTableStore } from '@/stores'
import Tables from '@/components/TableStatic.vue'

interface DeleteTarget {
  id: number
  name: string
}

const router = useRouter()
const tableStore = useTableStore()

const {
  cards,
  deleting,
  listError,
  listLoading,
  mutationError,
  tableItems,
} = storeToRefs(tableStore)

const headers = [
  { title: '#', key: 'id' },
  { title: 'QR Code', key: 'qr_image_url', type: 'image' },
  { title: 'Name', key: 'name' },
  { title: 'Code', key: 'code' },

  // { title: 'Status', key: 'status', type: 'status' },

  // { title: 'Created At', key: 'created_at' },
]

const deleteDialog = ref(false)
const deleteTarget = ref<DeleteTarget | null>(null)

function handleView(item: { id: number }) {
  router.push(`/table/view/${item.id}`)
}

function handleEdit(item: { id: number }) {
  router.push(`/table/edit/${item.id}`)
}

function handleDelete(item: DeleteTarget) {
  deleteTarget.value = item
  deleteDialog.value = true
}

function cancelDelete() {
  deleteDialog.value = false
  deleteTarget.value = null
}

async function confirmDelete() {
  if (!deleteTarget.value)
    return

  const deleted = await tableStore.deleteTable(deleteTarget.value.id)

  deleteDialog.value = false

  if (deleted)
    deleteTarget.value = null
}

onMounted(() => {
  tableStore.fetchTables()
})
</script>

<template>
  <div>
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

    <p
      v-if="listLoading"
      class="status-text"
    >
      Loading tables...
    </p>

    <p
      v-else-if="listError || mutationError"
      class="status-text error-text"
    >
      {{ listError || mutationError }}
    </p>

    <Tables
      title="Table List"
      subtitle="Manage and view all table headers"
      :headers="headers"
      :items="tableItems"
      :search-keys="['id', 'name', 'code']"
      item-key="id"
      create-route="/table/create"
      disable-view-action
      disable-edit-action
      enable-pagination
      :items-per-page="5"
      @view="handleView"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <Teleport to="body">
      <Transition name="dialog">
        <div
          v-if="deleteDialog"
          class="dialog-overlay"
          @click.self="cancelDelete"
        >
          <div class="dialog-box">
            <div class="dialog-icon-wrap">
              <div class="dialog-icon">
                <Icon icon="mdi:trash-can-outline" />
              </div>
            </div>

            <h2 class="dialog-title">
              Delete Table
            </h2>

            <p class="dialog-message">
              Are you sure you want to delete
              <span class="dialog-name">"{{ deleteTarget?.name }}"</span>?
              This action cannot be undone.
            </p>

            <div class="dialog-actions">
              <button
                class="btn-cancel"
                :disabled="deleting"
                @click="cancelDelete"
              >
                Cancel
              </button>
              <button
                class="btn-delete"
                :disabled="deleting"
                @click="confirmDelete"
              >
                <Icon
                  v-if="deleting"
                  icon="mdi:loading"
                  class="spin"
                />
                <span>{{ deleting ? 'Deleting...' : 'Delete' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
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

.status-text {
  color: #555;
  margin-block: 0 16px;
}

.error-text {
  color: #ef4444;
}

.dialog-overlay {
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 40%);
  inset: 0;
}

.dialog-box {
  border-radius: 20px;
  background: white;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 18%);
  inline-size: 100%;
  max-inline-size: 400px;
  padding-block: 36px 28px;
  padding-inline: 32px;
  text-align: center;
}

.dialog-icon-wrap {
  display: flex;
  justify-content: center;
  margin-block-end: 18px;
}

.dialog-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fef2f2;
  block-size: 64px;
  color: #ef4444;
  font-size: 32px;
  inline-size: 64px;
}

.dialog-title {
  color: #111827;
  font-size: 20px;
  font-weight: 700;
  margin-block: 0 10px;
  margin-inline: 0;
}

.dialog-message {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
  margin-block: 0 28px;
  margin-inline: 0;
}

.dialog-name {
  color: #374151;
  font-weight: 600;
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-delete {
  flex: 1;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding-block: 10px;
  padding-inline: 16px;
  transition: all 0.15s ease;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: white;
  gap: 6px;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.btn-cancel:disabled,
.btn-delete:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .dialog-box,
.dialog-leave-active .dialog-box {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-box,
.dialog-leave-to .dialog-box {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
  font-size: 20px;
}
</style>
