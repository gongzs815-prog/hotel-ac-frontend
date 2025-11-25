<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-white flex items-center">
        <svg class="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        房间空调使用报表
      </h2>

      <!-- 排序和筛选 -->
      <div class="flex items-center gap-3">
        <select
          v-model="sortBy"
          class="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="roomId">按房间号</option>
          <option value="energy">按能耗</option>
          <option value="fee">按费用</option>
          <option value="duration">按使用时长</option>
        </select>

        <button
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          class="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition"
          :title="sortOrder === 'asc' ? '升序' : '降序'"
        >
          <svg v-if="sortOrder === 'asc'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="store.isLoading" class="text-center py-16">
      <svg class="animate-spin h-10 w-10 mx-auto text-cyan-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <p class="mt-3 text-slate-500">加载中...</p>
    </div>

    <!-- 报表表格 -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="text-left text-slate-500 border-b border-slate-700">
            <th class="pb-3 font-medium">房间号</th>
            <th class="pb-3 font-medium">状态</th>
            <th class="pb-3 font-medium text-right">使用时长</th>
            <th class="pb-3 font-medium text-right">能耗 (kWh)</th>
            <th class="pb-3 font-medium text-right">费用 (元)</th>
            <th class="pb-3 font-medium text-center">平均温度</th>
            <th class="pb-3 font-medium text-center">主要风速</th>
            <th class="pb-3 font-medium text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="room in sortedRooms"
            :key="room.roomId"
            class="border-b border-slate-700/50 hover:bg-slate-700/30 transition"
          >
            <td class="py-4">
              <span class="font-bold text-white">{{ room.roomId }}</span>
            </td>
            <td class="py-4">
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  room.isActive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-500/20 text-slate-400'
                ]"
              >
                {{ room.isActive ? '运行中' : '已关闭' }}
              </span>
            </td>
            <td class="py-4 text-right text-slate-300">
              {{ formatDuration(room.totalDuration) }}
            </td>
            <td class="py-4 text-right">
              <span :class="getEnergyClass(room.totalEnergy)">
                {{ room.totalEnergy?.toFixed(2) || '0.00' }}
              </span>
            </td>
            <td class="py-4 text-right text-green-400 font-medium">
              ¥{{ room.totalFee?.toFixed(2) || '0.00' }}
            </td>
            <td class="py-4 text-center text-cyan-400">
              {{ room.avgTemperature?.toFixed(1) || '--' }}°C
            </td>
            <td class="py-4 text-center">
              <span :class="getFanSpeedClass(room.mainFanSpeed)">
                {{ getFanSpeedLabel(room.mainFanSpeed) }}
              </span>
            </td>
            <td class="py-4 text-center">
              <button
                @click="showRoomDetail(room)"
                class="px-3 py-1 text-sm bg-cyan-600/20 text-cyan-400 rounded hover:bg-cyan-600/30 transition"
              >
                详情
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空状态 -->
      <div v-if="sortedRooms.length === 0" class="text-center py-16 text-slate-500">
        <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p>暂无报表数据</p>
      </div>
    </div>

    <!-- 房间详情弹窗 -->
    <div
      v-if="selectedRoom"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="selectedRoom = null"
    >
      <div class="bg-slate-800 rounded-xl ring-1 ring-white/10 p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-white">房间 {{ selectedRoom.roomId }} 详细报表</h3>
          <button @click="selectedRoom = null" class="text-slate-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- 详细信息 -->
        <div class="space-y-4">
          <!-- 基本统计 -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-slate-900/50 rounded-lg p-3">
              <p class="text-slate-500 text-sm">总能耗</p>
              <p class="text-xl font-bold text-yellow-400">{{ selectedRoom.totalEnergy?.toFixed(2) }} kWh</p>
            </div>
            <div class="bg-slate-900/50 rounded-lg p-3">
              <p class="text-slate-500 text-sm">总费用</p>
              <p class="text-xl font-bold text-green-400">¥{{ selectedRoom.totalFee?.toFixed(2) }}</p>
            </div>
            <div class="bg-slate-900/50 rounded-lg p-3">
              <p class="text-slate-500 text-sm">使用时长</p>
              <p class="text-xl font-bold text-white">{{ formatDuration(selectedRoom.totalDuration) }}</p>
            </div>
            <div class="bg-slate-900/50 rounded-lg p-3">
              <p class="text-slate-500 text-sm">平均温度</p>
              <p class="text-xl font-bold text-cyan-400">{{ selectedRoom.avgTemperature?.toFixed(1) }}°C</p>
            </div>
          </div>

          <!-- 风速分布 -->
          <div class="bg-slate-900/50 rounded-lg p-4">
            <p class="text-slate-300 font-medium mb-3">风速使用分布</p>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-blue-400">低风</span>
                <div class="flex-1 mx-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-400 rounded-full"
                    :style="{ width: (selectedRoom.fanSpeedDistribution?.Low || 0) + '%' }"
                  ></div>
                </div>
                <span class="text-slate-400 text-sm w-12 text-right">{{ selectedRoom.fanSpeedDistribution?.Low || 0 }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-yellow-400">中风</span>
                <div class="flex-1 mx-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-yellow-400 rounded-full"
                    :style="{ width: (selectedRoom.fanSpeedDistribution?.Mid || 0) + '%' }"
                  ></div>
                </div>
                <span class="text-slate-400 text-sm w-12 text-right">{{ selectedRoom.fanSpeedDistribution?.Mid || 0 }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-red-400">高风</span>
                <div class="flex-1 mx-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-red-400 rounded-full"
                    :style="{ width: (selectedRoom.fanSpeedDistribution?.High || 0) + '%' }"
                  ></div>
                </div>
                <span class="text-slate-400 text-sm w-12 text-right">{{ selectedRoom.fanSpeedDistribution?.High || 0 }}%</span>
              </div>
            </div>
          </div>

          <!-- 使用时段 -->
          <div class="bg-slate-900/50 rounded-lg p-4">
            <p class="text-slate-300 font-medium mb-2">高峰使用时段</p>
            <p class="text-white">{{ selectedRoom.peakHours || '暂无数据' }}</p>
          </div>
        </div>

        <div class="mt-6">
          <button
            @click="selectedRoom = null"
            class="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useManagerStore } from '../../stores/managerStore.js';

// ==================== Emits ====================
const emit = defineEmits(['error']);

// ==================== Store ====================
const store = useManagerStore();

// ==================== 响应式状态 ====================
const sortBy = ref('roomId');
const sortOrder = ref('asc');
const selectedRoom = ref(null);

// ==================== Computed ====================

const sortedRooms = computed(() => {
  const rooms = [...store.roomReports];
  
  rooms.sort((a, b) => {
    let compareA, compareB;
    
    switch (sortBy.value) {
      case 'energy':
        compareA = a.totalEnergy || 0;
        compareB = b.totalEnergy || 0;
        break;
      case 'fee':
        compareA = a.totalFee || 0;
        compareB = b.totalFee || 0;
        break;
      case 'duration':
        compareA = a.totalDuration || 0;
        compareB = b.totalDuration || 0;
        break;
      default:
        compareA = a.roomId;
        compareB = b.roomId;
    }
    
    if (sortOrder.value === 'asc') {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });
  
  return rooms;
});

// ==================== 方法 ====================

function formatDuration(minutes) {
  if (!minutes) return '0分钟';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  }
  return `${mins}分钟`;
}

function getEnergyClass(energy) {
  if (!energy) return 'text-slate-400';
  // 根据能耗高低显示不同颜色
  const avgEnergy = store.energyStats.totalEnergy / store.roomReports.length;
  if (energy > avgEnergy * 1.5) return 'text-red-400 font-medium';
  if (energy > avgEnergy) return 'text-yellow-400';
  return 'text-slate-300';
}

function getFanSpeedLabel(speed) {
  const labels = { Low: '低风', Mid: '中风', High: '高风' };
  return labels[speed] || '--';
}

function getFanSpeedClass(speed) {
  const classes = {
    Low: 'text-blue-400',
    Mid: 'text-yellow-400',
    High: 'text-red-400'
  };
  return classes[speed] || 'text-slate-400';
}

function showRoomDetail(room) {
  selectedRoom.value = room;
}
</script>