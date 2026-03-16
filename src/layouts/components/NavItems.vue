<script lang="ts" setup>
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue';
</script>

<template>
  <VerticalNavLink
    :item="{
      title: 'Dashboard',
      to: '/dashboard',
      icon: 'bx-home-smile',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Categories',
      icon: 'bx-layout',
      to: '/categories',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Product Listing',
      icon: 'bx-layout',
      to: '/product',
    }"
  />
    <VerticalNavLink
    :item="{
      title: 'Table',
      icon: 'bx-layout',
      to: '/table-qr',
    }"
  />
</template>
