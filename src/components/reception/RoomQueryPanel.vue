<template>
  <div>
    <h2 class="text-xl font-semibold text-white mb-6 flex items-center">
      <svg class="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      房间查询
    </h2>

    <!-- 筛选栏 -->
    <div class="flex flex-wrap gap-4 mb-6">
      <!-- 状态筛选 -->
      <div class="flex gap-2">
        <button
          v-for="status in statusFilters"
          :key="status.id"
          @click="selectedStatus = status.id"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition',
            selectedStatus === status.id
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          ]"
        >
          {{ status.label }}
          <span class="ml-1 opacity-70">({{ getStatusCount(status.id) }})</span>
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="flex-1 min-w-48">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索房间号..."
            class="w-full px-4 py-2 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <svg class="w-5 h-5 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      <!-- 房型筛选 -->
      <select
        v-model="selectedRoomType"
        class="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        <option value="all">全部房型</option>
        <option value="single">单人房</option>
        <option value="double">双人房</option>
        <option value="king">大床房</option>
      </select>
    </div>

    <!-- 房间网格 -->
    <div class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
      <div
        v-for="room in filteredRooms"
        :key="room.roomId"
        @click="showRoomDetail(room)"
        :class="[
          'p-3 rounded-lg text-center cursor-pointer transition-all hover:scale-105',
          'ring-1',
          getRoomCardClass(room)
        ]"
      >
        <!-- 房间号 -->
        <div class="font-bold text-white">{{ room.roomId }}</div>
        
        <!-- 状态指示 -->
        <div class="flex justify-center my-1">
          <div :class="['w-2 h-2 rounded-full', getStatusDotClass(room)]"></div>
        </div>
        
        <!-- 房型 -->
        <div class="text-xs text-slate-500">{{ getRoomTypeLabel(room.roomType) }}</div>
        
        <!-- 客户名（已入住显示） -->
        <div v-if="room.status === 'occupied'" class="text-xs text-cyan-400 mt-1 truncate">
          {{ room.customer?.name || '已入住' }}
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredRooms.length === 0" class="text-center py-16 text-slate-500">
      <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p>没有找到符合条件的房间</p>
    </div>

    <!-- 图例 -->
    <div class="flex flex-wrap gap-6 mt-6 pt-4 border-t border-slate-700 text-sm text-slate-500">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-green-500"></div>
        <span>空闲可用</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-cyan-500"></div>
        <span>已入住</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
        <span>清洁中</span>
      </div>
    </div>

    <!-- 房间详情弹窗 -->
    <div
      v-if="selectedRoom"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="selectedRoom = null"
    >
      <div class="bg-slate-800 rounded-xl ring-1 ring-white/10 p-6 w-full max-w-md mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-white">房间 {{ selectedRoom.roomId }}</h3>
          <button @click="selectedRoom = null" class="text-slate-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-400">房间状态</span>
            <span :class="getStatusTextClass(selectedRoom)">{{ getStatusLabel(selectedRoom.status) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">房间类型</span>
            <span class="text-white">{{ getRoomTypeLabel(selectedRoom.roomType) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">房间价格</span>
            <span class="text-green-400">¥{{ getRoomPrice(selectedRoom.roomType) }}/晚</span>
          </div>

          <div v-if="selectedRoom.status === 'occupied'" class="pt-3 border-t border-slate-700">
            <div class="text-slate-300 font-medium mb-3 flex items-center justify-between">
              <span>入住客户</span>
              <span v-if="isLoadingCustomer" class="text-xs text-cyan-400 flex items-center">
                <svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                加载中...
              </span>
            </div>

            <!-- 显示详细客户信息（从 API 获取） -->
            <div v-if="detailedCustomerInfo" class="space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-400">客户编号</span>
                <span class="text-white font-mono text-sm">{{ detailedCustomerInfo.customerId }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">客户姓名</span>
                <span class="text-white">{{ detailedCustomerInfo.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">身份证号</span>
                <span class="text-white font-mono text-sm">{{ detailedCustomerInfo.idCard }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">联系电话</span>
                <span class="text-white">{{ detailedCustomerInfo.phone }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">入住时间</span>
                <span class="text-white">{{ formatDateTime(detailedCustomerInfo.checkInTime) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">预计退房</span>
                <span class="text-white">{{ formatDateTime(detailedCustomerInfo.expectedCheckOutTime) }}</span>
              </div>
            </div>

            <!-- 加载失败或无数据时显示基本信息 -->
            <div v-else-if="!isLoadingCustomer" class="space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-400">客户姓名</span>
                <span class="text-white">{{ selectedRoom.customer?.name || '--' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">联系电话</span>
                <span class="text-white">{{ selectedRoom.customer?.phone || '--' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">入住时间</span>
                <span class="text-white">{{ formatDateTime(selectedRoom.customer?.checkInTime) }}</span>
              </div>
            </div>
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
import { useReceptionStore, ROOM_TYPE_CONFIG } from '../../stores/receptionStore.js';

// ==================== Store ====================
const store = useReceptionStore();

// ==================== 响应式状态 ====================
const selectedStatus = ref('all');
const selectedRoomType = ref('all');
const searchQuery = ref('');
const selectedRoom = ref(null);
const detailedCustomerInfo = ref(null);
const isLoadingCustomer = ref(false);

// 状态筛选选项
const statusFilters = [
  { id: 'all', label: '全部' },
  { id: 'available', label: '空闲' },
  { id: 'occupied', label: '已入住' },
  { id: 'cleaning', label: '清洁中' }
];

// ==================== Computed ====================

const filteredRooms = computed(() => {
  let result = store.rooms;

  if (selectedStatus.value !== 'all') {
    result = result.filter(room => room.status === selectedStatus.value);
  }

  if (selectedRoomType.value !== 'all') {
    result = result.filter(room => room.roomType === selectedRoomType.value);
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase();
    result = result.filter(room => 
      room.roomId.toLowerCase().includes(query) ||
      room.customer?.name?.toLowerCase().includes(query)
    );
  }

  return result;
});

// ==================== 方法 ====================

function getStatusCount(status) {
  if (status === 'all') return store.rooms.length;
  return store.rooms.filter(r => r.status === status).length;
}

function getRoomCardClass(room) {
  switch (room.status) {
    case 'available':
      return 'bg-green-900/20 ring-green-500/50 hover:ring-green-500';
    case 'occupied':
      return 'bg-cyan-900/20 ring-cyan-500/50 hover:ring-cyan-500';
    case 'cleaning':
      return 'bg-yellow-900/20 ring-yellow-500/50 hover:ring-yellow-500';
    default:
      return 'bg-slate-900/50 ring-slate-700';
  }
}

function getStatusDotClass(room) {
  switch (room.status) {
    case 'available':
      return 'bg-green-500';
    case 'occupied':
      return 'bg-cyan-500';
    case 'cleaning':
      return 'bg-yellow-500';
    default:
      return 'bg-slate-600';
  }
}

function getStatusLabel(status) {
  const labels = {
    available: '空闲可用',
    occupied: '已入住',
    cleaning: '清洁中'
  };
  return labels[status] || '未知';
}

function getStatusTextClass(room) {
  switch (room.status) {
    case 'available':
      return 'text-green-400';
    case 'occupied':
      return 'text-cyan-400';
    case 'cleaning':
      return 'text-yellow-400';
    default:
      return 'text-slate-400';
  }
}

function getRoomTypeLabel(roomType) {
  return ROOM_TYPE_CONFIG[roomType]?.label || '标准房';
}

function getRoomPrice(roomType) {
  return ROOM_TYPE_CONFIG[roomType]?.price || 128;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

async function showRoomDetail(room) {
  selectedRoom.value = room;
  detailedCustomerInfo.value = null;

  // 如果是已入住房间，调用 API 获取详细客户信息
  if (room.status === 'occupied') {
    try {
      isLoadingCustomer.value = true;
      detailedCustomerInfo.value = await store.fetchCustomerInfo(room.roomId);
    } catch (error) {
      console.error('获取客户信息失败:', error);
    } finally {
      isLoadingCustomer.value = false;
    }
  }
}
</script>