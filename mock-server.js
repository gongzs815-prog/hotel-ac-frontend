/**
 * 酒店空调管理系统 Mock Server
 * 支持四个模块：客户端、管理员端、前台营业员端、酒店经理端
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ==================== 中间件配置 ====================
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== 数据模型 ====================

// 房间类型配置
const ROOM_TYPES = {
  single: { label: '单人房', price: 128 },
  double: { label: '双人房', price: 168 },
  king: { label: '大床房', price: 198 }
};

// 风速配置
const FAN_SPEEDS = {
  Low: { label: '低风', power: 0.8, feeRate: 0.5 },
  Mid: { label: '中风', power: 1.0, feeRate: 0.8 },
  High: { label: '高风', power: 1.2, feeRate: 1.0 }
};

// 中央空调状态
const centralAC = {
  isRunning: true,
  mode: 'Cooling', // Cooling 或 Heating
  maxServing: 30,
  currentServing: 0
};

// 生成 50 个房间（301-350）
const rooms = {};
const roomHistory = {}; // 用于存储历史能耗数据

for (let i = 301; i <= 350; i++) {
  const roomId = String(i);
  const roomType = i % 3 === 0 ? 'king' : i % 2 === 0 ? 'double' : 'single';

  rooms[roomId] = {
    roomId,
    roomType,
    status: 'available', // available, occupied, cleaning
    customer: null,

    // 空调状态
    isPowerOn: false,
    currentTemp: 28.0,
    targetTemp: 25.0,
    fanSpeed: 'Mid',
    mode: 'Cooling',
    totalFee: 0,
    feeRate: 1.0,
    serviceStatus: 'idle', // idle, serving, waiting
    waitTime: 0,
    startTime: null,

    // 统计数据
    totalDuration: 0, // 总使用时长（分钟）
    totalEnergy: 0, // 总能耗（kWh）
    sessionCount: 0 // 使用次数
  };

  // 初始化历史数据（最近7天）
  roomHistory[roomId] = [];
  for (let day = 6; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];

    roomHistory[roomId].push({
      date: dateStr,
      duration: Math.floor(Math.random() * 300 + 100), // 100-400分钟
      energy: Math.random() * 10 + 2, // 2-12 kWh
      fee: 0,
      details: []
    });
  }
}

// 服务队列和等待队列
const serviceQueue = [];
const waitingQueue = [];

// ==================== 辅助函数 ====================

function getAvailableRooms() {
  return Object.values(rooms).filter(r => r.status === 'available');
}

function getOccupiedRooms() {
  return Object.values(rooms).filter(r => r.status === 'occupied');
}

function calculateRoomStats() {
  const stats = {
    total: Object.keys(rooms).length,
    available: getAvailableRooms().length,
    occupied: getOccupiedRooms().length,
    cleaning: Object.values(rooms).filter(r => r.status === 'cleaning').length
  };
  return stats;
}

function updateServingCount() {
  centralAC.currentServing = Object.values(rooms).filter(r => r.serviceStatus === 'serving').length;
}

function addToServiceQueue(roomId) {
  const room = rooms[roomId];
  if (centralAC.currentServing < centralAC.maxServing) {
    room.serviceStatus = 'serving';
    serviceQueue.push({
      roomId,
      fanSpeed: room.fanSpeed,
      currentTemp: room.currentTemp,
      targetTemp: room.targetTemp,
      startTime: new Date().toISOString()
    });
    updateServingCount();
    return 'serving';
  } else {
    room.serviceStatus = 'waiting';
    room.waitTime = (waitingQueue.length + 1) * 30;
    waitingQueue.push({
      roomId,
      fanSpeed: room.fanSpeed,
      waitTime: room.waitTime,
      requestTime: new Date().toISOString()
    });
    return 'waiting';
  }
}

function removeFromQueues(roomId) {
  const serviceIndex = serviceQueue.findIndex(q => q.roomId === roomId);
  if (serviceIndex >= 0) {
    serviceQueue.splice(serviceIndex, 1);
  }

  const waitIndex = waitingQueue.findIndex(q => q.roomId === roomId);
  if (waitIndex >= 0) {
    waitingQueue.splice(waitIndex, 1);
  }

  updateServingCount();
}

// 生成随机客户名
function generateCustomerName() {
  const surnames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴'];
  const names = ['明', '华', '杰', '丽', '芳', '涛', '强', '静', '军', '伟'];
  return surnames[Math.floor(Math.random() * surnames.length)] +
         names[Math.floor(Math.random() * names.length)];
}

// 生成身份证号
function generateIdCard() {
  return '110101199' + Math.floor(Math.random() * 10) + '0101' +
         String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

// 生成电话号码
function generatePhone() {
  return '138' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
}

// ==================== WebSocket 处理 ====================

io.on('connection', (socket) => {
  console.log('✅ 客户端已连接:', socket.id);

  // 客户端加入房间频道
  socket.on('join-room', ({ roomId }) => {
    socket.join(`room-${roomId}`);
    console.log(`📍 房间 ${roomId} 加入频道`);

    // 立即发送当前状态
    const room = rooms[roomId];
    if (room) {
      socket.emit('temperature-update', {
        roomId,
        currentTemp: room.currentTemp
      });
      socket.emit('fee-update', {
        roomId,
        totalFee: room.totalFee
      });
    }
  });

  // 客户端离开房间频道
  socket.on('leave-room', ({ roomId }) => {
    socket.leave(`room-${roomId}`);
    console.log(`📍 房间 ${roomId} 离开频道`);
  });

  // 管理员加入频道
  socket.on('join-admin', () => {
    socket.join('admin');
    console.log('👨‍💼 管理员加入频道');

    // 发送当前状态
    socket.emit('central-ac-status', {
      isRunning: centralAC.isRunning,
      mode: centralAC.mode,
      currentServing: centralAC.currentServing
    });

    socket.emit('queue-update', {
      serviceQueue,
      waitingQueue
    });
  });

  // 管理员离开频道
  socket.on('leave-admin', () => {
    socket.leave('admin');
    console.log('👨‍💼 管理员离开频道');
  });

  socket.on('disconnect', () => {
    console.log('❌ 客户端已断开:', socket.id);
  });
});

// ==================== 模拟温度和费用变化 ====================

setInterval(() => {
  Object.values(rooms).forEach(room => {
    if (room.isPowerOn && room.serviceStatus === 'serving') {
      // 模拟温度变化（向目标温度靠近）
      const tempDiff = room.targetTemp - room.currentTemp;
      if (Math.abs(tempDiff) > 0.1) {
        room.currentTemp += tempDiff * 0.1; // 每次靠近 10%
        room.currentTemp = Math.round(room.currentTemp * 10) / 10;

        // 推送温度更新
        io.to(`room-${room.roomId}`).emit('temperature-update', {
          roomId: room.roomId,
          currentTemp: room.currentTemp
        });
      }

      // 模拟费用累加（每2秒增加）
      // 费率：低风0.5元/分钟，中风0.8元/分钟，高风1.0元/分钟
      const feeIncrement = room.feeRate * (2 / 60); // 每2秒的费用增量
      room.totalFee += feeIncrement;
      room.totalFee = Math.round(room.totalFee * 100) / 100;

      // 推送费用更新
      io.to(`room-${room.roomId}`).emit('fee-update', {
        roomId: room.roomId,
        totalFee: room.totalFee
      });
    }
  });
}, 2000);

// ==================== 客户端 API ====================

// 开机
app.post('/api/ac/request-service', (req, res) => {
  const { roomId, currentTemp } = req.body;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: '房间不存在' });
  }

  if (!centralAC.isRunning) {
    return res.json({ success: false, message: '中央空调未启动' });
  }

  room.isPowerOn = true;
  room.currentTemp = currentTemp || 28.0;
  room.targetTemp = centralAC.mode === 'Cooling' ? 25.0 : 26.0;
  room.fanSpeed = 'Mid';
  room.mode = centralAC.mode;
  room.feeRate = FAN_SPEEDS[room.fanSpeed].feeRate;
  room.startTime = new Date();

  const status = addToServiceQueue(roomId);

  // 推送给管理员
  io.to('admin').emit('room-power-on', { roomId, status });
  io.to('admin').emit('queue-update', { serviceQueue, waitingQueue });

  // 推送服务开始事件
  if (status === 'serving') {
    io.to(`room-${roomId}`).emit('service-started', { roomId });
  }

  res.json({
    success: true,
    mode: room.mode,
    targetTemp: room.targetTemp,
    fanSpeed: room.fanSpeed,
    feeRate: room.feeRate,
    status,
    waitTime: room.waitTime
  });
});

// 关机
app.post('/api/ac/stop-service', (req, res) => {
  const { roomId } = req.body;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: '房间不存在' });
  }

  room.isPowerOn = false;
  room.serviceStatus = 'idle';
  room.waitTime = 0;

  // 更新统计数据
  if (room.startTime) {
    const duration = Math.floor((new Date() - room.startTime) / 60000); // 分钟
    room.totalDuration += duration;
    room.totalEnergy += (duration / 60) * FAN_SPEEDS[room.fanSpeed].power;
    room.sessionCount += 1;
  }

  removeFromQueues(roomId);

  // 推送给管理员
  io.to('admin').emit('room-power-off', { roomId });
  io.to('admin').emit('queue-update', { serviceQueue, waitingQueue });

  // 推送服务停止事件
  io.to(`room-${roomId}`).emit('service-stopped', { roomId });

  res.json({ success: true, message: '关机成功' });
});

// 设置温度
app.post('/api/ac/set-temperature', (req, res) => {
  const { roomId, targetTemp } = req.body;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: '房间不存在' });
  }

  room.targetTemp = targetTemp;
  res.json({ success: true, message: '温度设置成功' });
});

// 设置风速
app.post('/api/ac/set-fan-speed', (req, res) => {
  const { roomId, fanSpeed } = req.body;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: '房间不存在' });
  }

  room.fanSpeed = fanSpeed;
  room.feeRate = FAN_SPEEDS[fanSpeed].feeRate;

  res.json({
    success: true,
    message: '风速设置成功',
    statusChanged: false,
    newStatus: room.serviceStatus,
    waitTime: room.waitTime
  });
});

// 查询房间状态
app.get('/api/ac/room-status/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: '房间不存在' });
  }

  res.json({
    success: true,
    isPowerOn: room.isPowerOn,
    currentTemp: room.currentTemp,
    targetTemp: room.targetTemp,
    fanSpeed: room.fanSpeed,
    mode: room.mode,
    totalFee: room.totalFee,
    feeRate: room.feeRate,
    status: room.serviceStatus,
    waitTime: room.waitTime
  });
});

// 查询费用
app.get('/api/ac/query-fee/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: '房间不存在' });
  }

  res.json({
    success: true,
    totalFee: room.totalFee
  });
});

// ==================== 管理员端 API ====================

// 获取所有房间状态
app.get('/api/admin/rooms', (req, res) => {
  const roomList = Object.values(rooms).map(room => ({
    roomId: room.roomId,
    isPowerOn: room.isPowerOn,
    currentTemp: room.currentTemp,
    targetTemp: room.targetTemp,
    fanSpeed: room.fanSpeed,
    mode: room.mode,
    status: room.serviceStatus,
    totalFee: room.totalFee
  }));

  res.json({ success: true, rooms: roomList });
});

// 获取中央空调状态
app.get('/api/admin/central-ac/status', (req, res) => {
  res.json({
    success: true,
    isRunning: centralAC.isRunning,
    mode: centralAC.mode,
    maxServing: centralAC.maxServing,
    currentServing: centralAC.currentServing
  });
});

// 启动中央空调
app.post('/api/admin/central-ac/start', (req, res) => {
  const { mode } = req.body;
  centralAC.isRunning = true;
  centralAC.mode = mode;

  // 推送给所有管理员
  io.to('admin').emit('central-ac-status', {
    isRunning: true,
    mode,
    currentServing: centralAC.currentServing
  });

  res.json({ success: true, message: '中央空调已启动' });
});

// 关闭中央空调
app.post('/api/admin/central-ac/stop', (req, res) => {
  centralAC.isRunning = false;

  // 关闭所有房间空调
  Object.values(rooms).forEach(room => {
    if (room.isPowerOn) {
      room.isPowerOn = false;
      room.serviceStatus = 'idle';
      io.to(`room-${room.roomId}`).emit('service-stopped', { roomId: room.roomId });
    }
  });

  serviceQueue.length = 0;
  waitingQueue.length = 0;
  updateServingCount();

  // 推送给所有管理员
  io.to('admin').emit('central-ac-status', {
    isRunning: false,
    mode: centralAC.mode,
    currentServing: 0
  });

  io.to('admin').emit('queue-update', {
    serviceQueue: [],
    waitingQueue: []
  });

  res.json({ success: true, message: '中央空调已关闭' });
});

// 获取服务队列
app.get('/api/admin/service-queue', (req, res) => {
  res.json({ success: true, queue: serviceQueue });
});

// 获取等待队列
app.get('/api/admin/waiting-queue', (req, res) => {
  res.json({ success: true, queue: waitingQueue });
});

// ==================== 前台营业员端 API ====================

// 获取所有房间列表
app.get('/api/reception/rooms', (req, res) => {
  const roomList = Object.values(rooms).map(room => ({
    roomId: room.roomId,
    roomType: room.roomType,
    status: room.status,
    customer: room.customer
  }));

  res.json({ success: true, rooms: roomList });
});

// 查询可用房间
app.get('/api/reception/available-rooms', (req, res) => {
  const { roomType } = req.query;
  let available = getAvailableRooms();

  if (roomType && roomType !== 'all') {
    available = available.filter(r => r.roomType === roomType);
  }

  const roomList = available.map(room => ({
    roomId: room.roomId,
    roomType: room.roomType,
    price: ROOM_TYPES[room.roomType].price
  }));

  res.json({ success: true, rooms: roomList });
});

// 办理入住
app.post('/api/reception/check-in', (req, res) => {
  const { roomId, customerName, idCard, phone, checkInDate, checkOutDate } = req.body;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: '房间不存在' });
  }

  if (room.status !== 'available') {
    return res.json({ success: false, message: '该房间已被入住' });
  }

  const customerId = 'C' + Date.now();
  room.status = 'occupied';
  room.customer = {
    customerId,
    name: customerName,
    idCard,
    phone,
    checkInTime: new Date().toISOString(),
    expectedCheckOutTime: new Date(checkOutDate).toISOString()
  };

  res.json({
    success: true,
    customerId,
    roomCardData: {
      roomId,
      validFrom: new Date(checkInDate).toISOString(),
      validTo: new Date(checkOutDate).toISOString()
    }
  });
});

// 查询房间客户信息
app.get('/api/reception/customer/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: '房间不存在' });
  }

  if (!room.customer) {
    return res.json({ success: false, message: '该房间无客户' });
  }

  res.json({ success: true, customer: room.customer });
});

// 生成账单
app.post('/api/reception/generate-bill', (req, res) => {
  const { roomId } = req.body;
  const room = rooms[roomId];

  if (!room || !room.customer) {
    return res.json({ success: false, message: '房间不存在或无客户' });
  }

  const checkInTime = new Date(room.customer.checkInTime);
  const checkOutTime = new Date();
  const duration = Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24)); // 天数

  const accommodationFee = ROOM_TYPES[room.roomType].price * duration;
  const acFee = room.totalFee;
  const totalFee = accommodationFee + acFee;

  res.json({
    success: true,
    accommodationFee,
    acFee,
    totalFee,
    checkInTime: room.customer.checkInTime,
    checkOutTime: checkOutTime.toISOString(),
    duration
  });
});

// 获取空调使用详单
app.get('/api/reception/bill-detail/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: '房间不存在' });
  }

  // 生成模拟的使用详单
  const details = [];
  if (room.customer) {
    const checkInTime = new Date(room.customer.checkInTime);
    const now = new Date();

    // 生成2-3个使用时段
    const segments = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < segments; i++) {
      const startTime = new Date(checkInTime.getTime() + i * 6 * 60 * 60 * 1000);
      const duration = Math.floor(Math.random() * 180 + 60); // 60-240分钟
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      if (endTime > now) break;

      const fanSpeed = ['Low', 'Mid', 'High'][Math.floor(Math.random() * 3)];
      const fee = (duration / 60) * FAN_SPEEDS[fanSpeed].feeRate;

      details.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        fanSpeed,
        targetTemp: 25,
        mode: 'Cooling',
        duration,
        fee: Math.round(fee * 100) / 100
      });
    }
  }

  res.json({ success: true, details });
});

// 完成结账
app.post('/api/reception/check-out', (req, res) => {
  const { roomId, amountPaid, paymentMethod } = req.body;
  const room = rooms[roomId];

  if (!room || !room.customer) {
    return res.json({ success: false, message: '房间不存在或无客户' });
  }

  const transactionId = 'TXN' + Date.now();
  const checkInTime = new Date(room.customer.checkInTime);
  const checkOutTime = new Date();
  const duration = Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24));

  const accommodationFee = ROOM_TYPES[room.roomType].price * duration;
  const acFee = room.totalFee;
  const totalFee = accommodationFee + acFee;

  const receipt = {
    roomId,
    customerName: room.customer.name,
    checkInTime: room.customer.checkInTime,
    checkOutTime: checkOutTime.toISOString(),
    accommodationFee,
    acFee,
    totalFee,
    amountPaid,
    paymentMethod,
    transactionId
  };

  // 重置房间状态
  room.status = 'available';
  room.customer = null;
  room.totalFee = 0;

  res.json({ success: true, transactionId, receipt });
});

// ==================== 酒店经理端 API ====================

// 获取所有房间的报表数据
app.get('/api/manager/room-reports', (req, res) => {
  const { startDate, endDate } = req.query;

  const reports = Object.values(rooms).map(room => {
    // 计算该时间段内的数据
    const history = roomHistory[room.roomId] || [];
    const relevantHistory = history.filter(h => {
      return h.date >= startDate && h.date <= endDate;
    });

    const totalDuration = relevantHistory.reduce((sum, h) => sum + h.duration, 0);
    const totalEnergy = relevantHistory.reduce((sum, h) => sum + h.energy, 0);
    const totalFee = totalEnergy * 1.5;
    const avgTemp = 24 + Math.random() * 2;

    // 随机生成风速分布
    const low = Math.floor(Math.random() * 40);
    const high = Math.floor(Math.random() * 30);
    const mid = 100 - low - high;

    return {
      roomId: room.roomId,
      isActive: room.isPowerOn,
      totalDuration,
      totalEnergy: Math.round(totalEnergy * 100) / 100,
      totalFee: Math.round(totalFee * 100) / 100,
      avgTemperature: Math.round(avgTemp * 10) / 10,
      mainFanSpeed: mid > low && mid > high ? 'Mid' : (low > high ? 'Low' : 'High'),
      fanSpeedDistribution: { Low: low, Mid: mid, High: high },
      peakHours: '14:00-18:00'
    };
  });

  res.json({ success: true, reports });
});

// 获取单个房间的详细报表
app.get('/api/manager/room-report/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { startDate, endDate } = req.query;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: '房间不存在' });
  }

  const history = roomHistory[roomId] || [];
  const relevantHistory = history.filter(h => {
    return h.date >= startDate && h.date <= endDate;
  });

  const totalDuration = relevantHistory.reduce((sum, h) => sum + h.duration, 0);
  const totalEnergy = relevantHistory.reduce((sum, h) => sum + h.energy, 0);
  const totalFee = totalEnergy * 1.5;
  const avgTemp = 24 + Math.random() * 2;

  const low = Math.floor(Math.random() * 40);
  const high = Math.floor(Math.random() * 30);
  const mid = 100 - low - high;

  const dailyUsage = relevantHistory.map(h => ({
    date: h.date,
    duration: h.duration,
    energy: Math.round(h.energy * 100) / 100,
    fee: Math.round(h.energy * 1.5 * 100) / 100
  }));

  const report = {
    roomId,
    isActive: room.isPowerOn,
    totalDuration,
    totalEnergy: Math.round(totalEnergy * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    avgTemperature: Math.round(avgTemp * 10) / 10,
    mainFanSpeed: mid > low && mid > high ? 'Mid' : (low > high ? 'Low' : 'High'),
    fanSpeedDistribution: { Low: low, Mid: mid, High: high },
    peakHours: '14:00-18:00',
    dailyUsage
  };

  res.json({ success: true, report });
});

// 获取酒店整体能耗统计
app.get('/api/manager/energy-stats', (req, res) => {
  const { startDate, endDate } = req.query;

  let totalEnergy = 0;
  let totalFee = 0;
  let tempSum = 0;
  let tempCount = 0;

  Object.values(rooms).forEach(room => {
    const history = roomHistory[room.roomId] || [];
    const relevantHistory = history.filter(h => {
      return h.date >= startDate && h.date <= endDate;
    });

    const energy = relevantHistory.reduce((sum, h) => sum + h.energy, 0);
    totalEnergy += energy;
    totalFee += energy * 1.5;

    if (room.isPowerOn) {
      tempSum += room.targetTemp;
      tempCount++;
    }
  });

  const activeRooms = Object.values(rooms).filter(r => r.isPowerOn).length;
  const avgTemperature = tempCount > 0 ? tempSum / tempCount : 24.5;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const dailyAvgEnergy = totalEnergy / days;

  res.json({
    success: true,
    totalEnergy: Math.round(totalEnergy * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    activeRooms,
    avgTemperature: Math.round(avgTemperature * 10) / 10,
    peakHour: '15:00-17:00',
    dailyAvgEnergy: Math.round(dailyAvgEnergy * 100) / 100
  });
});

// 获取每日统计数据
app.get('/api/manager/daily-stats', (req, res) => {
  const { startDate, endDate } = req.query;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const stats = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];

    let dailyEnergy = 0;
    let tempSum = 0;
    let activeCount = 0;

    Object.values(rooms).forEach(room => {
      const history = roomHistory[room.roomId] || [];
      const dayHistory = history.find(h => h.date === dateStr);

      if (dayHistory) {
        dailyEnergy += dayHistory.energy;
      }

      if (room.isPowerOn) {
        tempSum += room.targetTemp;
        activeCount++;
      }
    });

    const dailyFee = dailyEnergy * 1.5;
    const avgTemp = activeCount > 0 ? tempSum / activeCount : 24.0 + Math.random() * 1;

    stats.push({
      date: dateStr,
      energy: Math.round(dailyEnergy * 100) / 100,
      fee: Math.round(dailyFee * 100) / 100,
      activeRooms: Math.floor(Math.random() * 20 + 20),
      avgTemperature: Math.round(avgTemp * 10) / 10
    });
  }

  res.json({ success: true, stats });
});

// ==================== 健康检查 ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    centralAC: centralAC,
    rooms: Object.keys(rooms).length,
    connections: io.engine.clientsCount
  });
});

// ==================== 启动服务器 ====================

const PORT = 3000;

httpServer.listen(PORT, () => {
  console.log('🚀 酒店空调管理系统 Mock Server 已启动');
  console.log(`📡 HTTP 服务: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket 服务: ws://localhost:${PORT}`);
  console.log('');
  console.log('📋 可访问的页面:');
  console.log('   - 客户端:      http://localhost:5173/room/301');
  console.log('   - 管理员端:    http://localhost:5173/admin');
  console.log('   - 前台服务台:  http://localhost:5173/reception');
  console.log('   - 酒店经理端:  http://localhost:5173/manager');
  console.log('');
  console.log(`✅ 已生成 50 个房间 (301-350)`);
  console.log(`✅ 中央空调状态: ${centralAC.isRunning ? '运行中' : '已关闭'} (${centralAC.mode})`);
  console.log('');
  console.log('💡 提示: 访问 http://localhost:3000/health 查看服务器状态');
});
