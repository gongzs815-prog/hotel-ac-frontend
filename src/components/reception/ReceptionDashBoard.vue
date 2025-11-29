<template>
  <div class="min-h-screen bg-slate-900 text-slate-300 p-6">
    
    <!-- ==================== 顶部标题栏 ==================== -->
    <header class="mb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center">
            <svg class="w-8 h-8 mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            前台服务台
          </h1>
          <p class="text-slate-500 text-sm mt-1">办理入住与结账服务</p>
        </div>

        <!-- 统计信息 -->
        <div class="flex items-center gap-4 bg-slate-800 p-3 rounded-xl ring-1 ring-white/10">
          <div class="text-center px-3">
            <div class="text-lg font-bold text-white">{{ store.statistics.total }}</div>
            <div class="text-xs text-slate-500">总房间</div>
          </div>
          <div class="w-px h-8 bg-slate-700"></div>
          <div class="text-center px-3">
            <div class="text-lg font-bold text-green-400">{{ store.statistics.available }}</div>
            <div class="text-xs text-slate-500">空闲</div>
          </div>
          <div class="w-px h-8 bg-slate-700"></div>
          <div class="text-center px-3">
            <div class="text-lg font-bold text-cyan-400">{{ store.statistics.occupied }}</div>
            <div class="text-xs text-slate-500">已入住</div>
          </div>
          <div class="w-px h-8 bg-slate-700"></div>
          <button
            @click="handleRefresh"
            :disabled="store.isLoading"
            class="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition disabled:opacity-50"
            title="刷新数据"
          >
            <svg :class="['w-5 h-5', store.isLoading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
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

      <!-- 成功提示 -->
      <div v-if="successMessage" class="mt-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>{{ successMessage }}</span>
        </div>
        <button @click="successMessage = ''" class="text-green-400 hover:text-green-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </header>

    <!-- ==================== 功能选择标签页 ==================== -->
    <div class="mb-6">
      <div class="flex space-x-2 bg-slate-800 p-1 rounded-xl w-fit">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-6 py-3 rounded-lg font-medium transition flex items-center gap-2',
            activeTab === tab.id
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          ]"
        >
          <span class="text-xl">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- ==================== 内容区域 ==================== -->
    <div class="bg-slate-800 rounded-xl ring-1 ring-white/10 p-6">
      
      <!-- 办理入住 -->
      <div v-if="activeTab === 'checkIn'">
        <CheckInForm 
          @success="handleCheckInSuccess" 
          @error="handleError"
        />
      </div>

      <!-- 办理结账 -->
      <div v-else-if="activeTab === 'checkOut'">
        <CheckOutPanel 
          @success="handleCheckOutSuccess" 
          @error="handleError"
        />
      </div>

      <!-- 房间查询 -->
      <div v-else-if="activeTab === 'roomQuery'">
        <RoomQueryPanel />
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useReceptionStore } from '../../stores/receptionStore.js';
import CheckInForm from './CheckInForm.vue';
import CheckOutPanel from './CheckOutPanel.vue';
import RoomQueryPanel from './RoomQueryPanel.vue';

// ==================== Store ====================
const store = useReceptionStore();

// ==================== 响应式状态 ====================
const activeTab = ref('checkIn');
const errorMessage = ref('');
const successMessage = ref('');

// 标签页配置
const tabs = [
  { id: 'checkIn', label: '办理入住', icon: '📝' },
  { id: 'checkOut', label: '办理结账', icon: '💰' },
  { id: 'roomQuery', label: '房间查询', icon: '🔍' }
];

// ==================== 事件处理 ====================

async function handleRefresh() {
  try {
    await store.initReceptionData();
    successMessage.value = '数据已刷新';
    setTimeout(() => successMessage.value = '', 2000);
  } catch (error) {
    errorMessage.value = '刷新失败: ' + (error.message || '未知错误');
  }
}

function handleCheckInSuccess(data) {
  successMessage.value = `房间 ${data.roomId} 入住办理成功！`;
  setTimeout(() => successMessage.value = '', 3000);
}

function handleCheckOutSuccess(data) {
  successMessage.value = `房间 ${data.roomId} 结账完成！交易号: ${data.transactionId}`;
  setTimeout(() => successMessage.value = '', 3000);
}

function handleError(message) {
  errorMessage.value = message;
}

// ==================== 生命周期 ====================

onMounted(async () => {
  console.log('🏨 前台服务台加载...');
  try {
    await store.initReceptionData();
  } catch (error) {
    errorMessage.value = '加载数据失败，请刷新页面重试';
  }
});
</script>