import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: 'level-config' },
  },
  {
    path: '/level-config',
    name: 'level-config',
    component: () => import('./pages/LevelConfig.vue'),
  },
  {
    path: '/level-grid',
    name: 'level-grid',
    component: () => import('./pages/LevelGridConfig.vue'),
  },
  {
    path: '/model-config',
    name: 'model-config',
    component: () => import('./pages/ModelConfig.vue'),
  },
  {
    path: '/model-group',
    name: 'model-group',
    component: () => import('./pages/ModelGroup.vue'),
  },
];

export default routes; 