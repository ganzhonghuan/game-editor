<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const selectedMenu = ref(route.name?.toString() || 'level-config');

// 获取应该显示在菜单中的路由
const menuRoutes = computed(() => {
  return router.getRoutes().filter(route => 
    route.meta.showInMenu === true
  );
});

// 菜单项标题映射
function getMenuTitle(routeName: string | symbol | null | undefined) {
  if (typeof routeName !== 'string') return '';
  
  const titleMap: Record<string, string> = {
    'level-config': '关卡配置',
    'level-grid': '关卡格子配置',
    'model-config': '模型配置',
    'model-group': '模型编组'
  };
  return titleMap[routeName] || routeName;
}

function onMenuSelect({ key }: { key: string }) {
  selectedMenu.value = key;
  router.push({ name: key });
}
</script>

<template>
  <div class="sidebar-container">
    <a-layout-sider width="200" theme="light" class="fixed-sidebar">
      <div class="logo">关卡编辑器</div>
      <a-menu mode="inline" :selectedKeys="[selectedMenu]" @select="onMenuSelect">
        <a-menu-item v-for="route in menuRoutes" :key="route.name">
          {{ getMenuTitle(route.name) }}
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
  </div>
</template>

<style scoped>
.sidebar-container {
  width: 200px;
  height: 100%;
  position: relative;
}

.fixed-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;
  width: 200px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.logo {
  height: 64px;
  margin: 16px;
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  color: #2F27CE;
  letter-spacing: 2px;
}
</style> 