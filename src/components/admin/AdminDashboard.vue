<template>
  <div class="min-h-screen bg-slate-900 text-slate-300 p-6">
    
    <!-- ==================== 顶部控制栏 ==================== -->
    <header class="mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- 标题 -->
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center">
            <svg class="w-8 h-8 mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            空调管理员控制台
          </h1>
          <p class="text-slate-500 text-sm mt-1">实时监控所有房间空调状态</p>
        </div>

        <!-- 中央空调控制 -->
        <div class="flex items-center gap-4 bg-slate-800 p-4 rounded-xl ring-1 ring-white/10">
          <!-- 状态指示 -->
          <div class="flex items-center gap-2">
            <div 
              :class="[
                'w-4 h-4 rounded-full',
                store.centralACStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'
              ]"
            ></div>
            <span class="font-medium">
              中央空调: {{ store.centralACStatus.isRunning ? '运行中' : '已关闭' }}
            </span>
          </div>

          <!-- 分隔线 -->
          <div class="w-px h-8 bg-slate-600"></div>

          <!-- 模式选择 -->
          <div class="flex items-center gap-2">
            <button
              @click="handleSetMode('Cooling')"
              :disabled="!store.centralACStatus.isRunning || isLoading"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition',
                store.centralACStatus.mode === 'Cooling' && store.centralACStatus.isRunning
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              ]"
            >
              ❄️ 制冷
            </button>
            <button
              @click="handleSetMode('Heating')"
              :disabled="!store.centralACStatus.isRunning || isLoading"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition',
                store.centralACStatus.mode === 'Heating' && store.centralACStatus.isRunning
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              ]"
            >
              🔥 制热
            </button>
          </div>

          <!-- 分隔线 -->
          <div class="w-px h-8 bg-slate-600"></div>

          <!-- 开关按钮 -->
          <button
            @click="handleToggleCentralAC"
            :disabled="isLoading"
            :class="[
              'px-4 py-2 rounded-lg font-semibold text-white transition',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              store.centralACStatus.isRunning
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            ]"
          >
            <span v-if="isLoading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              处理中...
            </span>
            <span v-else>
              {{ store.centralACStatus.isRunning ? '关闭系统' : '启动系统' }}
            </span>
          </button>
        </div>
      </div>

      <!-- WebSocket 连接状态 -->
      <div v-if="!store.isConnected" class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <span>实时连接断开，数据可能不是最新</span>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>
        <button @click="errorMessage = ''" class="text-red-400 hover:text-red-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </header>

    <!-- ==================== 统计卡片 ==================== -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-slate-800 p-4 rounded-xl ring-1 ring-white/10">
        <div class="text-slate-500 text-sm">总房间数</div>
        <div class="text-2xl font-bold text-white mt-1">{{ store.roomList.length }}</div>
      </div>
      <div class="bg-slate-800 p-4 rounded-xl ring-1 ring-white/10">
        <div class="text-slate-500 text-sm">已开机</div>
        <div class="text-2xl font-bold text-cyan-400 mt-1">{{ store.activeRoomCount }}</div>
      </div>
      <div class="bg-slate-800 p-4 rounded-xl ring-1 ring-white/10">
        <div class="text-slate-500 text-sm">服务中</div>
        <div class="text-2xl font-bold text-green-400 mt-1">{{ store.servingRoomCount }} / {{ store.centralACStatus.maxServing }}</div>
      </div>
      <div class="bg-slate-800 p-4 rounded-xl ring-1 ring-white/10">
        <div class="text-slate-500 text-sm">等待中</div>
        <div class="text-2xl font-bold text-yellow-400 mt-1">{{ store.waitingRoomCount }}</div>
      </div>
      <div class="bg-slate-800 p-4 rounded-xl ring-1 ring-white/10">
        <div class="text-slate-500 text-sm">总收入</div>
        <div class="text-2xl font-bold text-green-400 mt-1">¥{{ totalRevenue.toFixed(2) }}</div>
      </div>
    </div>

    <!-- ==================== 主内容区 ==================== -->
    <div class="flex flex-col lg:flex-row gap-6">
      
      <!-- 左侧：房间网格 -->
      <div class="flex-1">
        <div class="bg-slate-800 rounded-xl ring-1 ring-white/10 p-4">
          <!-- 标题和工具栏 -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 class="text-lg font-semibold text-white flex items-center">
              <svg class="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
              房间状态总览
              <span class="ml-2 text-sm font-normal text-slate-500">({{ filteredRooms.length }} / {{ store.roomList.length }})</span>
            </h2>

            <!-- 工具栏 -->
            <div class="flex items-center gap-2">
              <!-- 搜索框 -->
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索房间号..."
                  class="w-32 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <svg v-if="!searchQuery" class="absolute right-2 top-2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>

              <!-- 筛选下拉 -->
              <select
                v-model="filterStatus"
                class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">全部房间</option>
                <option value="powered-on">已开机</option>
                <option value="powered-off">已关闭</option>
                <option value="serving">服务中</option>
                <option value="waiting">等待中</option>
              </select>

              <!-- 刷新按钮 -->
              <button
                @click="handleRefresh"
                :disabled="isRefreshing"
                class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="刷新数据"
              >
                <svg :class="['w-4 h-4', isRefreshing && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span class="hidden sm:inline">刷新</span>
              </button>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="store.isLoading" class="flex items-center justify-center py-20">
            <svg class="animate-spin h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span class="ml-3 text-slate-400">加载中...</span>
          </div>

          <!-- 房间网格 -->
          <div v-else-if="filteredRooms.length > 0" class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            <div
              v-for="room in filteredRooms"
              :key="room.roomId"
              :class="[
                'p-2 rounded-lg text-center cursor-pointer transition-all hover:scale-105',
                'ring-1',
                getRoomCardClass(room)
              ]"
              :title="getRoomTooltip(room)"
            >
              <!-- 房间号 -->
              <div class="text-xs font-bold text-white">{{ room.roomId }}</div>
              
              <!-- 状态指示 -->
              <div class="flex justify-center my-1">
                <div :class="['w-2 h-2 rounded-full', getStatusDotClass(room)]"></div>
              </div>
              
              <!-- 温度 -->
              <div v-if="room.isPowerOn" class="text-xs text-slate-400">
                {{ room.currentTemp?.toFixed(1) || '--' }}°
              </div>
              <div v-else class="text-xs text-slate-600">
                --
              </div>
            </div>
          </div>

          <!-- 无结果提示 -->
          <div v-else class="flex flex-col items-center justify-center py-20 text-slate-500">
            <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-lg">没有找到匹配的房间</p>
            <p class="text-sm mt-2">尝试调整筛选条件或搜索关键词</p>
          </div>

          <!-- 图例 -->
          <div class="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              <span>服务中</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>等待中</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 rounded-full bg-slate-600"></div>
              <span>已关闭</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：队列面板 -->
      <div class="w-full lg:w-80 space-y-4">
        
        <!-- 服务队列 -->
        <div class="bg-slate-800 rounded-xl ring-1 ring-white/10 p-4">
          <h3 class="text-md font-semibold text-white mb-3 flex items-center justify-between">
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              服务队列
            </span>
            <span class="text-sm font-normal text-slate-500">
              {{ store.serviceQueue.length }} / {{ store.centralACStatus.maxServing }}
            </span>
          </h3>

          <div v-if="store.serviceQueue.length === 0" class="text-center py-6 text-slate-500 text-sm">
            暂无服务中的房间
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="item in store.serviceQueue"
              :key="item.roomId"
              class="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition"
            >
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span class="font-medium text-sm">{{ item.roomId }}</span>
              </div>
              <div class="text-right text-xs">
                <div class="text-slate-400">{{ getFanSpeedLabel(item.fanSpeed) }}</div>
                <div class="text-cyan-400">
                  {{ item.currentTemp?.toFixed(1) || '--' }}°C
                  <span class="text-slate-600">→</span>
                  {{ item.targetTemp?.toFixed(1) || '--' }}°C
                </div>
                <div v-if="item.startTime" class="text-slate-500 mt-0.5">
                  {{ formatServiceTime(item.startTime) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 等待队列 -->
        <div class="bg-slate-800 rounded-xl ring-1 ring-white/10 p-4">
          <h3 class="text-md font-semibold text-white mb-3 flex items-center justify-between">
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              等待队列
            </span>
            <span class="text-sm font-normal text-slate-500">
              {{ store.waitingQueue.length }}
            </span>
          </h3>

          <div v-if="store.waitingQueue.length === 0" class="text-center py-6 text-slate-500 text-sm">
            暂无等待中的房间
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in store.waitingQueue"
              :key="item.roomId"
              class="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition"
            >
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs flex items-center justify-center font-bold">
                  {{ index + 1 }}
                </div>
                <span class="font-medium text-sm">{{ item.roomId }}</span>
              </div>
              <div class="text-right text-xs">
                <div class="text-slate-400">{{ getFanSpeedLabel(item.fanSpeed) }}</div>
                <div class="text-yellow-400">预计 {{ item.waitTime || '--' }}s</div>
                <div v-if="item.requestTime" class="text-slate-500 mt-0.5">
                  {{ formatRequestTime(item.requestTime) }}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAdminStore } from '../../stores/adminStore.js';

// ==================== Store ====================
const store = useAdminStore();

// ==================== 响应式状态 ====================
const isLoading = ref(false);
const errorMessage = ref('');
const searchQuery = ref('');      // 搜索关键词
const filterStatus = ref('all');  // 筛选状态
const isRefreshing = ref(false);  // 刷新状态

// ==================== 计算属性 ====================

/**
 * 过滤后的房间列表
 */
const filteredRooms = computed(() => {
  let rooms = store.roomList;

  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    rooms = rooms.filter(room =>
      room.roomId.toLowerCase().includes(query)
    );
  }

  // 按状态筛选
  if (filterStatus.value !== 'all') {
    switch (filterStatus.value) {
      case 'powered-on':
        rooms = rooms.filter(room => room.isPowerOn);
        break;
      case 'powered-off':
        rooms = rooms.filter(room => !room.isPowerOn);
        break;
      case 'serving':
        rooms = rooms.filter(room => room.status === 'serving');
        break;
      case 'waiting':
        rooms = rooms.filter(room => room.status === 'waiting');
        break;
    }
  }

  return rooms;
});

