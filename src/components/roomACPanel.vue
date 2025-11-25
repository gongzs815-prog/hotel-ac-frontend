<template>
  <div class="bg-slate-800 text-slate-300 p-6 rounded-2xl shadow-2xl w-full max-w-md mx-auto ring-1 ring-white/10">
    
    <!-- ==================== Top Info Bar ==================== -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center space-x-3">
        <span class="text-xl font-bold text-slate-300">房间 {{ store.roomId }}</span>
        
        <!-- 状态指示器 -->
        <div class="flex items-center space-x-2">
          <div 
            :class="['w-3 h-3 rounded-full ring-2 ring-offset-2 ring-offset-slate-800', statusIndicatorClass]"
            :title="statusText"
          ></div>
          <span class="text-sm font-medium" :class="statusTextClass">
            {{ statusText }}
          </span>
        </div>
      </div>
      
      <!-- 开关按钮 -->
      <button 
        @click="handleTogglePower"
        :disabled="isLoading"
        :class="[
          'px-4 py-2 rounded-lg font-semibold text-white shadow-md transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          store.isPowerOn 
            ? 'bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-500/50' 
            : 'bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-500/50'
        ]"
      >
        <span v-if="isLoading" class="flex items-center">
          <!-- Loading Spinner -->
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          处理中...
        </span>
        <span v-else>
          {{ store.isPowerOn ? '关闭电源' : '开启电源' }}
        </span>
      </button>
    </div>

    <!-- ==================== WebSocket 连接状态 ==================== -->
    <div v-if="!store.isConnected" class="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm flex items-center">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <span>实时连接断开，数据可能不是最新</span>
    </div>

    <!-- ==================== Error Message ==================== -->
    <div v-if="errorMessage" class="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center justify-between">
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

    <!-- ==================== Dashboard (开机状态) ==================== -->
    <div class="text-center my-10" v-if="store.isPowerOn">
      <!-- 当前温度 -->
      <div class="text-7xl font-light tracking-tighter text-cyan-300" style="text-shadow: 0 0 15px rgba(0, 255, 255, 0.3);">
        {{ store.currentTemp.toFixed(1) }}<span class="text-3xl align-super text-cyan-200">&deg;C</span>
      </div>
      
      <!-- 目标温度和模式 -->
      <div class="text-slate-400 mt-2 flex items-center justify-center space-x-4">
        <span>目标: {{ store.targetTemp.toFixed(1) }}&deg;C</span>
        <span class="text-slate-600">|</span>
        <span>{{ modeLabel }}</span>
      </div>
      
      <!-- 温度变化趋势指示 -->
      <div class="mt-3 flex items-center justify-center space-x-2">
        <div v-if="isCoolingDown" class="flex items-center text-blue-400 text-sm">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
          降温中
        </div>
        <div v-else-if="isHeatingUp" class="flex items-center text-red-400 text-sm">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
          </svg>
          升温中
        </div>
        <div v-else class="flex items-center text-green-400 text-sm">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          已达目标
        </div>
      </div>
    </div>
    
    <!-- ==================== Dashboard (关机状态) ==================== -->
    <div class="text-center my-10" v-else>
      <div class="text-6xl font-thin tracking-tighter text-slate-500">
        已关闭
      </div>
      <div class="text-slate-600 mt-2 text-sm">
        点击"开启电源"按钮启动空调
      </div>
    </div>

    <!-- ==================== Controls (开机时显示) ==================== -->
    <div class="grid grid-cols-2 gap-6 my-6" v-if="store.isPowerOn">
      
      <!-- ========== Temperature Control ========== -->
      <div class="bg-slate-900/50 p-4 rounded-lg">
        <div class="flex items-center justify-center space-x-4">
          <button 
            @click="handleTempChange(-0.5)" 
            :disabled="!canDecreaseTemp || isLoading"
            class="bg-slate-700 rounded-full w-12 h-12 flex items-center justify-center text-2xl text-cyan-300 hover:bg-slate-600 transition disabled:opacity-30 disabled:cursor-not-allowed focus:ring-2 focus:ring-cyan-500"
            title="降低温度"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 12H4"></path>
            </svg>
          </button>
          
          <div class="text-center">
            <div class="font-bold text-slate-300">温度</div>
            <div class="text-xs text-slate-500 mt-1">{{ store.targetTemp.toFixed(1) }}&deg;C</div>
          </div>
          
          <button 
            @click="handleTempChange(0.5)" 
            :disabled="!canIncreaseTemp || isLoading"
            class="bg-slate-700 rounded-full w-12 h-12 flex items-center justify-center text-2xl text-cyan-300 hover:bg-slate-600 transition disabled:opacity-30 disabled:cursor-not-allowed focus:ring-2 focus:ring-cyan-500"
            title="提高温度"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
        </div>
        
        <!-- 温度范围提示 -->
        <div class="text-xs text-slate-400 text-center mt-3">
          范围: {{ tempRange }}
        </div>
      </div>

      <!-- ========== Fan Speed Control ========== -->
      <div class="bg-slate-900/50 p-4 rounded-lg">
        <div class="flex flex-col justify-center items-center space-y-2">
          <div class="text-sm font-semibold text-slate-300 mb-1">风速</div>
          
          <div class="flex items-center space-x-2">
            <button 
              v-for="speed in ['Low', 'Mid', 'High']" 
              :key="speed"
              @click="handleFanSpeedChange(speed)"
              :disabled="isLoading"
              :class="[
                'px-3 py-2 rounded-md font-semibold text-sm transition',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:ring-2 focus:ring-cyan-500',
                store.fanSpeed === speed 
                  ? 'bg-cyan-600 text-white shadow-lg ring-2 ring-cyan-500' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              ]"
              :title="speedLabels[speed]"
            >
              {{ speedLabels[speed] }}
            </button>
          </div>
          
          <!-- 费率提示 -->
          <div class="text-xs text-slate-400 mt-2">
            费率: ¥{{ speedCosts[store.fanSpeed] || '0.00' }}/分钟
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 等待队列提示 ==================== -->
    <div 
      v-if="store.isPowerOn && store.status === 'waiting'" 
      class="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg class="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>等待服务中...</span>
        </div>
        <span class="font-semibold">预计 {{ store.waitTime }} 秒</span>
      </div>
      <div class="text-xs mt-2 text-yellow-300/70">
        当前服务已满（最多30间房），您的请求在等待队列中
      </div>
    </div>

    <!-- ==================== Bottom Status Bar ==================== -->
    <div class="border-t border-slate-700 pt-4">
      <!-- 费用信息 -->
      <div class="flex justify-between items-center text-sm text-slate-400 mb-3">
        <div>
          <span>当前费用:</span>
          <span class="font-bold text-green-400 text-lg ml-2">
            ¥ {{ store.totalFee.toFixed(2) }}
          </span>
        </div>
        <div>
          <span>费率:</span>
          <span class="text-slate-300 ml-1">{{ store.feeRate.toFixed(2) }} 元/度</span>
        </div>
      </div>
      
      <!-- 操作提示 -->
      <div class="text-xs text-slate-500 text-center pt-2 border-t border-slate-700/50">
        <div v-if="!store.isPowerOn">
          💡 提示: 开启空调后可调节温度和风速
        </div>
        <div v-else-if="store.status === 'serving'">
          ✅ 空调正在为您服务
        </div>
        <div v-else-if="store.status === 'waiting'">
          ⏳ 请稍候，系统将尽快为您服务
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useRoomStore, TEMP_LIMITS, FAN_SPEED_CONFIG } from '../stores/roomStore.js';

