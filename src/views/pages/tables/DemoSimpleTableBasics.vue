<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const search = ref('')

const desserts = ref([
  { name: 'Frozen Yogurt', calories: 159 },
  { name: 'Ice cream sandwich', calories: 237 },
  { name: 'Eclair', calories: 262 },
  { name: 'Cupcake', calories: 305 },
  { name: 'Gingerbread', calories: 356 },
  { name: 'Jelly bean', calories: 375 },
  { name: 'Lollipop', calories: 392 },
  { name: 'Honeycomb', calories: 408 },
  { name: 'Donut', calories: 452 },
  { name: 'KitKat', calories: 518 },
])

const filteredDesserts = computed(() => {
  return desserts.value.filter(d =>
    d.name.toLowerCase().includes(search.value.toLowerCase())
  )
})

function goToCreate(){
  router.push('/form-layouts')
}

function editItem(item){
  console.log('Edit', item)
}

function deleteItem(item){
  console.log('Delete', item)
}

function viewItem(item){
  console.log('View', item)
}
</script>

<template>
  <div class="table-card">

    <!-- Header -->
    <div class="table-header">
      <div>
        <h2 class="title">Dessert List</h2>
        <p class="subtitle">Manage all desserts in the system</p>
      </div>

      <div class="header-actions">
        <v-text-field
          v-model="search"
          placeholder="Search..."
          density="compact"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          hide-details
          class="search-input"
        />

       <v-btn
  color="primary"
  class="create-btn"
  height="30"
  @click="goToCreate"
>
  Create
</v-btn>
      </div>
    </div>

    <!-- Table -->
    <v-table class="custom-table" striped="even">
      <thead>
        <tr>
          <th>Name</th>
          <th>Calories</th>
          <th class="text-center">Actions</th>
        </tr>
      </thead>

     <tbody>
  <tr
    v-for="item in filteredDesserts"
    :key="item.name"
  >
    <td class="name">{{ item.name }}</td>
    <td>{{ item.calories }}</td>

<td class="text-center action-buttons">

  <!-- View -->
  <v-btn
    icon="mdi:eye"
    size="small"
    variant="text"
    color="info"
    @click="viewItem(item)"
  />

  <!-- Edit -->
  <v-btn
    icon="mdi:pencil"
    size="small"
    variant="text"
    color="primary"
    @click="editItem(item)"
  />

  <!-- Delete -->
  <v-btn
    icon="mdi:delete"
    size="small"
    variant="text"
    color="error"
    @click="deleteItem(item)"
  />

</td>
  </tr>
</tbody>
    </v-table>

  </div>
</template>

<style scoped>

.table-card{
  background:white;
  border-radius:12px;
  padding:20px;
  box-shadow:0 4px 16px rgba(0,0,0,0.06);
}

.table-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:18px;
}

.title{
  font-size:20px;
  font-weight:600;
  margin:0;
}

.subtitle{
  font-size:13px;
  color:#777;
  margin-top:4px;
}

.header-actions{
  display:flex;
  gap:12px;
  align-items:center;
}

.search-input{
  width:220px;
}

.custom-table{
  border-radius:10px;
  overflow:hidden;
}

.custom-table thead{
  background:#f8fafc;
}

.custom-table th{
  font-weight:600;
  padding:14px;
}

.custom-table td{
  padding:14px;
}

.custom-table tbody tr:hover{
  background:#f5f7fb;
  transition:0.2s;
}

.name{
  font-weight:500;
}

.action-buttons v-btn{
  margin:0 2px;
}

</style>  
