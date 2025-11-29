<template>
  <div class="min-h-screen bg-slate-900 text-slate-300 p-6">
    
    <!-- ==================== 顶部标题栏 ==================== -->
    <header class="mb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center">
            <svg class="w-8 h-8 mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            酒店经理控制台
          </h1>
          <p class="text-slate-500 text-sm mt-1">空调能耗统计与报表分析</p>
        </div>

        <!-- 日期选择和刷新 -->
        <div class="flex items-center gap-4">
          <!-- 日期范围选择 -->
          <div class="flex items-center gap-2 bg-slate-800 p-2 rounded-lg ring-1 ring-white/10">
            <input
              v-model="startDate"
              type="date"
              class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <span class="text-slate-500">至</span>
            <input
              v-model="endDate"
              type="date"
              class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              @click="handleDateChange"
              class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded transition"
            >
              查询
            </button>
          </div>

          <!-- 刷新按钮 -->
          <button
            @click="handleRefresh"
            :disabled="store.isLoading"
            class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition ring-1 ring-white/10 disabled:opacity-50"
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
    </header>

    <!-- ==================== 统计卡片 ==================== -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <!-- 总能耗 -->
      <div class="bg-slate-800 rounded-xl p-4 ring-1 ring-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-500 text-sm">总能耗</p>
            <p class="text-2xl font-bold text-white mt-1">
              {{ formatNumber(store.energyStats.totalEnergy) }}
              <span class="text-sm font-normal text-slate-400">kWh</span>
            </p>
          </div>
          <div class="p-3 bg-yellow-500/20 rounded-lg">
            <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- 总费用 -->
      <div class="bg-slate-800 rounded-xl p-4 ring-1 ring-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-500 text-sm">总费用</p>
            <p class="text-2xl font-bold text-white mt-1">
              ¥{{ formatNumber(store.energyStats.totalFee) }}
            </p>
          </div>
          <div class="p-3 bg-green-500/20 rounded-lg">
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- 开机房间 -->
      <div class="bg-slate-800 rounded-xl p-4 ring-1 ring-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-500 text-sm">当前开机</p>
            <p class="text-2xl font-bold text-white mt-1">
              {{ store.energyStats.activeRooms }}
              <span class="text-sm font-normal text-slate-400">间</span>
            </p>
          </div>
          <div class="p-3 bg-cyan-500/20 rounded-lg">
            <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- 平均温度 -->
      <div class="bg-slate-800 rounded-xl p-4 ring-1 ring-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-500 text-sm">平均温度</p>
            <p class="text-2xl font-bold text-white mt-1">
              {{ store.energyStats.avgTemperature?.toFixed(1) || '--' }}
              <span class="text-sm font-normal text-slate-400">°C</span>
            </p>
          </div>
          <div class="p-3 bg-blue-500/20 rounded-lg">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

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
      
      <!-- 房间报表 -->
      <div v-if="activeTab === 'roomReport'">
        <RoomReportPanel @error="handleError" />
      </div>

      <!-- 能耗统计 -->
      <div v-else-if="activeTab === 'energyStats'">
        <EnergyStatsPanel @error="handleError" />
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useManagerStore } from '../../stores/managerStore.js';
import RoomReportPanel from './RoomReportPanel.vue';
import EnergyStatsPanel from './EnergyStatsPanel.vue';

// ==================== Store ====================
const store = useManagerStore();

// ==================== 响应式状态 ====================
const activeTab = ref('roomReport');
const errorMessage = ref('');
const startDate = ref(store.dateRange.startDate);
const endDate = ref(store.dateRange.endDate);

// 标签页配置
const tabs = [
  { id: 'roomReport', label: '房间报表', icon: '📋' },
  { id: 'energyStats', label: '能耗统计', icon: '📊' }
];

// ==================== 方法 ====================

function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

async function handleDateChange() {
  store.setDateRange(startDate.value, endDate.value);
  try {
    await store.refreshAllData();
  } catch (error) {
    errorMessage.value = '查询失败: ' + (error.message || '未知错误');
  }
}

async function handleRefresh() {
  try {
    await store.refreshAllData();
  } catch (error) {
    errorMessage.value = '刷新失败: ' + (error.message || '未知错误');
  }
}

function handleError(message) {
  errorMessage.value = message;
}

// ==================== 生命周期 ====================

onMounted(async () => {
  console.log('📊 酒店经理控制台加载...');
  try {
    await store.initManagerData();
  } catch (error) {
    errorMessage.value = '加载数据失败，请刷新页面重试';
  }
});
</script>