// ==================== Store ====================
const store = useRoomStore();
const route = useRoute();

// ==================== 响应式状态 ====================
const isLoading = ref(false);
const errorMessage = ref('');

// ==================== 计算属性 ====================

// 状态文本和样式
const statusIndicatorClass = computed(() => {
  if (!store.isPowerOn) return 'bg-slate-600 ring-slate-600';
  
  switch(store.status) {
    case 'serving':
      return 'bg-green-500 ring-green-500 animate-pulse';
    case 'waiting':
      return 'bg-yellow-500 ring-yellow-500 animate-pulse';
    case 'idle':
      return 'bg-blue-500 ring-blue-500';
    default:
      return 'bg-slate-500 ring-slate-500';
  }
});

const statusTextClass = computed(() => {
  if (!store.isPowerOn) return 'text-slate-500';
  
  switch(store.status) {
    case 'serving':
      return 'text-green-400';
    case 'waiting':
      return 'text-yellow-400';
    case 'idle':
      return 'text-blue-400';
    default:
      return 'text-slate-400';
  }
});

const statusText = computed(() => {
  if (!store.isPowerOn) return '已关闭';
  
  switch(store.status) {
    case 'serving':
      return '服务中';
    case 'waiting':
      return '等待中';
    case 'idle':
      return '待机';
    default:
      return '已开启';
  }
});

// 模式标签
const modeLabel = computed(() => {
  return store.mode === 'Cooling' ? '制冷' : '制热';
});

