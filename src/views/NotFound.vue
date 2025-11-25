<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center px-4">
    <div class="text-center">
      <!-- 404 图标 -->
      <div class="text-9xl font-bold text-slate-700 mb-4">404</div>

      <!-- 错误信息 -->
      <h1 class="text-3xl font-bold text-slate-300 mb-4">页面未找到</h1>
      <p class="text-slate-400 mb-8">
        抱歉，您访问的页面不存在或已被移动
      </p>

      <!-- 返回按钮 -->
      <router-link
        to="/room/301"
        class="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg"
      >
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup>
// 404 页面组件
</script>
