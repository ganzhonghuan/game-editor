const routes = [
  {
    path: '/',
    redirect: { name: 'level-config' },
  },
  {
    path: '/level-config',
    name: 'level-config',
    component: () => import('./pages/LevelConfig.vue'),
    meta: {
      showInMenu: true
    }
  },
  {
    path: '/level-grid',
    name: 'level-grid',
    component: () => import('./pages/LevelGridConfig.vue'),
    meta: {
      showInMenu: false
    }
  },
  {
    path: '/model-config',
    name: 'model-config',
    component: () => import('./pages/ModelConfig.vue'),
    meta: {
      showInMenu: true
    }
  },
  {
    path: '/model-group',
    name: 'model-group',
    component: () => import('./pages/ModelGroup.vue'),
    meta: {
      showInMenu: true
    }
  },
];

export default routes; 