/**
 * 总收入
 */
const totalRevenue = computed(() => {
  return store.roomList.reduce((sum, room) => {
    return sum + (room.totalFee || 0);
  }, 0);
});

// ==================== 辅助函数 ====================

/**
 * 获取房间卡片样式
 */
function getRoomCardClass(room) {
  if (!room.isPowerOn) {
    return 'bg-slate-900/50 ring-slate-700';
  }
  
  switch (room.status) {
    case 'serving':
      return 'bg-green-900/30 ring-green-500/50';
    case 'waiting':
      return 'bg-yellow-900/30 ring-yellow-500/50';
    default:
      return 'bg-slate-900/50 ring-slate-700';
  }
}

/**
 * 获取状态点样式
 */
function getStatusDotClass(room) {
  if (!room.isPowerOn) {
    return 'bg-slate-600';
  }
  
  switch (room.status) {
    case 'serving':
      return 'bg-green-500 animate-pulse';
    case 'waiting':
      return 'bg-yellow-500 animate-pulse';
    default:
      return 'bg-slate-600';
  }
}

/**
 * 获取房间提示信息
 */
function getRoomTooltip(room) {
  if (!room.isPowerOn) {
    return `房间 ${room.roomId} - 已关闭`;
  }
  
  const status = room.status === 'serving' ? '服务中' : 
                 room.status === 'waiting' ? '等待中' : '待机';
  const fanSpeed = getFanSpeedLabel(room.fanSpeed);
  
  return `房间 ${room.roomId}\n状态: ${status}\n温度: ${room.currentTemp?.toFixed(1) || '--'}°C\n风速: ${fanSpeed}`;
}