// 温度范围
const tempRange = computed(() => {
  const limits = TEMP_LIMITS[store.mode];
  return limits ? `${limits.min}-${limits.max}°C` : '';
});

// 温度调节按钮禁用逻辑
const canDecreaseTemp = computed(() => {
  const limits = TEMP_LIMITS[store.mode];
  return limits ? store.targetTemp > limits.min : true;
});

const canIncreaseTemp = computed(() => {
  const limits = TEMP_LIMITS[store.mode];
  return limits ? store.targetTemp < limits.max : true;
});

// 温度变化趋势
const isCoolingDown = computed(() => {
  return store.isPowerOn && 
         store.mode === 'Cooling' && 
         store.currentTemp > store.targetTemp &&
         store.status === 'serving';
});

const isHeatingUp = computed(() => {
  return store.isPowerOn && 
         store.mode === 'Heating' && 
         store.currentTemp < store.targetTemp &&
         store.status === 'serving';
});

// 风速标签（从配置中提取）
const speedLabels = computed(() => {
  const labels = {};
  Object.keys(FAN_SPEED_CONFIG).forEach(key => {
    labels[key] = FAN_SPEED_CONFIG[key].label;
  });
  return labels;
});

// 风速费率（从配置中提取）
const speedCosts = computed(() => {
  const costs = {};
  Object.keys(FAN_SPEED_CONFIG).forEach(key => {
    costs[key] = FAN_SPEED_CONFIG[key].cost.toFixed(2);
  });
  return costs;
});

// ==================== 事件处理函数 ====================

/**
 * 处理开关机
 */
async function handleTogglePower() {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    await store.togglePower();
    console.log('✅ 开关机操作成功');
  } catch (error) {
    console.error('❌ 开关机操作失败:', error);
    errorMessage.value = error.message || '操作失败，请稍后重试';
  } finally {
    isLoading.value = false;
  }
}

/**
 * 处理温度调节
 * @param {number} delta - 温度变化量
 */
async function handleTempChange(delta) {
  const newTemp = Math.round((store.targetTemp + delta) * 10) / 10; // 保留一位小数

  // 前端快速验证
  const limits = TEMP_LIMITS[store.mode];
  if (!limits) {
    errorMessage.value = '未知的模式';
    return;
  }

  if (newTemp < limits.min || newTemp > limits.max) {
    errorMessage.value = `${store.mode === 'Cooling' ? '制冷' : '制热'}模式下，温度范围为 ${limits.min}-${limits.max}°C`;
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    await store.setTargetTemp(newTemp);
    console.log(`✅ 温度设置成功: ${newTemp}°C`);
  } catch (error) {
    console.error('❌ 温度设置失败:', error);
    errorMessage.value = error.message || '温度设置失败，请重试';
  } finally {
    isLoading.value = false;
  }
}

/**
 * 处理风速切换
 * @param {string} speed - 风速值
 */
async function handleFanSpeedChange(speed) {
  if (store.fanSpeed === speed) {
    return; // 已经是当前风速，不需要操作
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    await store.setFanSpeed(speed);
    console.log(`✅ 风速设置成功: ${speed}`);
  } catch (error) {
    console.error('❌ 风速设置失败:', error);
    errorMessage.value = error.message || '风速设置失败，请重试';
  } finally {
    isLoading.value = false;
  }
}

// ==================== 生命周期钩子 ====================

/**
 * 组件挂载时
 */
onMounted(async () => {
  console.log('组件挂载，初始化房间数据...');

  // 0. 从路由参数获取房间 ID
  const roomId = route.params.roomId || '301'; // 如果没有路由参数，默认使用 301
  store.setRoomId(roomId);

  // 1. 连接 WebSocket
  store.connectWebSocket();

  // 2. 初始化房间数据
  try {
    await store.initRoomData();
    console.log('房间数据初始化成功');
  } catch (error) {
    console.error('房间数据初始化失败:', error);
    errorMessage.value = '无法加载房间数据，请刷新页面重试';
  }
});

/**
 * 组件卸载时
 */
onUnmounted(() => {
  console.log('🔌 组件卸载，断开 WebSocket 连接...');
  store.disconnectWebSocket();
});
</script>

<style scoped>
/* 自定义动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 按钮 hover 效果优化 */
button:not(:disabled):hover {
  transform: translateY(-1px);
}

button:not(:disabled):active {
  transform: translateY(0);
}

/* 温度显示的发光效果 */
.text-cyan-300 {
  text-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
}
</style>