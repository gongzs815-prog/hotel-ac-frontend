<template>
  <div>
    <h2 class="text-xl font-semibold text-white mb-6 flex items-center">
      <svg class="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>
      办理结账
    </h2>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- 左侧：选择退房房间 -->
      <div class="lg:col-span-1">
        <h3 class="text-md font-medium text-slate-300 mb-3">选择退房房间</h3>
        
        <div class="bg-slate-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div v-if="store.occupiedRooms.length === 0" class="text-center py-8 text-slate-500">
            暂无已入住房间
          </div>
          <div v-else class="space-y-2">
            <button
              v-for="room in store.occupiedRooms"
              :key="room.roomId"
              @click="handleSelectRoom(room)"
              :class="[
                'w-full p-3 rounded-lg text-left transition',
                'ring-1',
                selectedRoomId === room.roomId
                  ? 'bg-cyan-600/20 ring-cyan-500 text-white'
                  : 'bg-slate-800 ring-slate-700 text-slate-300 hover:bg-slate-700'
              ]"
            >
              <div class="flex justify-between items-center">
                <span class="font-bold">{{ room.roomId }}</span>
                <span class="text-xs text-slate-400">{{ room.customer?.name || '未知' }}</span>
              </div>
              <div class="text-xs text-slate-500 mt-1">
                入住时间: {{ formatDate(room.customer?.checkInTime) }}
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：账单信息 -->
      <div class="lg:col-span-2">
        
        <!-- 未选择房间提示 -->
        <div v-if="!selectedRoomId" class="text-center py-16 text-slate-500">
          <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <p>请选择要退房的房间</p>
        </div>

        <!-- 账单内容 -->
        <div v-else>
          
          <!-- 客户信息 -->
          <div class="bg-slate-900/50 rounded-lg p-4 mb-4">
            <h3 class="text-md font-medium text-slate-300 mb-3">客户信息</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-slate-500">客户姓名：</span>
                <span class="text-white">{{ customerInfo?.name || '--' }}</span>
              </div>
              <div>
                <span class="text-slate-500">联系电话：</span>
                <span class="text-white">{{ customerInfo?.phone || '--' }}</span>
              </div>
              <div>
                <span class="text-slate-500">入住时间：</span>
                <span class="text-white">{{ formatDateTime(customerInfo?.checkInTime) }}</span>
              </div>
              <div>
                <span class="text-slate-500">退房时间：</span>
                <span class="text-white">{{ formatDateTime(new Date()) }}</span>
              </div>
            </div>
          </div>

          <!-- 费用明细 -->
          <div class="bg-slate-900/50 rounded-lg p-4 mb-4">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-md font-medium text-slate-300">费用明细</h3>
              <button
                v-if="!billGenerated"
                @click="handleGenerateBill"
                :disabled="isLoading"
                class="px-3 py-1 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition disabled:opacity-50"
              >
                生成账单
              </button>
            </div>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="text-center py-8">
              <svg class="animate-spin h-8 w-8 mx-auto text-cyan-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p class="mt-2 text-slate-500">正在生成账单...</p>
            </div>

            <!-- 账单内容 -->
            <div v-else-if="billGenerated" class="space-y-3">
              <div class="flex justify-between py-2 border-b border-slate-700">
                <span class="text-slate-400">住宿费用</span>
                <span class="text-white">
                  ¥{{ store.currentBill?.accommodationFee?.toFixed(2) || '0.00' }}
                  <span class="text-xs text-slate-500 ml-1">({{ store.currentBill?.duration || 0 }}天)</span>
                </span>
              </div>
              <div class="flex justify-between py-2 border-b border-slate-700">
                <span class="text-slate-400">空调费用</span>
                <span class="text-white">¥{{ store.currentBill?.acFee?.toFixed(2) || '0.00' }}</span>
              </div>
              <div class="flex justify-between py-3 text-lg font-bold">
                <span class="text-white">合计</span>
                <span class="text-green-400">¥{{ store.currentBill?.totalFee?.toFixed(2) || '0.00' }}</span>
              </div>
            </div>

            <!-- 未生成账单 -->
            <div v-else class="text-center py-8 text-slate-500">
              <p>点击"生成账单"查看费用明细</p>
            </div>
          </div>

          <!-- 查看详单按钮 -->
          <div v-if="billGenerated" class="mb-4">
            <button
              @click="showDetail = !showDetail"
              class="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg :class="['w-4 h-4 transition', showDetail ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
              {{ showDetail ? '收起详单' : '查看空调使用详单' }}
            </button>

            <!-- 详单内容 -->
            <div v-if="showDetail" class="mt-4 bg-slate-900/50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-slate-300 mb-3">空调使用详单</h4>
              
              <div v-if="store.currentBillDetails.length === 0" class="text-center py-4 text-slate-500 text-sm">
                暂无空调使用记录
              </div>
              
              <div v-else class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-slate-500 border-b border-slate-700">
                      <th class="text-left py-2">开始时间</th>
                      <th class="text-left py-2">结束时间</th>
                      <th class="text-center py-2">风速</th>
                      <th class="text-center py-2">温度</th>
                      <th class="text-right py-2">费用</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(detail, index) in store.currentBillDetails" :key="index" class="border-b border-slate-800">
                      <td class="py-2 text-slate-300">{{ formatTime(detail.startTime) }}</td>
                      <td class="py-2 text-slate-300">{{ formatTime(detail.endTime) }}</td>
                      <td class="py-2 text-center">
                        <span :class="getFanSpeedClass(detail.fanSpeed)">
                          {{ getFanSpeedLabel(detail.fanSpeed) }}
                        </span>
                      </td>
                      <td class="py-2 text-center text-cyan-400">{{ detail.targetTemp }}°C</td>
                      <td class="py-2 text-right text-green-400">¥{{ detail.fee?.toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 支付方式 & 结账按钮 -->
          <div v-if="billGenerated" class="bg-slate-900/50 rounded-lg p-4">
            <h3 class="text-md font-medium text-slate-300 mb-3">支付方式</h3>
            
            <div class="flex gap-3 mb-4">
              <button
                v-for="method in paymentMethods"
                :key="method.id"
                @click="selectedPaymentMethod = method.id"
                :class="[
                  'flex-1 py-3 rounded-lg font-medium transition ring-1',
                  selectedPaymentMethod === method.id
                    ? 'bg-cyan-600/20 ring-cyan-500 text-cyan-400'
                    : 'bg-slate-800 ring-slate-700 text-slate-400 hover:bg-slate-700'
                ]"
              >
                <span class="text-xl">{{ method.icon }}</span>
                <span class="ml-2">{{ method.label }}</span>
              </button>
            </div>

            <button
              @click="handleCheckOut"
              :disabled="isLoading"
              class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span v-if="isLoading">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </span>
              <span v-else>确认结账 (¥{{ store.currentBill?.totalFee?.toFixed(2) || '0.00' }})</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useReceptionStore } from '../../stores/receptionStore.js';

// ==================== Emits ====================
const emit = defineEmits(['success', 'error']);

// ==================== Store ====================
const store = useReceptionStore();

// ==================== 响应式状态 ====================
const selectedRoomId = ref('');
const customerInfo = ref(null);
const billGenerated = ref(false);
const showDetail = ref(false);
const isLoading = ref(false);
const selectedPaymentMethod = ref('cash');

// 支付方式
const paymentMethods = [
  { id: 'cash', label: '现金', icon: '💵' },
  { id: 'wechat', label: '微信', icon: '💚' },
  { id: 'alipay', label: '支付宝', icon: '💙' },
  { id: 'card', label: '银行卡', icon: '💳' }
];

// ==================== 方法 ====================

async function handleSelectRoom(room) {
  selectedRoomId.value = room.roomId;
  billGenerated.value = false;
  showDetail.value = false;
  store.clearSelection();

  try {
    isLoading.value = true;
    const customer = await store.fetchCustomerInfo(room.roomId);
    customerInfo.value = customer;
  } catch (error) {
    emit('error', '获取客户信息失败');
  } finally {
    isLoading.value = false;
  }
}

async function handleGenerateBill() {
  try {
    isLoading.value = true;
    await store.generateBill(selectedRoomId.value);
    await store.fetchBillDetails(selectedRoomId.value);
    billGenerated.value = true;
  } catch (error) {
    emit('error', error.message || '生成账单失败');
  } finally {
    isLoading.value = false;
  }
}

async function handleCheckOut() {
  if (!store.currentBill) {
    emit('error', '请先生成账单');
    return;
  }

  try {
    isLoading.value = true;
    const roomId = selectedRoomId.value;
    const result = await store.checkOut(
      roomId,
      store.currentBill.totalFee,
      selectedPaymentMethod.value
    );
    
    selectedRoomId.value = '';
    customerInfo.value = null;
    billGenerated.value = false;
    showDetail.value = false;
    
    emit('success', { roomId, ...result });
  } catch (error) {
    emit('error', error.message || '结账失败');
  } finally {
    isLoading.value = false;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getFanSpeedLabel(speed) {
  const labels = { Low: '低风', Mid: '中风', High: '高风' };
  return labels[speed] || speed;
}

function getFanSpeedClass(speed) {
  const classes = {
    Low: 'text-blue-400',
    Mid: 'text-yellow-400',
    High: 'text-red-400'
  };
  return classes[speed] || 'text-slate-400';
}
</script>