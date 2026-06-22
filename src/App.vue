<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <h1>自动签到助手</h1>
      <el-menu mode="horizontal" :router="true" :default-active="$route.path">
        <el-menu-item index="/">任务列表</el-menu-item>
        <el-menu-item index="/record">录制</el-menu-item>
        <el-menu-item index="/logs">日志</el-menu-item>
      </el-menu>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
</script>

<style>
.app-container {
  min-height: 100vh;
}
.app-header {
  display: flex;
  align-items: center;
  gap: 20px;
  background: #f5f5f5;
}
.app-header h1 {
  margin: 0;
  font-size: 20px;
}
</style>
