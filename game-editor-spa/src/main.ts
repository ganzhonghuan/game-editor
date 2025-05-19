import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import store from './store'
import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes'

const app = createApp(App)
app.use(Antd)
app.use(store)
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
app.use(router)
app.mount('#app')
