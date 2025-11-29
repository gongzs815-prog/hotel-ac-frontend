import { createRouter, createWebHistory } from 'vue-router';
import RoomACPanel from '../components/roomACPanel.vue';

// ==================== 路由配置 ====================

const routes = [
  {
    // 默认路由：重定向到房间 301
    path: '/',
    redirect: '/room/301'
  },
  {
    // 房间空调控制面板路由（动态参数 :roomId）- 客户端
    path: '/room/:roomId',
    name: 'RoomACPanel',
    component: RoomACPanel,
    meta: {
      title: '房间空调控制'
    }
  },
  {
    // 管理员控制台路由
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../components/admin/AdminDashboard.vue'),
    meta: {
      title: '空调管理员控制台'
    }
  },
  {
    // 前台服务台路由
    path: '/reception',
    name: 'ReceptionDashboard',
    component: () => import('../components/reception/ReceptionDashBoard.vue'),
    meta: {
      title: '前台服务台'
    }
  },
  {
    // 酒店经理控制台路由
    path: '/manager',
    name: 'ManagerDashboard',
    component: () => import('../components/manager/ManagerDashBoard.vue'),
    meta: {
      title: '酒店经理控制台'
    }
  },
  {
    // 404 错误处理
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/room/301'
  }
];

// ==================== 创建路由实例 ====================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// ==================== 路由守卫 ====================

router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 酒店空调管理系统`;
  } else {
    document.title = '酒店空调管理系统';
  }

  // 验证房间号格式（仅对房间路由）
  if (to.name === 'RoomACPanel') {
    const roomId = to.params.roomId;
    if (!/^\d+$/.test(roomId)) {
      console.warn(`无效的房间号: ${roomId}，重定向到默认房间 301`);
      next('/room/301');
      return;
    }
  }

  next();
});

export default router;