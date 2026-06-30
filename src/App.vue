<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="logo-box">
        <el-icon class="logo-icon"><Platform /></el-icon>
        <h1>自动化引擎</h1>
      </div>
      <el-menu mode="horizontal" :router="true" :default-active="$route.path" class="main-menu">
        <el-menu-item index="/">
          <el-icon><List /></el-icon>任务列表
        </el-menu-item>
        <el-menu-item index="/record">
          <el-icon><VideoCamera /></el-icon>可视化录制
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>全局日志
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { Platform, List, VideoCamera, Document } from '@element-plus/icons-vue'
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0 40px;
  height: 64px !important;
  z-index: 10;
}

.logo-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  color: #409EFF;
}

.app-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1f2f3d;
  letter-spacing: 0.5px;
}

.main-menu {
  border-bottom: none !important;
  flex: 1;
  justify-content: flex-end;
}

.el-menu--horizontal > .el-menu-item {
  font-size: 15px;
  height: 64px;
  line-height: 64px;
}

.app-main {
  padding: 24px;
  height: calc(100vh - 64px);
  box-sizing: border-box;
}
</style>
