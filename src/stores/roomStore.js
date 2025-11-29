import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { io } from 'socket.io-client';

// ==================== 配置常量 ====================

// 后端 API 基础 URL（需要根据实际情况修改）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// WebSocket 服务器 URL
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// 温度限制配置
export const TEMP_LIMITS = {
  Cooling: { min: 18, max: 25 },
  Heating: { min: 25, max: 30 }
};

// 风速配置
export const FAN_SPEED_CONFIG = {
  Low: { label: '低风', cost: 0.02 },
  Mid: { label: '中风', cost: 0.03 },
  High: { label: '高风', cost: 0.05 }
};

// 有效的风速选项
export const VALID_FAN_SPEEDS = Object.keys(FAN_SPEED_CONFIG);

// 有效的模式
export const VALID_MODES = ['Cooling', 'Heating'];

// 服务状态
export const SERVICE_STATUS = {
  IDLE: 'idle',
  SERVING: 'serving',
  WAITING: 'waiting'
};

// ==================== Store 定义 ====================

export const useRoomStore = defineStore('room', () => {
  // ==================== State (状态数据) ====================

  // 房间基本信息
  const roomId = ref(null); // 需要通过 setRoomId() 初始化
  
  // 空调状态
  const isPowerOn = ref(false);        // 是否开机
  const currentTemp = ref(28.0);       // 当前温度（从后端接收）
  const targetTemp = ref(25.0);        // 目标温度
  const fanSpeed = ref('Mid');         // 风速：Low/Mid/High
  const mode = ref('Cooling');         // 模式：Cooling/Heating
  
  // 费用信息
  const totalFee = ref(0.0);           // 累计费用（从后端接收）
  const feeRate = ref(1.0);            // 费率（元/度）
  
  // 服务状态
  const status = ref(SERVICE_STATUS.IDLE); // 状态：idle(空闲)/serving(服务中)/waiting(等待中)
  const waitTime = ref(0);                 // 等待时间（秒）

  // WebSocket 连接
  let socket = null;
  const isConnected = ref(false);

  // ==================== 辅助方法 ====================

  /**
   * 设置房间 ID（从路由或登录信息获取）
   * @param {string} id - 房间号
   */
  function setRoomId(id) {
    roomId.value = id;
  }

  /**
   * 重置所有状态到初始值
   */
  function resetState() {
    isPowerOn.value = false;
    currentTemp.value = 28.0;
    targetTemp.value = 25.0;
    fanSpeed.value = 'Mid';
    mode.value = 'Cooling';
    totalFee.value = 0.0;
    feeRate.value = 1.0;
    status.value = SERVICE_STATUS.IDLE;
    waitTime.value = 0;
  }
  
  // ==================== WebSocket 连接管理 ====================
  
  /**
   * 连接 WebSocket
   */
  function connectWebSocket() {
    if (socket && isConnected.value) {
      console.log('WebSocket 已连接，无需重复连接');
      return;
    }
    
    try {
      socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      
      // 连接成功
      socket.on('connect', () => {
        console.log('✅ WebSocket 连接成功');
        isConnected.value = true;
        
        // 加入房间频道（接收该房间的更新）
        socket.emit('join-room', { roomId: roomId.value });
      });
      
      // 监听温度更新
      socket.on('temperature-update', (data) => {
        console.log('📊 收到温度更新:', data);
        currentTemp.value = data.currentTemp;
      });
      
      // 监听费用更新
      socket.on('fee-update', (data) => {
        console.log('💰 收到费用更新:', data);
        totalFee.value = data.totalFee;
      });
      
      // 监听状态变化
      socket.on('status-change', (data) => {
        console.log('🔄 收到状态变化:', data);
        status.value = data.status; // serving / waiting / idle
        
        if (data.status === 'waiting' && data.waitTime) {
          waitTime.value = data.waitTime;
        }
      });
      
      // 监听服务开始
      socket.on('service-started', (data) => {
        console.log('服务开始:', data);
        status.value = SERVICE_STATUS.SERVING;
      });

      // 监听服务停止
      socket.on('service-stopped', (data) => {
        console.log('服务停止:', data);
        status.value = SERVICE_STATUS.IDLE;
      });
      
      // 连接断开
      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket 断开连接:', reason);
        isConnected.value = false;
      });
      
      // 连接错误
      socket.on('connect_error', (error) => {
        console.error('⚠️ WebSocket 连接错误:', error);
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
      socket.emit('leave-room', { roomId: roomId.value });
      socket.disconnect();
      socket = null;
      isConnected.value = false;
      console.log('🔌 WebSocket 已断开');
    }
  }
  
  // ==================== API 调用 ====================

  /**
   * 开机/关机
   * @returns {Promise<void>}
   * @throws {Error} 当操作失败时
   */
  async function togglePower() {
    try {
      if (!isPowerOn.value) {
        // ========== 开机 ==========
        console.log('🟢 请求开机...');
        
        const response = await axios.post(`${API_BASE_URL}/ac/request-service`, {
          roomId: roomId.value,
          currentTemp: currentTemp.value
        });
        
        // 更新状态
        if (response.data.success) {
          isPowerOn.value = true;
          mode.value = response.data.mode || 'Cooling';
          targetTemp.value = response.data.targetTemp || 25.0;
          fanSpeed.value = response.data.fanSpeed || 'Mid';
          feeRate.value = response.data.feeRate || 1.0;
          status.value = response.data.status || 'serving'; // serving 或 waiting
          
          // 如果在等待队列
          if (response.data.status === 'waiting') {
            waitTime.value = response.data.waitTime || 0;
          }
          
          console.log('✅ 开机成功:', response.data);
        } else {
          throw new Error(response.data.message || '开机失败');
        }
        
      } else {
        // ========== 关机 ==========
        console.log('请求关机...');

        const response = await axios.post(`${API_BASE_URL}/ac/stop-service`, {
          roomId: roomId.value
        });

        if (response.data.success) {
          // 关机后重置状态
          isPowerOn.value = false;
          status.value = SERVICE_STATUS.IDLE;
          waitTime.value = 0; // 重置等待时间

          console.log('关机成功:', response.data);
        } else {
          throw new Error(response.data.message || '关机失败');
        }
      }
      
    } catch (error) {
      console.error('❌ 开关机操作失败:', error);
      
      // 抛出错误供组件捕获并显示
      if (error.response) {
        // 服务器返回错误
        throw new Error(error.response.data.message || '操作失败');
      } else if (error.request) {
        // 请求发送但没有收到响应
        throw new Error('服务器无响应，请检查网络连接');
      } else {
        // 其他错误
        throw new Error(error.message || '未知错误');
      }
    }
  }
  
  /**
   * 设置目标温度
   * @param {number} temp - 目标温度值
   * @returns {Promise<void>}
   * @throws {Error} 当温度超出范围或请求失败时
   */
  async function setTargetTemp(temp) {
    // ========== 前端基本校验 ==========
    const limits = TEMP_LIMITS[mode.value];
    if (!limits) {
      throw new Error(`未知的模式: ${mode.value}`);
    }

    if (temp < limits.min || temp > limits.max) {
      throw new Error(`${mode.value === 'Cooling' ? '制冷' : '制热'}模式下，目标温度必须在 ${limits.min}-${limits.max}°C 之间`);
    }

    try {
      console.log(`设置目标温度: ${temp}°C`);

      const response = await axios.post(`${API_BASE_URL}/ac/set-temperature`, {
        roomId: roomId.value,
        targetTemp: temp
      });
      
      if (response.data.success) {
        // 成功后更新本地状态
        targetTemp.value = temp;
        console.log('✅ 温度设置成功');
      } else {
        throw new Error(response.data.message || '温度设置失败');
      }
      
    } catch (error) {
      console.error('❌ 设置温度失败:', error);
      
      if (error.response) {
        throw new Error(error.response.data.message || '温度设置失败');
      } else if (error.request) {
        throw new Error('服务器无响应，请检查网络连接');
      } else {
        throw error; // 前端校验的错误直接抛出
      }
    }
  }
  
  /**
   * 设置风速
   * @param {string} speed - 风速值 (Low/Mid/High)
   * @returns {Promise<void>}
   * @throws {Error} 当风速无效或请求失败时
   */
  async function setFanSpeed(speed) {
    // ========== 前端基本校验 ==========
    if (!VALID_FAN_SPEEDS.includes(speed)) {
      throw new Error(`无效的风速设置: ${speed}，有效值为: ${VALID_FAN_SPEEDS.join(', ')}`);
    }

    try {
      console.log(`设置风速: ${speed}`);

      const response = await axios.post(`${API_BASE_URL}/ac/set-fan-speed`, {
        roomId: roomId.value,
        fanSpeed: speed
      });
      
      if (response.data.success) {
        // 成功后更新本地状态
        fanSpeed.value = speed;
        console.log('✅ 风速设置成功');
        
        // 如果触发了优先级调度，后端会通过 WebSocket 推送新状态
        if (response.data.statusChanged) {
          status.value = response.data.newStatus;
          
          if (response.data.newStatus === 'waiting') {
            waitTime.value = response.data.waitTime || 0;
          }
        }
      } else {
        throw new Error(response.data.message || '风速设置失败');
      }
      
    } catch (error) {
      console.error('❌ 设置风速失败:', error);
      
      if (error.response) {
        throw new Error(error.response.data.message || '风速设置失败');
      } else if (error.request) {
        throw new Error('服务器无响应，请检查网络连接');
      } else {
        throw error;
      }
    }
  }
  
  /**
   * 查询当前费用（可选，如果 WebSocket 实时推送就不需要主动查询）
   * @returns {Promise<Object|undefined>} 费用数据
   */
  async function queryCurrentFee() {
    try {
      const response = await axios.get(`${API_BASE_URL}/ac/query-fee/${roomId.value}`);
      
      if (response.data.success) {
        totalFee.value = response.data.totalFee || 0;
        return response.data;
      }
    } catch (error) {
      console.error('❌ 查询费用失败:', error);
    }
  }
  
  /**
   * 初始化房间数据（页面加载时调用）
   * @returns {Promise<void>}
   */
  async function initRoomData() {
    try {
      console.log('🔄 初始化房间数据...');
      
      const response = await axios.get(`${API_BASE_URL}/ac/room-status/${roomId.value}`);
      
      if (response.data.success) {
        const data = response.data;
        
        // 更新所有状态
        isPowerOn.value = data.isPowerOn || false;
        currentTemp.value = data.currentTemp || 28.0;
        targetTemp.value = data.targetTemp || 25.0;
        fanSpeed.value = data.fanSpeed || 'Mid';
        mode.value = data.mode || 'Cooling';
        totalFee.value = data.totalFee || 0.0;
        feeRate.value = data.feeRate || 1.0;
        status.value = data.status || 'idle';
        
        if (data.status === 'waiting') {
          waitTime.value = data.waitTime || 0;
        }
        
        console.log('✅ 房间数据初始化成功:', data);
      }
      
    } catch (error) {
      console.error('❌ 初始化房间数据失败:', error);
      // 初始化失败不阻断页面加载，使用默认值
    }
  }
  
  // ==================== 导出 ====================

  return {
    // State
    roomId,
    isPowerOn,
    currentTemp,
    targetTemp,
    fanSpeed,
    mode,
    totalFee,
    feeRate,
    status,
    waitTime,
    isConnected,

    // Actions
    setRoomId,
    resetState,
    connectWebSocket,
    disconnectWebSocket,
    togglePower,
    setTargetTemp,
    setFanSpeed,
    queryCurrentFee,
    initRoomData
  };
});