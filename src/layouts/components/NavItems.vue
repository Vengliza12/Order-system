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
      title: 'Product Listing',
      icon: 'bx-layout',
      to: '/product',
    }"
  />
</template>
