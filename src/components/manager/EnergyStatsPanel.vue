<template>
  <div>
    <h2 class="text-xl font-semibold text-white mb-6 flex items-center">
      <svg class="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
      能耗统计分析
    </h2>

    <!-- 加载状态 -->
    <div v-if="store.isLoading" class="text-center py-16">
      <svg class="animate-spin h-10 w-10 mx-auto text-cyan-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <p class="mt-3 text-slate-500">加载中...</p>
    </div>

    <div v-else class="space-y-6">
      
      <!-- 每日能耗趋势图 -->
      <div class="bg-slate-900/50 rounded-lg p-4">
        <h3 class="text-md font-medium text-slate-300 mb-4">每日能耗趋势</h3>
        
        <div v-if="store.dailyStats.length === 0" class="text-center py-8 text-slate-500">
          暂无数据
        </div>
        
        <!-- 简易柱状图 -->
        <div v-else class="h-64 flex items-end justify-between gap-2">
          <div
            v-for="(day, index) in store.dailyStats"
            :key="index"
            class="flex-1 flex flex-col items-center"
          >
            <!-- 柱子 -->
            <div
              class="w-full bg-cyan-500/80 rounded-t transition-all hover:bg-cyan-400"
              :style="{ height: getBarHeight(day.energy) + '%' }"
              :title="`${day.date}: ${day.energy?.toFixed(2)} kWh`"
            ></div>
            <!-- 日期标签 -->
            <div class="mt-2 text-xs text-slate-500 transform -rotate-45 origin-top-left whitespace-nowrap">
              {{ formatDate(day.date) }}
            </div>
          </div>
        </div>
        
        <!-- 图例 -->
        <div class="mt-8 flex justify-center gap-6 text-sm text-slate-500">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-cyan-500 rounded"></div>
            <span>能耗 (kWh)</span>
          </div>
        </div>
      </div>

      <!-- 统计详情 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- 能耗分析 -->
        <div class="bg-slate-900/50 rounded-lg p-4">
          <h3 class="text-md font-medium text-slate-300 mb-4">能耗分析</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center py-2 border-b border-slate-700">
              <span class="text-slate-400">日均能耗</span>
              <span class="text-white font-medium">{{ store.energyStats.dailyAvgEnergy?.toFixed(2) || '0' }} kWh</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-700">
              <span class="text-slate-400">用电高峰时段</span>
              <span class="text-white font-medium">{{ store.energyStats.peakHour || '暂无数据' }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-700">
              <span class="text-slate-400">统计天数</span>
              <span class="text-white font-medium">{{ store.dailyStats.length }} 天</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="text-slate-400">总能耗</span>
              <span class="text-yellow-400 font-bold text-lg">{{ store.energyStats.totalEnergy?.toFixed(2) || '0' }} kWh</span>
            </div>
          </div>
        </div>

        <!-- 费用分析 -->
        <div class="bg-slate-900/50 rounded-lg p-4">
          <h3 class="text-md font-medium text-slate-300 mb-4">费用分析</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center py-2 border-b border-slate-700">
              <span class="text-slate-400">日均费用</span>
              <span class="text-white font-medium">¥{{ dailyAvgFee.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-700">
              <span class="text-slate-400">平均每房费用</span>
              <span class="text-white font-medium">¥{{ avgFeePerRoom.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-700">
              <span class="text-slate-400">参与房间数</span>
              <span class="text-white font-medium">{{ store.roomReports.length }} 间</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="text-slate-400">总费用</span>
              <span class="text-green-400 font-bold text-lg">¥{{ store.energyStats.totalFee?.toFixed(2) || '0' }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- 高能耗房间提醒 -->
      <div v-if="store.highEnergyRooms.length > 0" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <h3 class="text-md font-medium text-red-400 mb-3 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          高能耗房间提醒
        </h3>
        <p class="text-slate-400 text-sm mb-3">以下房间能耗超过平均值的 150%，建议关注：</p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="room in store.highEnergyRooms"
            :key="room.roomId"
            class="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"
          >
            {{ room.roomId }} ({{ room.totalEnergy?.toFixed(1) }} kWh)
          </span>
        </div>
      </div>

      <!-- 使用提示 -->
      <div class="bg-slate-900/50 rounded-lg p-4">
        <h3 class="text-md font-medium text-slate-300 mb-3">节能建议</h3>
        <ul class="space-y-2 text-sm text-slate-400">
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>建议将空调温度设置在 24-26°C，每升高 1°C 可节能约 6%</span>
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>使用中低风速可以在保证舒适度的同时降低能耗</span>
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>关注高能耗房间，检查是否存在门窗未关闭等问题</span>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useManagerStore } from '../../stores/managerStore.js';

// ==================== Emits ====================
const emit = defineEmits(['error']);

// ==================== Store ====================
const store = useManagerStore();

// ==================== Computed ====================

// 日均费用
const dailyAvgFee = computed(() => {
  if (store.dailyStats.length === 0) return 0;
  return store.energyStats.totalFee / store.dailyStats.length;
});

// 平均每房费用
const avgFeePerRoom = computed(() => {
  if (store.roomReports.length === 0) return 0;
  return store.energyStats.totalFee / store.roomReports.length;
});

// 最大能耗值（用于计算柱状图高度）
const maxEnergy = computed(() => {
  if (store.dailyStats.length === 0) return 1;
  return Math.max(...store.dailyStats.map(d => d.energy || 0));
});

// ==================== 方法 ====================

function getBarHeight(energy) {
  if (!energy || maxEnergy.value === 0) return 5;
  return Math.max(5, (energy / maxEnergy.value) * 100);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
</script>