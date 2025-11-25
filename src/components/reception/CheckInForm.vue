<template>
  <div>
    <h2 class="text-xl font-semibold text-white mb-6 flex items-center">
      <svg class="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
      </svg>
      办理入住
    </h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- 左侧：客户信息表单 -->
      <div class="space-y-4">
        <h3 class="text-md font-medium text-slate-300 mb-3">客户信息</h3>
        
        <!-- 客户姓名 -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1">
            客户姓名 <span class="text-red-400">*</span>
          </label>
          <input
            v-model="form.customerName"
            type="text"
            placeholder="请输入客户姓名"
            class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <!-- 身份证号 -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1">
            身份证号 <span class="text-red-400">*</span>
          </label>
          <input
            v-model="form.idCard"
            type="text"
            placeholder="请输入身份证号"
            maxlength="18"
            class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <!-- 联系电话 -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1">
            联系电话 <span class="text-red-400">*</span>
          </label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="请输入联系电话"
            maxlength="11"
            class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <!-- 入住日期 -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">
              入住日期 <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.checkInDate"
              type="date"
              class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">
              预计退房
            </label>
            <input
              v-model="form.checkOutDate"
              type="date"
              class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <!-- 右侧：房间选择 -->
      <div>
        <h3 class="text-md font-medium text-slate-300 mb-3">选择房间</h3>
        
        <!-- 房型筛选 -->
        <div class="flex gap-2 mb-4">
          <button
            v-for="type in roomTypes"
            :key="type.id"
            @click="selectedRoomType = type.id"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition',
              selectedRoomType === type.id
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            ]"
          >
            {{ type.label }}
          </button>
        </div>

        <!-- 房间网格 -->
        <div class="bg-slate-900/50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <div v-if="filteredRooms.length === 0" class="text-center py-8 text-slate-500">
            暂无可用房间
          </div>
          <div v-else class="grid grid-cols-5 gap-2">
            <button
              v-for="room in filteredRooms"
              :key="room.roomId"
              @click="selectRoom(room)"
              :class="[
                'p-3 rounded-lg text-center transition',
                'ring-1',
                form.roomId === room.roomId
                  ? 'bg-cyan-600 ring-cyan-500 text-white'
                  : 'bg-slate-800 ring-slate-700 text-slate-300 hover:bg-slate-700'
              ]"
            >
              <div class="font-bold text-sm">{{ room.roomId }}</div>
              <div class="text-xs mt-1 opacity-70">¥{{ getRoomPrice(room.roomType) }}</div>
            </button>
          </div>
        </div>

        <!-- 已选房间信息 -->
        <div v-if="form.roomId" class="mt-4 p-4 bg-cyan-900/30 rounded-lg ring-1 ring-cyan-500/50">
          <div class="flex justify-between items-center">
            <div>
              <span class="text-slate-400">已选房间：</span>
              <span class="text-white font-bold text-lg">{{ form.roomId }}</span>
            </div>
            <div>
              <span class="text-slate-400">房型：</span>
              <span class="text-cyan-400">{{ getRoomTypeLabel(selectedRoomInfo?.roomType) }}</span>
            </div>
            <div>
              <span class="text-slate-400">房价：</span>
              <span class="text-green-400 font-bold">¥{{ getRoomPrice(selectedRoomInfo?.roomType) }}/晚</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 提交按钮 -->
    <div class="mt-8 flex justify-end gap-4">
      <button
        @click="resetForm"
        class="px-6 py-2 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
      >
        重置
      </button>
      <button
        @click="handleSubmit"
        :disabled="!isFormValid || isSubmitting"
        :class="[
          'px-8 py-2 rounded-lg font-semibold text-white transition',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-500/50'
        ]"
      >
        <span v-if="isSubmitting" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          处理中...
        </span>
        <span v-else>确认入住</span>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useReceptionStore, ROOM_TYPE_CONFIG } from '../../stores/receptionStore.js';

// ==================== Emits ====================
const emit = defineEmits(['success', 'error']);

// ==================== Store ====================
const store = useReceptionStore();

// ==================== 响应式状态 ====================
const isSubmitting = ref(false);
const selectedRoomType = ref('all');

// 表单数据
const form = ref({
  customerName: '',
  idCard: '',
  phone: '',
  checkInDate: new Date().toISOString().split('T')[0],
  checkOutDate: '',
  roomId: ''
});

// 房型选项
const roomTypes = [
  { id: 'all', label: '全部' },
  { id: 'single', label: '单人房' },
  { id: 'double', label: '双人房' },
  { id: 'king', label: '大床房' }
];

// ==================== Computed ====================

// 筛选后的可用房间
const filteredRooms = computed(() => {
  if (selectedRoomType.value === 'all') {
    return store.availableRooms;
  }
  return store.availableRooms.filter(room => room.roomType === selectedRoomType.value);
});

// 已选房间信息
const selectedRoomInfo = computed(() => {
  return store.availableRooms.find(r => r.roomId === form.value.roomId);
});

// 表单验证
const isFormValid = computed(() => {
  return form.value.customerName.trim() !== '' &&
         form.value.idCard.trim().length === 18 &&
         form.value.phone.trim().length === 11 &&
         form.value.checkInDate !== '' &&
         form.value.roomId !== '';
});

// ==================== 方法 ====================

function getRoomPrice(roomType) {
  return ROOM_TYPE_CONFIG[roomType]?.price || 128;
}

function getRoomTypeLabel(roomType) {
  return ROOM_TYPE_CONFIG[roomType]?.label || '标准房';
}

function selectRoom(room) {
  form.value.roomId = room.roomId;
}

function resetForm() {
  form.value = {
    customerName: '',
    idCard: '',
    phone: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
    roomId: ''
  };
}

async function handleSubmit() {
  if (!isFormValid.value) {
    emit('error', '请填写完整的入住信息');
    return;
  }

  isSubmitting.value = true;

  try {
    const result = await store.checkIn(form.value);
    emit('success', result);
    resetForm();
  } catch (error) {
    emit('error', error.message || '入住办理失败');
  } finally {
    isSubmitting.value = false;
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  form.value.checkOutDate = tomorrow.toISOString().split('T')[0];
});
</script>