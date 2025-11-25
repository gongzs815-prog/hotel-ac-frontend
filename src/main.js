// ==================== Vue 核心 ====================
import { createApp } from 'vue';
import App from './App.vue';

// ==================== 样式 ====================
import './style.css'; // Tailwind CSS

// ==================== Pinia 状态管理 ====================
import { createPinia } from 'pinia';

// ==================== Vue Router 路由 ====================
import router from './router';

// ==================== 创建应用实例 ====================
const app = createApp(App);

// ==================== 安装插件（顺序很重要）====================
// 1. 先安装 Pinia
app.use(createPinia());

// 2. 再安装 Router
app.use(router);

// ==================== 挂载应用 ====================
app.mount('#app');

// ==================== 调试信息（开发环境）====================
if (import.meta.env.DEV) {
  console.log('🚀 酒店空调管理系统前端已启动');
  console.log('📍 API 地址:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api');
  console.log('🔌 WebSocket 地址:', import.meta.env.VITE_WS_URL || 'http://localhost:3000');
}
