<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const selectedMenu = ref(route.name || 'level-config');

function onMenuSelect({ key }: { key: string }) {
  selectedMenu.value = key;
  switch (key) {
    case 'level-config':
      router.push({ name: 'level-config' });
      break;
    case 'level-grid':
      router.push({ name: 'level-grid' });
      break;
    case 'model-config':
      router.push({ name: 'model-config' });
      break;
    case 'model-group':
      router.push({ name: 'model-group' });
      break;
  }
}
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider width="220" theme="light">
      <div class="logo" style="height: 64px; margin: 16px; font-size: 22px; font-weight: bold; text-align: center;">关卡编辑器</div>
      <a-menu mode="inline" :selectedKeys="[selectedMenu]" @select="onMenuSelect">
        <a-menu-item key="level-config">关卡配置</a-menu-item>
        <a-menu-item key="level-grid">关卡格子配置</a-menu-item>
        <a-menu-item key="model-config">模型配置</a-menu-item>
        <a-menu-item key="model-group">模型编组</a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-content style="margin:24px; background:#fff; min-height: 360px; border-radius: 8px;">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.logo {
  color: #2F27CE;
  letter-spacing: 2px;
}
</style>
