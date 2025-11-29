import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { io } from 'socket.io-client';

// ==================== 配置常量 ====================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// 服务状态
export const SERVICE_STATUS = {
  IDLE: 'idle',
  SERVING: 'serving',
  WAITING: 'waiting'
};

// 中央空调模式
export const AC_MODE = {
  COOLING: 'Cooling',
  HEATING: 'Heating'
};

// 风速配置（与用户端保持一致）
export const FAN_SPEED_CONFIG = {
  Low: { label: '低风', cost: 0.02 },
  Mid: { label: '中风', cost: 0.03 },
  High: { label: '高风', cost: 0.05 }
};

// ==================== Store 定义 ====================

export const useAdminStore = defineStore('admin', () => {
  // ==================== State ====================

  // 中央空调状态
  const centralACStatus = ref({
    isRunning: false,       // 是否运行中
    mode: AC_MODE.COOLING,  // 模式：Cooling/Heating
    maxServing: 30,         // 最大服务数
    currentServing: 0       // 当前服务数
  });

  // 所有房间状态 (Map: roomId -> roomData)
  const rooms = ref({});

  // 服务队列
  const serviceQueue = ref([]);

  // 等待队列
  const waitingQueue = ref([]);

  // WebSocket 连接
  let socket = null;
  const isConnected = ref(false);

  // 加载状态
  const isLoading = ref(false);

  // ==================== Computed ====================

  // 房间列表（数组形式，方便遍历）
  const roomList = computed(() => {
    return Object.values(rooms.value).sort((a, b) => {
      // 按房间号排序
      return parseInt(a.roomId) - parseInt(b.roomId);
    });
  });

  // 开机房间数量
  const activeRoomCount = computed(() => {
    return roomList.value.filter(room => room.isPowerOn).length;
  });

  // 服务中房间数量
  const servingRoomCount = computed(() => {
    return serviceQueue.value.length;
  });

  // 等待中房间数量
  const waitingRoomCount = computed(() => {
    return waitingQueue.value.length;
  });

  // ==================== WebSocket 连接管理 ====================

  /**
   * 连接 WebSocket（管理员频道）
   */
  function connectWebSocket() {
    if (socket && isConnected.value) {
      console.log('WebSocket 已连接');
      return;
    }

    try {
      socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      socket.on('connect', () => {
        console.log('✅ [管理员] WebSocket 连接成功');
        isConnected.value = true;

        // 加入管理员频道
        socket.emit('join-admin');
      });

      // 监听所有房间的温度更新
      socket.on('temperature-update', (data) => {
        if (rooms.value[data.roomId]) {
          rooms.value[data.roomId].currentTemp = data.currentTemp;
        }
      });

      // 监听费用更新
      socket.on('fee-update', (data) => {
        if (rooms.value[data.roomId]) {
          rooms.value[data.roomId].totalFee = data.totalFee;
        }
      });

      // 监听状态变化
      socket.on('status-change', (data) => {
        if (rooms.value[data.roomId]) {
          rooms.value[data.roomId].status = data.status;
          if (data.waitTime !== undefined) {
            rooms.value[data.roomId].waitTime = data.waitTime;
          }
        }
        // 刷新队列
        fetchQueues();
      });

      // 监听服务开始
      socket.on('service-started', (data) => {
        if (rooms.value[data.roomId]) {
          rooms.value[data.roomId].status = SERVICE_STATUS.SERVING;
        }
        fetchQueues();
      });

      // 监听服务停止
      socket.on('service-stopped', (data) => {
        if (rooms.value[data.roomId]) {
          rooms.value[data.roomId].status = SERVICE_STATUS.IDLE;
          rooms.value[data.roomId].isPowerOn = false;
        }
        fetchQueues();
      });

      // 监听房间开机
      socket.on('room-power-on', (data) => {
        if (rooms.value[data.roomId]) {
          rooms.value[data.roomId].isPowerOn = true;
          rooms.value[data.roomId].status = data.status || SERVICE_STATUS.SERVING;
        }
        fetchQueues();
      });

      // 监听房间关机
      socket.on('room-power-off', (data) => {
        if (rooms.value[data.roomId]) {
          rooms.value[data.roomId].isPowerOn = false;
          rooms.value[data.roomId].status = SERVICE_STATUS.IDLE;
        }
        fetchQueues();
      });

      // 监听队列更新
      socket.on('queue-update', (data) => {
        if (data.serviceQueue) {
          serviceQueue.value = data.serviceQueue;
        }
        if (data.waitingQueue) {
          waitingQueue.value = data.waitingQueue;
        }
      });

      // 监听中央空调状态变化
      socket.on('central-ac-status', (data) => {
        centralACStatus.value = { ...centralACStatus.value, ...data };
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ [管理员] WebSocket 断开:', reason);
        isConnected.value = false;
      });

      socket.on('connect_error', (error) => {
        console.error('⚠️ [管理员] WebSocket 错误:', error);
        isConnected.value = false;
      });

    } catch (error) {
      console.error('❌ WebSocket 初始化失败:', error);
    }
  }

  /**
   * 断开 WebSocket
   */
  function disconnectWebSocket() {
    if (socket) {
      socket.emit('leave-admin');
      socket.disconnect();
      socket = null;
      isConnected.value = false;
      console.log('🔌 [管理员] WebSocket 已断开');
    }
  }

  // ==================== API 调用 ====================

  /**
   * 获取所有房间状态
   */
  async function fetchAllRooms() {
    try {
      isLoading.value = true;
      const response = await axios.get(`${API_BASE_URL}/admin/rooms`);

      if (response.data.success) {
        // 转换为对象形式
        const roomsData = {};
        response.data.rooms.forEach(room => {
          roomsData[room.roomId] = room;
        });
        rooms.value = roomsData;
        console.log('✅ 获取房间列表成功:', response.data.rooms.length, '个房间');
      }
    } catch (error) {
      console.error('❌ 获取房间列表失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取中央空调状态
   */
  async function fetchCentralACStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/central-ac/status`);

      if (response.data.success) {
        centralACStatus.value = {
          isRunning: response.data.isRunning,
          mode: response.data.mode || AC_MODE.COOLING,
          maxServing: response.data.maxServing || 30,
          currentServing: response.data.currentServing || 0
        };
        console.log('✅ 获取中央空调状态成功');
      }
    } catch (error) {
      console.error('❌ 获取中央空调状态失败:', error);
      throw error;
    }
  }

  /**
   * 启动中央空调
   * @param {string} mode - 模式：'Cooling' 或 'Heating'
   */
  async function startCentralAC(mode = AC_MODE.COOLING) {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/central-ac/start`, {
        mode: mode
      });

      if (response.data.success) {
        centralACStatus.value.isRunning = true;
        centralACStatus.value.mode = mode;
        console.log('✅ 中央空调已启动，模式:', mode);
        return true;
      } else {
        throw new Error(response.data.message || '启动失败');
      }
    } catch (error) {
      console.error('❌ 启动中央空调失败:', error);
      throw error;
    }
  }

  /**
   * 关闭中央空调
   */
  async function stopCentralAC() {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/central-ac/stop`);

      if (response.data.success) {
        centralACStatus.value.isRunning = false;
        console.log('✅ 中央空调已关闭');
        return true;
      } else {
        throw new Error(response.data.message || '关闭失败');
      }
    } catch (error) {
      console.error('❌ 关闭中央空调失败:', error);
      throw error;
    }
  }

  /**
   * 获取服务队列和等待队列
   */
  async function fetchQueues() {
    try {
      const [serviceRes, waitingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/service-queue`),
        axios.get(`${API_BASE_URL}/admin/waiting-queue`)
      ]);

      if (serviceRes.data.success) {
        serviceQueue.value = serviceRes.data.queue || [];
      }

      if (waitingRes.data.success) {
        waitingQueue.value = waitingRes.data.queue || [];
      }

      console.log('✅ 队列数据已更新');
    } catch (error) {
      console.error('❌ 获取队列失败:', error);
    }
  }

  /**
   * 初始化管理员数据
   */
  async function initAdminData() {
    try {
      isLoading.value = true;
      console.log('🔄 初始化管理员数据...');

      await Promise.all([
        fetchCentralACStatus(),
        fetchAllRooms(),
        fetchQueues()
      ]);

      console.log('✅ 管理员数据初始化完成');
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
    centralACStatus,
    rooms,
    serviceQueue,
    waitingQueue,
    isConnected,
    isLoading,

    // Computed
    roomList,
    activeRoomCount,
    servingRoomCount,
    waitingRoomCount,

    // Actions
    connectWebSocket,
    disconnectWebSocket,
    fetchAllRooms,
    fetchCentralACStatus,
    startCentralAC,
    stopCentralAC,
    fetchQueues,
    initAdminData
  };
});