/**
 * 获取风速标签
 */
function getFanSpeedLabel(fanSpeed) {
  const labels = {
    Low: '低风',
    Mid: '中风',
    High: '高风'
  };
  return labels[fanSpeed] || fanSpeed || '--';
}

/**
 * 格式化服务时间（显示已服务时长）
 */
function formatServiceTime(startTime) {
  if (!startTime) return '';

  try {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 1000 / 60);

    if (diffMins < 60) {
      return `${diffMins}分钟`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}小时${mins}分钟`;
    }
  } catch (error) {
    return '';
  }
}

/**
 * 格式化请求时间（显示等待了多久）
 */
function formatRequestTime(requestTime) {
  if (!requestTime) return '';

  try {
    const request = new Date(requestTime);
    const now = new Date();
    const diffMs = now - request;
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) {
      return `等待${diffSecs}秒`;
    } else {
      const mins = Math.floor(diffSecs / 60);
      return `等待${mins}分钟`;
    }
  } catch (error) {
    return '';
  }
}

// ==================== 事件处理 ====================

/**
 * 切换中央空调开关
 */
async function handleToggleCentralAC() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    if (store.centralACStatus.isRunning) {
      await store.stopCentralAC();
    } else {
      await store.startCentralAC(store.centralACStatus.mode);
    }
  } catch (error) {
    errorMessage.value = error.message || '操作失败';
  } finally {
    isLoading.value = false;
  }
}

/**
 * 设置空调模式
 */
async function handleSetMode(mode) {
  if (store.centralACStatus.mode === mode) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // 需要重新启动来切换模式
    await store.startCentralAC(mode);
  } catch (error) {
    errorMessage.value = error.message || '切换模式失败';
  } finally {
    isLoading.value = false;
  }
}

/**
 * 手动刷新数据
 */
async function handleRefresh() {
  isRefreshing.value = true;
  errorMessage.value = '';

  try {
    await store.initAdminData();
    console.log('数据刷新成功');
  } catch (error) {
    errorMessage.value = '刷新失败，请稍后重试';
    console.error('刷新失败:', error);
  } finally {
    isRefreshing.value = false;
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  console.log('🔧 管理员界面加载...');

  // 连接 WebSocket
  store.connectWebSocket();

  // 初始化数据
  try {
    await store.initAdminData();
  } catch (error) {
    errorMessage.value = '加载数据失败，请刷新页面重试';
  }
});

onUnmounted(() => {
  console.log('🔧 管理员界面卸载');
  store.disconnectWebSocket();
});
</script>

<style scoped>
/* 滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>