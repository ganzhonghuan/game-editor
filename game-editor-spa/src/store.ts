import { createStore } from 'vuex';

export interface RootState {
  // 这里可以根据实际需要定义全局状态
}

const store = createStore<RootState>({
  state: {},
  mutations: {},
  actions: {},
  modules: {}
});

export default store; 