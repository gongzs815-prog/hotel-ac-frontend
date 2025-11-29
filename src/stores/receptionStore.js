import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

// ==================== 配置常量 ====================

// 🔧 测试模式开关：设为 true 使用 Mock 数据，false 使用真实后端
const USE_MOCK_DATA = true;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// 房间状态
export const ROOM_STATUS = {
  AVAILABLE: 'available',   // 空闲可入住
  OCCUPIED: 'occupied',     // 已入住
  CLEANING: 'cleaning'      // 清洁中
};

// 房型配置（价格等）
export const ROOM_TYPE_CONFIG = {
  single: { label: '标准单人房', price: 128 },
  double: { label: '标准双人房', price: 168 },
  king: { label: '大床房', price: 198 }
};

// ==================== Store 定义 ====================

export const useReceptionStore = defineStore('reception', () => {
  // ==================== State ====================

  // 所有房间列表
  const rooms = ref([]);

  // 当前选中的房间
  const selectedRoom = ref(null);

  // 当前客户信息（入住/结账时使用）
  const currentCustomer = ref(null);

  // 当前账单
  const currentBill = ref(null);

  // 当前详单
  const currentBillDetails = ref([]);

  // 加载状态
  const isLoading = ref(false);

  // ==================== Computed ====================

  // 可用房间列表
  const availableRooms = computed(() => {
    return rooms.value.filter(room => room.status === ROOM_STATUS.AVAILABLE);
  });

  // 已入住房间列表
  const occupiedRooms = computed(() => {
    return rooms.value.filter(room => room.status === ROOM_STATUS.OCCUPIED);
  });

  // 按房型分组的可用房间
  const availableRoomsByType = computed(() => {
    const grouped = {
      single: [],
      double: [],
      king: []
    };
    availableRooms.value.forEach(room => {
      if (grouped[room.roomType]) {
        grouped[room.roomType].push(room);
      }
    });
    return grouped;
  });

  // 统计数据
  const statistics = computed(() => {
    return {
      total: rooms.value.length,
      available: availableRooms.value.length,
      occupied: occupiedRooms.value.length
    };
  });

  // ==================== API 调用 ====================

  /**
   * 获取所有房间列表
   */
  async function fetchAllRooms() {
    try {
      isLoading.value = true;

      // 🎭 Mock 数据模式
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
        rooms.value = [
          { roomId: '301', status: 'available', roomType: 'single' },
          { roomId: '302', status: 'available', roomType: 'single' },
          { roomId: '303', status: 'occupied', roomType: 'double', customer: { name: '张三', phone: '13800138000', checkInTime: '2025-11-23T10:30:00Z' } },
          { roomId: '304', status: 'available', roomType: 'double' },
          { roomId: '305', status: 'cleaning', roomType: 'king' },
          { roomId: '401', status: 'available', roomType: 'king' },
          { roomId: '402', status: 'occupied', roomType: 'single', customer: { name: '李四', phone: '13900139000', checkInTime: '2025-11-22T14:20:00Z' } },
          { roomId: '403', status: 'available', roomType: 'double' },
          { roomId: '404', status: 'occupied', roomType: 'king', customer: { name: '王五', phone: '13700137000', checkInTime: '2025-11-24T08:15:00Z' } },
          { roomId: '405', status: 'available', roomType: 'single' }
        ];
        console.log('✅ [Mock] 获取房间列表成功:', rooms.value.length, '个房间');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/reception/rooms`);

      if (response.data.success) {
        rooms.value = response.data.rooms;
        console.log('✅ 获取房间列表成功:', rooms.value.length, '个房间');
      }
    } catch (error) {
      console.error('❌ 获取房间列表失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 查询可用房间
   */
  async function fetchAvailableRooms(params = {}) {
    try {
      isLoading.value = true;
      console.log('🔍 查询可用房间:', params);

      // 🎭 Mock 数据模式
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));

        // 过滤可用房间
        let filtered = rooms.value.filter(room => room.status === ROOM_STATUS.AVAILABLE);

        // 按房型过滤
        if (params.roomType && params.roomType !== 'all') {
          filtered = filtered.filter(room => room.roomType === params.roomType);
        }

        console.log('✅ [Mock] 查询到', filtered.length, '个可用房间');
        return filtered;
      }

      const response = await axios.get(`${API_BASE_URL}/reception/available-rooms`, {
        params
      });

      if (response.data.success) {
        console.log('✅ 查询到', response.data.rooms.length, '个可用房间');
        return response.data.rooms;
      }
      return [];
    } catch (error) {
      console.error('❌ 查询可用房间失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 办理入住
   */
  async function checkIn(checkInData) {
    try {
      isLoading.value = true;
      console.log('📝 办理入住:', checkInData);

      // 🎭 Mock 数据模式
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 800));

        // 更新本地房间状态
        const roomIndex = rooms.value.findIndex(r => r.roomId === checkInData.roomId);
        if (roomIndex !== -1) {
          rooms.value[roomIndex].status = ROOM_STATUS.OCCUPIED;
          rooms.value[roomIndex].customer = {
            name: checkInData.customerName,
            phone: checkInData.phone,
            checkInTime: new Date().toISOString()
          };
        }

        console.log('✅ [Mock] 入住办理成功');
        return {
          success: true,
          roomId: checkInData.roomId,
          customerId: 'CUST' + Date.now(),
          roomCardData: { cardNumber: checkInData.roomId + '-CARD' }
        };
      }

      const response = await axios.post(`${API_BASE_URL}/reception/check-in`, checkInData);

      if (response.data.success) {
        console.log('✅ 入住办理成功');

        // 更新本地房间状态
        const roomIndex = rooms.value.findIndex(r => r.roomId === checkInData.roomId);
        if (roomIndex !== -1) {
          rooms.value[roomIndex].status = ROOM_STATUS.OCCUPIED;
          rooms.value[roomIndex].customer = {
            name: checkInData.customerName,
            phone: checkInData.phone,
            checkInTime: new Date().toISOString()
          };
        }

        return {
          success: true,
          roomId: checkInData.roomId,
          customerId: response.data.customerId,
          roomCardData: response.data.roomCardData
        };
      } else {
        throw new Error(response.data.message || '入住办理失败');
      }
    } catch (error) {
      console.error('❌ 入住办理失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 查询房间客户信息
   */
  async function fetchCustomerInfo(roomId) {
    try {
      isLoading.value = true;
      console.log('🔍 查询房间客户信息:', roomId);

      // 🎭 Mock 数据模式
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));

        const room = rooms.value.find(r => r.roomId === roomId);
        if (room && room.status === ROOM_STATUS.OCCUPIED && room.customer) {
          // 模拟完整的客户信息
          const customerInfo = {
            customerId: 'C' + roomId + Date.now().toString().slice(-6),
            name: room.customer.name,
            idCard: '110101199001011234', // Mock 身份证
            phone: room.customer.phone,
            checkInTime: room.customer.checkInTime,
            expectedCheckOutTime: new Date(new Date(room.customer.checkInTime).getTime() + 24 * 60 * 60 * 1000).toISOString()
          };
          currentCustomer.value = customerInfo;
          console.log('✅ [Mock] 查询到客户信息:', customerInfo);
          return customerInfo;
        }

        console.log('⚠️ [Mock] 该房间无客户信息');
        return null;
      }

      const response = await axios.get(`${API_BASE_URL}/reception/customer/${roomId}`);

      if (response.data.success) {
        currentCustomer.value = response.data.customer;
        console.log('✅ 查询到客户信息');
        return response.data.customer;
      }
      return null;
    } catch (error) {
      console.error('❌ 查询客户信息失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 生成账单
   */
  async function generateBill(roomId) {
    try {
      isLoading.value = true;
      console.log('📄 生成账单:', roomId);

      const response = await axios.post(`${API_BASE_URL}/reception/generate-bill`, {
        roomId
      });

      if (response.data.success) {
        currentBill.value = {
          roomId: roomId,
          accommodationFee: response.data.accommodationFee,
          acFee: response.data.acFee,
          totalFee: response.data.totalFee,
          checkInTime: response.data.checkInTime,
          checkOutTime: response.data.checkOutTime,
          duration: response.data.duration,
          generatedAt: new Date().toISOString()
        };
        console.log('✅ 账单生成成功:', currentBill.value);
        return currentBill.value;
      } else {
        throw new Error(response.data.message || '账单生成失败');
      }
    } catch (error) {
      console.error('❌ 账单生成失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取空调使用详单
   */
  async function fetchBillDetails(roomId) {
    try {
      isLoading.value = true;
      console.log('📋 获取详单:', roomId);

      const response = await axios.get(`${API_BASE_URL}/reception/bill-detail/${roomId}`);

      if (response.data.success) {
        currentBillDetails.value = response.data.details || [];
        console.log('✅ 详单获取成功:', currentBillDetails.value.length, '条记录');
        return currentBillDetails.value;
      }
      return [];
    } catch (error) {
      console.error('❌ 获取详单失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 完成结账
   */
  async function checkOut(roomId, amountPaid, paymentMethod = 'cash') {
    try {
      isLoading.value = true;
      console.log('💰 办理结账:', roomId, amountPaid, paymentMethod);

      const response = await axios.post(`${API_BASE_URL}/reception/check-out`, {
        roomId,
        amountPaid,
        paymentMethod
      });

      if (response.data.success) {
        console.log('✅ 结账成功');

        // 更新本地房间状态
        const roomIndex = rooms.value.findIndex(r => r.roomId === roomId);
        if (roomIndex !== -1) {
          rooms.value[roomIndex].status = ROOM_STATUS.AVAILABLE;
          rooms.value[roomIndex].customer = null;
        }

        // 清空当前账单和客户信息
        currentBill.value = null;
        currentBillDetails.value = [];
        currentCustomer.value = null;

        return {
          success: true,
          transactionId: response.data.transactionId,
          receipt: response.data.receipt
        };
      } else {
        throw new Error(response.data.message || '结账失败');
      }
    } catch (error) {
      console.error('❌ 结账失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 选择房间
   */
  function selectRoom(room) {
    selectedRoom.value = room;
  }

  /**
   * 清空选择
   */
  function clearSelection() {
    selectedRoom.value = null;
    currentCustomer.value = null;
    currentBill.value = null;
    currentBillDetails.value = [];
  }

  /**
   * 初始化前台数据
   */
  async function initReceptionData() {
    try {
      isLoading.value = true;
      console.log('🔄 初始化前台数据...');
      await fetchAllRooms();
      console.log('✅ 前台数据初始化完成');
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  // ==================== 导出 ====================

  return {
    // State
    rooms,
    selectedRoom,
    currentCustomer,
    currentBill,
    currentBillDetails,
    isLoading,

    // Computed
    availableRooms,
    occupiedRooms,
    availableRoomsByType,
    statistics,

    // Actions
    fetchAllRooms,
    fetchAvailableRooms,
    checkIn,
    fetchCustomerInfo,
    generateBill,
    fetchBillDetails,
    checkOut,
    selectRoom,
    clearSelection,
    initReceptionData
  };
});