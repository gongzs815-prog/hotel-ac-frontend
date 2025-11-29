# 前台营业员端 API 接口规范

> 前端新增了前台服务台页面，需要后端实现以下接口。

---

## 🆕 新增 HTTP 接口（7 个）

### 1. 获取所有房间列表

```
GET /api/reception/rooms

响应:
{
  "success": true,
  "rooms": [
    {
      "roomId": "301",
      "roomType": "single",      // "single" / "double" / "king"
      "status": "available",     // "available" / "occupied" / "cleaning"
      "customer": null           // 空闲时为 null
    },
    {
      "roomId": "302",
      "roomType": "double",
      "status": "occupied",
      "customer": {
        "name": "张三",
        "phone": "13800138000",
        "checkInTime": "2025-01-15T14:00:00Z"
      }
    }
  ]
}
```

**说明**：
- roomType: `single`(单人房 ¥128), `double`(双人房 ¥168), `king`(大床房 ¥198)
- status: `available`(空闲), `occupied`(已入住), `cleaning`(清洁中)

---

### 2. 查询可用房间

```
GET /api/reception/available-rooms?checkInDate=2025-01-15&checkOutDate=2025-01-16&roomType=single

Query 参数:
- checkInDate: 入住日期（可选）
- checkOutDate: 退房日期（可选）
- roomType: 房型筛选（可选）

响应:
{
  "success": true,
  "rooms": [
    {
      "roomId": "301",
      "roomType": "single",
      "price": 128
    }
  ]
}
```

---

### 3. 办理入住

```
POST /api/reception/check-in
Content-Type: application/json

请求体:
{
  "roomId": "301",
  "customerName": "张三",
  "idCard": "110101199001011234",
  "phone": "13800138000",
  "checkInDate": "2025-01-15",
  "checkOutDate": "2025-01-16"
}

成功响应:
{
  "success": true,
  "customerId": "C20250115001",
  "roomCardData": {
    "roomId": "301",
    "validFrom": "2025-01-15T14:00:00Z",
    "validTo": "2025-01-16T12:00:00Z"
  }
}

失败响应:
{
  "success": false,
  "message": "该房间已被入住"
}
```

---

### 4. 查询房间客户信息

```
GET /api/reception/customer/:roomId

示例: GET /api/reception/customer/301

响应:
{
  "success": true,
  "customer": {
    "customerId": "C20250115001",
    "name": "张三",
    "idCard": "110101199001011234",
    "phone": "13800138000",
    "checkInTime": "2025-01-15T14:30:00Z",
    "expectedCheckOutTime": "2025-01-16T12:00:00Z"
  }
}
```

---

### 5. 生成账单

```
POST /api/reception/generate-bill
Content-Type: application/json

请求体:
{
  "roomId": "301"
}

响应:
{
  "success": true,
  "accommodationFee": 128.00,    // 住宿费
  "acFee": 15.50,                // 空调费（从空调系统获取）
  "totalFee": 143.50,            // 总费用
  "checkInTime": "2025-01-15T14:30:00Z",
  "checkOutTime": "2025-01-16T10:30:00Z",
  "duration": 1                  // 入住天数
}
```

**说明**：
- 住宿费 = 房价 × 入住天数
- 空调费 = 从空调管理系统获取该房间的累计费用

---

### 6. 获取空调使用详单

```
GET /api/reception/bill-detail/:roomId

示例: GET /api/reception/bill-detail/301

响应:
{
  "success": true,
  "details": [
    {
      "startTime": "2025-01-15T15:00:00Z",
      "endTime": "2025-01-15T18:30:00Z",
      "fanSpeed": "Mid",         // "Low" / "Mid" / "High"
      "targetTemp": 25,
      "mode": "Cooling",
      "duration": 210,           // 时长（分钟）
      "fee": 6.30                // 该时段费用
    },
    {
      "startTime": "2025-01-15T22:00:00Z",
      "endTime": "2025-01-16T07:00:00Z",
      "fanSpeed": "Low",
      "targetTemp": 26,
      "mode": "Cooling",
      "duration": 540,
      "fee": 9.20
    }
  ]
}
```

---

### 7. 完成结账

```
POST /api/reception/check-out
Content-Type: application/json

请求体:
{
  "roomId": "301",
  "amountPaid": 143.50,
  "paymentMethod": "wechat"      // "cash" / "wechat" / "alipay" / "card"
}

响应:
{
  "success": true,
  "transactionId": "TXN20250116103000001",
  "receipt": {
    "roomId": "301",
    "customerName": "张三",
    "checkInTime": "2025-01-15T14:30:00Z",
    "checkOutTime": "2025-01-16T10:30:00Z",
    "accommodationFee": 128.00,
    "acFee": 15.50,
    "totalFee": 143.50,
    "amountPaid": 143.50,
    "paymentMethod": "wechat",
    "transactionId": "TXN20250116103000001"
  }
}
```

---

## 📋 房型价格配置

| 房型 | 代码 | 价格（元/晚）|
|------|------|-------------|
| 标准单人房 | single | 128 |
| 标准双人房 | double | 168 |
| 大床房 | king | 198 |

---

## 📝 业务逻辑说明

### 入住流程
1. 前台选择空闲房间
2. 登记客户信息（姓名、身份证、电话）
3. 系统生成入住记录，激活房卡
4. 房间状态变为 `occupied`

### 结账流程
1. 前台选择已入住房间
2. 系统生成账单（住宿费 + 空调费）
3. 客户可选择查看空调使用详单
4. 确认支付方式，完成结账
5. 房间状态变为 `available`

### 费用计算
```
住宿费 = 房价 × 入住天数（不足一天按一天计）
空调费 = 从空调管理系统获取
总费用 = 住宿费 + 空调费
```

---

## 🔗 访问地址

```
前台服务台: http://localhost:5173/reception
管理员控制台: http://localhost:5173/admin
客户房间面板: http://localhost:5173/room/301
```

---

## 📁 前端文件结构

```
src/
├── stores/
│   └── receptionStore.js           # 前台状态管理
│
├── components/
│   └── reception/
│       ├── ReceptionDashboard.vue  # 主界面
│       ├── CheckInForm.vue         # 入住表单
│       ├── CheckOutPanel.vue       # 结账面板
│       └── RoomQueryPanel.vue      # 房间查询
│
└── router/
    └── index.js                    # 添加 /reception 路由
```