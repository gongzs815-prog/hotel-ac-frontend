import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

// ==================== 配置常量 ====================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// ==================== Store 定义 ====================

export const useManagerStore = defineStore('manager', () => {
  // ==================== State ====================

  // 所有房间的报表数据
  const roomReports = ref([]);

  // 当前选中房间的详细报表
  const currentRoomReport = ref(null);

  // 酒店整体能耗统计
  const energyStats = ref({
    totalEnergy: 0,        // 总能耗 (kWh)
    totalFee: 0,           // 总费用 (元)
    activeRooms: 0,        // 当前开机房间数
    avgTemperature: 0,     // 平均设定温度
    peakHour: null,        // 用电高峰时段
    dailyAvgEnergy: 0      // 日均能耗
  });

  // 每日统计数据（用于图表）
  const dailyStats = ref([]);

  // 选中的日期范围
  const dateRange = ref({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate()
  });

  // 加载状态
  const isLoading = ref(false);

  // ==================== 辅助函数 ====================

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 7); // 默认显示最近7天
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    return new Date().toISOString().split('T')[0];
  }

  // ==================== Computed ====================

  // 按能耗排序的房间（高到低）
  const roomsSortedByEnergy = computed(() => {
    return [...roomReports.value].sort((a, b) => b.totalEnergy - a.totalEnergy);
  });

  // 按费用排序的房间（高到低）
  const roomsSortedByFee = computed(() => {
    return [...roomReports.value].sort((a, b) => b.totalFee - a.totalFee);
  });

  // 高能耗房间（超过平均值150%）
  const highEnergyRooms = computed(() => {
    if (roomReports.value.length === 0) return [];
    const avgEnergy = energyStats.value.totalEnergy / roomReports.value.length;
    return roomReports.value.filter(room => room.totalEnergy > avgEnergy * 1.5);
  });

  // 统计摘要
  const summary = computed(() => {
    return {
      totalRooms: roomReports.value.length,
      activeRooms: roomReports.value.filter(r => r.isActive).length,
      totalEnergy: energyStats.value.totalEnergy,
      totalFee: energyStats.value.totalFee,
      avgTemperature: energyStats.value.avgTemperature
    };
  });

  // ==================== API 调用 ====================

  /**
   * 获取所有房间的报表数据
   */
  async function fetchRoomReports() {
    try {
      isLoading.value = true;
      const response = await axios.get(`${API_BASE_URL}/manager/room-reports`, {
        params: {
          startDate: dateRange.value.startDate,
          endDate: dateRange.value.endDate
        }
      });

      if (response.data.success) {
        roomReports.value = response.data.reports;
        console.log('✅ 获取房间报表成功:', roomReports.value.length, '个房间');
      }
    } catch (error) {
      console.error('❌ 获取房间报表失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取单个房间的详细报表
   */
  async function fetchRoomReport(roomId) {
    try {
      isLoading.value = true;
      const response = await axios.get(`${API_BASE_URL}/manager/room-report/${roomId}`, {
        params: {
          startDate: dateRange.value.startDate,
          endDate: dateRange.value.endDate
        }
      });

      if (response.data.success) {
        currentRoomReport.value = response.data.report;
        console.log('✅ 获取房间详细报表成功:', roomId);
        return response.data.report;
      }
    } catch (error) {
      console.error('❌ 获取房间详细报表失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取酒店整体能耗统计
   */
  async function fetchEnergyStats() {
    try {
      isLoading.value = true;
      const response = await axios.get(`${API_BASE_URL}/manager/energy-stats`, {
        params: {
          startDate: dateRange.value.startDate,
          endDate: dateRange.value.endDate
        }
      });

      if (response.data.success) {
        energyStats.value = {
          totalEnergy: response.data.totalEnergy || 0,
          totalFee: response.data.totalFee || 0,
          activeRooms: response.data.activeRooms || 0,
          avgTemperature: response.data.avgTemperature || 0,
          peakHour: response.data.peakHour || null,
          dailyAvgEnergy: response.data.dailyAvgEnergy || 0
        };
        console.log('✅ 获取能耗统计成功');
      }
    } catch (error) {
      console.error('❌ 获取能耗统计失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取每日统计数据（用于图表）
   */
  async function fetchDailyStats() {
    try {
      isLoading.value = true;
      const response = await axios.get(`${API_BASE_URL}/manager/daily-stats`, {
        params: {
          startDate: dateRange.value.startDate,
          endDate: dateRange.value.endDate
        }
      });

      if (response.data.success) {
        dailyStats.value = response.data.stats || [];
        console.log('✅ 获取每日统计成功:', dailyStats.value.length, '天');
      }
    } catch (error) {
      console.error('❌ 获取每日统计失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 设置日期范围
   */
  function setDateRange(startDate, endDate) {
    dateRange.value.startDate = startDate;
    dateRange.value.endDate = endDate;
  }

  /**
   * 清空当前房间报表
   */
  function clearCurrentReport() {
    currentRoomReport.value = null;
  }

  /**
   * 初始化经理端数据
   */
  async function initManagerData() {
    try {
      isLoading.value = true;
      console.log('🔄 初始化经理端数据...');
      
      await Promise.all([
        fetchRoomReports(),
        fetchEnergyStats(),
        fetchDailyStats()
      ]);
      
      console.log('✅ 经理端数据初始化完成');
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 刷新所有数据
   */
  async function refreshAllData() {
    await initManagerData();
  }

  // ==================== 导出 ====================

  return {
    // State
    roomReports,
    currentRoomReport,
    energyStats,
    dailyStats,
    dateRange,
    isLoading,

    // Computed
    roomsSortedByEnergy,
    roomsSortedByFee,
    highEnergyRooms,
    summary,

    // Actions
    fetchRoomReports,
    fetchRoomReport,
    fetchEnergyStats,
    fetchDailyStats,
    setDateRange,
    clearCurrentReport,
    initManagerData,
    refreshAllData
  };
});