# 管理员端 API 接口规范

> 前端新增了管理员控制台，需要后端实现以下接口。

---

## 🆕 新增 HTTP 接口（6 个）

### 1. 获取所有房间状态

```
GET /api/admin/rooms

响应:
{
  "success": true,
  "rooms": [
    {
      "roomId": "301",
      "isPowerOn": true,
      "currentTemp": 26.5,
      "targetTemp": 25.0,
      "fanSpeed": "Mid",
      "mode": "Cooling",
      "status": "serving",
      "totalFee": 12.50
    },
    {
      "roomId": "302",
      "isPowerOn": false,
      "currentTemp": 28.0,
      "targetTemp": 25.0,
      "fanSpeed": "Mid",
      "mode": "Cooling",
      "status": "idle",
      "totalFee": 0
    }
    // ... 所有 50 个房间
  ]
}
```

---

### 2. 获取中央空调状态

```
GET /api/admin/central-ac/status

响应:
{
  "success": true,
  "isRunning": true,
  "mode": "Cooling",       // "Cooling" 或 "Heating"
  "maxServing": 30,        // 最大同时服务数
  "currentServing": 12     // 当前服务房间数
}
```

---

### 3. 启动中央空调

```
POST /api/admin/central-ac/start
Content-Type: application/json

请求体:
{
  "mode": "Cooling"  // "Cooling" 或 "Heating"
}

响应:
{
  "success": true,
  "message": "中央空调已启动"
}
```

---

### 4. 关闭中央空调

```
POST /api/admin/central-ac/stop

响应:
{
  "success": true,
  "message": "中央空调已关闭"
}
```

---

### 5. 获取服务队列

```
GET /api/admin/service-queue

响应:
{
  "success": true,
  "queue": [
    {
      "roomId": "301",
      "fanSpeed": "High",
      "currentTemp": 26.5,
      "targetTemp": 25.0,
      "startTime": "2025-01-15T10:30:00Z"
    },
    {
      "roomId": "305",
      "fanSpeed": "Mid",
      "currentTemp": 27.0,
      "targetTemp": 25.0,
      "startTime": "2025-01-15T10:32:00Z"
    }
    // ... 最多 30 个
  ]
}
```

---

### 6. 获取等待队列

```
GET /api/admin/waiting-queue

响应:
{
  "success": true,
  "queue": [
    {
      "roomId": "308",
      "fanSpeed": "Low",
      "waitTime": 30,        // 预计等待时间（秒）
      "requestTime": "2025-01-15T10:35:00Z"
    }
    // ...
  ]
}
```

---

## 🆕 新增 WebSocket 事件

### 前端发送

#### 加入管理员频道
```javascript
socket.emit('join-admin');
```

#### 离开管理员频道
```javascript
socket.emit('leave-admin');
```

---

### 后端推送（给管理员）

#### 1. 队列更新
```javascript
// 当服务队列或等待队列变化时
socket.to('admin').emit('queue-update', {
  serviceQueue: [...],   // 完整服务队列
  waitingQueue: [...]    // 完整等待队列
});
```

#### 2. 中央空调状态变化
```javascript
socket.to('admin').emit('central-ac-status', {
  isRunning: true,
  mode: "Cooling",
  currentServing: 15
});
```

#### 3. 房间开机
```javascript
socket.to('admin').emit('room-power-on', {
  roomId: "301",
  status: "serving"  // 或 "waiting"
});
```

#### 4. 房间关机
```javascript
socket.to('admin').emit('room-power-off', {
  roomId: "301"
});
```

---

## 📝 备注

1. **管理员频道**：后端需要维护一个 `admin` 房间，所有管理员客户端加入这个房间，方便广播消息。

2. **原有事件复用**：`temperature-update`、`fee-update`、`status-change` 等事件，管理员端也需要接收（用于更新房间卡片状态）。

3. **房间列表**：建议后端启动时初始化 50 个房间（301-350），即使没有客户入住，也返回默认状态。

---

## 🔗 访问地址

```
管理员控制台: http://localhost:5173/admin
客户房间面板: http://localhost:5173/room/301
```