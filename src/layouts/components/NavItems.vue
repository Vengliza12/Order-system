<script lang="ts" setup>
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'
</script>

<template>
  <VerticalNavLink
    :item="{
      title: 'Dashboard',
      to: '/dashboard',
      icon: 'bx-grid-alt',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Tables',
      icon: 'bx-table',
      to: '/table',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Categories',
      icon: 'bx-category',
      to: '/categories',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Product Listing',
      icon: 'bx-box',
      to: '/product',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Orders',
      icon: 'bx-cart-alt',
      to: '/orders',
    }"
  />
</template>
