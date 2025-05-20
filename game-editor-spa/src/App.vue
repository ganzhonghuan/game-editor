<script lang="ts" setup>
import SidebarMenu from './components/SidebarMenu.vue';
</script>

<template>
  <a-layout style="min-height: 100vh">
    <SidebarMenu />
    <a-layout style="margin-left: 24px;">
      <a-layout-content style="margin: 24px 24px 24px 0; background:#fff; min-height: 360px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
</style>
