<script setup lang="ts">
import { Icon } from '@iconify/vue';
import Tables from './tables.vue';

// Optional: import specific icons for tree-shaking
const cards = [
  {
    title: 'Total Products',
    value: 120,
    icon: 'mdi:package-variant',
    color: '#3b82f6'
  },
  {
    title: 'Available Products',
    value: 95,
    icon: 'mdi:check-circle',
    color: '#22c55e'
  },
  {
    title: 'Out of Stock',
    value: 15,
    icon: 'mdi:close-circle',
    color: '#ef4444'
  },
  {
    title: 'New Products',
    value: 10,
    icon: 'mdi:new-box',
    color: '#f59e0b'
  }
]
</script>

<template>
  <div>

    <!-- Product Cards -->
    <div class="card-container">
      <div v-for="(card, index) in cards" :key="index" class="card">
        <div class="card-header">
          <Icon :icon="card.icon" class="icon" :style="{ color: card.color }" />
          <span>{{ card.title }}</span>
        </div>

        <div class="card-value">
          {{ card.value }}
        </div>
      </div>
    </div>

    <!-- Section Title -->
    <div class="table-title">
      <h2>Product List</h2>
      <p>Manage and view all products in the system</p>
    </div>
    <!-- Table -->
    <Tables />
  </div>
</template>

<style scoped>

.card-container{
  display:grid;
  grid-template-columns: repeat(4,1fr);
  gap:20px;
  margin-bottom:20px;
}

.card{
  background:white;
  padding:20px;
  border-radius:12px;
  box-shadow:0 2px 9px rgba(0,0,0,0.08);
}

.card-header{
  display:flex;
  align-items:center;
  gap:10px;
  font-size:14px;
  color:#555;
}

.icon{
  font-size:28px;
}

.card-value{
  margin-top:10px;
  font-size:26px;
  font-weight:bold;
}
.table-title{
  margin: 25px 0 15px 0;
  border-left: 4px solid #3b82f6;
  padding-left: 12px;
}

.table-title h2{
  font-size: 20px;
  margin: 0;
  font-weight: 600;
}

.table-title p{
  font-size: 13px;
  color: #777;
  margin-top: 3px;
}

</style>
