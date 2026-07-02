<template>
  <el-container class="app-container">
    <template v-if="!$route.meta.public">
      <el-header class="app-header">
        <div class="header-left">
          <div class="logo-box">
            <h1>Tinna</h1>
          </div>
          <el-menu mode="horizontal" :router="true" :default-active="$route.path" class="main-menu">
            <el-menu-item index="/">任务列表</el-menu-item>
            <el-menu-item index="/record">可视化录制</el-menu-item>
            <el-menu-item index="/logs">全局日志</el-menu-item>
          </el-menu>
        </div>
        <div class="user-info">
          <span class="username">欢迎, {{ username }}</span>
          <el-button class="logout-btn" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </template>
    <router-view v-else />
  </el-container>
</template>

<script setup>

import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const username = ref('')

watch(() => route.path, () => {
  username.value = localStorage.getItem('username') || ''
}, { immediate: true })

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  router.push('/login')
}

</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --bg: #fffbdd;
  --bg-card: #fffdf0;
  --bg-hover: #f5f0d6;
  --bg-input: #f5f0d6;
  --border: #e8e0b8;
  --border-light: #ece6c8;
  --text: #1a1a1a;
  --text-secondary: #555;
  --text-muted: #888;
  --dark: #1a1a1a;
  --accent: #1a1a1a;
  --success: #2d8a4e;
  --danger: #c0392b;
  --warning: #d4880a;
  --radius: 8px;
  --radius-lg: 12px;
  --shadow: 0 1px 3px rgba(0,0,0,0.04);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  color: var(--text);
}

.app-container {
  min-height: 100vh;
  flex-direction: column;
}

/* ═══ 导航栏 ═══ */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  padding: 0 32px;
  height: 56px !important;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.logo-box {
  display: flex;
  align-items: center;
  margin-right: 24px;
}

.logo-box h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--dark);
  letter-spacing: -0.5px;
}

.main-menu {
  border-bottom: none !important;
  background: transparent !important;
}

.main-menu .el-menu-item {
  color: var(--text) !important;
  border-bottom: none !important;
  font-weight: 500;
  font-size: 14px;
  transition: opacity 0.2s;
  padding: 0 14px;
}

.main-menu .el-menu-item:hover {
  color: var(--dark) !important;
  background: transparent !important;
  opacity: 0.7;
}

.main-menu .el-menu-item.is-active {
  color: var(--dark) !important;
  background: transparent !important;
  font-weight: 700;
}

.el-menu--horizontal > .el-menu-item {
  height: 56px;
  line-height: 56px;
}

.app-main {
  padding: 28px 32px;
  min-height: calc(100vh - 56px);
  box-sizing: border-box;
}

/* ═══ 用户信息区 ═══ */
.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.logout-btn {
  padding: 6px 16px !important;
  border: 1.5px solid var(--dark) !important;
  border-radius: var(--radius) !important;
  background: transparent !important;
  color: var(--dark) !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: var(--dark) !important;
  color: #fff !important;
}

/* ══════════════════════════════════════════════
   全局 Element Plus 暖色主题覆盖
   ══════════════════════════════════════════════ */

/* Card */
.el-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border) !important;
  color: var(--text) !important;
  box-shadow: var(--shadow);
  border-radius: var(--radius-lg);
}

.el-card__header {
  border-bottom: 1px solid var(--border-light) !important;
  color: var(--dark);
  font-weight: 600;
}

/* Table */
.el-table {
  --el-table-bg-color: var(--bg-card) !important;
  --el-table-tr-bg-color: var(--bg-card) !important;
  --el-table-header-bg-color: var(--bg-hover) !important;
  --el-table-row-hover-bg-color: var(--bg-hover) !important;
  --el-table-border-color: var(--border-light) !important;
  --el-table-text-color: var(--text) !important;
  --el-table-header-text-color: var(--text-secondary) !important;
  --el-table-current-row-bg-color: var(--bg-hover) !important;
}

.el-table th.el-table__cell {
  background: var(--bg-hover) !important;
  font-weight: 600;
}

.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: rgba(245, 240, 214, 0.4) !important;
}

/* Input */
.el-input__wrapper {
  background: var(--bg-input) !important;
  box-shadow: none !important;
  border-radius: var(--radius);
  padding: 2px 12px;
}

.el-input__wrapper:hover {
  background: #efe9c8 !important;
}

.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1.5px var(--dark) !important;
  background: #fff !important;
}

.el-input__inner {
  color: var(--text) !important;
}

.el-input__inner::placeholder {
  color: var(--text-muted) !important;
}

.el-input__prefix .el-icon,
.el-input__suffix .el-icon {
  color: var(--text-muted);
}

.el-textarea__inner {
  background: var(--bg-input) !important;
  box-shadow: none !important;
  color: var(--text) !important;
  border-radius: var(--radius);
}

.el-textarea__inner::placeholder {
  color: var(--text-muted) !important;
}

.el-textarea__inner:hover {
  background: #efe9c8 !important;
}

.el-textarea__inner:focus {
  box-shadow: 0 0 0 1.5px var(--dark) !important;
  background: #fff !important;
}

/* Select */
.el-select-dropdown {
  background: #fff !important;
  border: 1px solid var(--border) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border-radius: var(--radius);
}

.el-select-dropdown__item {
  color: var(--text) !important;
}

.el-select-dropdown__item.hover,
.el-select-dropdown__item:hover {
  background: var(--bg-hover) !important;
}

.el-select-dropdown__item.is-selected {
  color: var(--dark) !important;
  font-weight: 700;
}

.el-popper.is-light {
  background: #fff !important;
  border: 1px solid var(--border) !important;
  color: var(--text) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.el-popper.is-light .el-popper__arrow::before {
  background: #fff !important;
  border-color: var(--border) !important;
}

/* Form */
.el-form-item__label {
  color: var(--text-secondary) !important;
  font-weight: 500;
}

/* Alert */
.el-alert--info {
  background: var(--bg-hover) !important;
  border-color: var(--border) !important;
}

.el-alert--info .el-alert__title,
.el-alert--info .el-alert__description {
  color: var(--text-secondary) !important;
}

.el-alert--success {
  background: #e8f5e9 !important;
  border-color: #c8e6c9 !important;
}

.el-alert--warning {
  background: #fff8e1 !important;
  border-color: #ffecb3 !important;
}

.el-alert--error {
  background: #fce4ec !important;
  border-color: #f8bbd0 !important;
}

/* Divider */
.el-divider {
  border-top-color: var(--border) !important;
}

.el-divider__text {
  background-color: var(--bg) !important;
  color: var(--text-muted) !important;
}

/* Collapse */
.el-collapse {
  border-top-color: var(--border-light) !important;
  border-bottom-color: var(--border-light) !important;
}

.el-collapse-item__header {
  background: transparent !important;
  color: var(--text) !important;
  border-bottom-color: var(--border-light) !important;
}

.el-collapse-item__wrap {
  background: transparent !important;
  border-bottom-color: var(--border-light) !important;
}

.el-collapse-item__content {
  color: var(--text-secondary);
}

/* Tag */
.el-tag {
  --el-tag-bg-color: var(--bg-hover);
  --el-tag-border-color: var(--border);
  --el-tag-text-color: var(--text);
}

.el-tag--info {
  --el-tag-bg-color: #f0ede0;
  --el-tag-border-color: #ddd8c0;
  --el-tag-text-color: var(--text-muted);
}

/* Empty */
.el-empty__description p {
  color: var(--text-muted) !important;
}

/* Dialog / Drawer */
.el-dialog {
  background: #fff !important;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.el-dialog__title {
  color: var(--dark) !important;
  font-weight: 700;
}

.el-dialog__headerbtn .el-dialog__close {
  color: var(--text-muted);
}

.el-drawer {
  background: #fff !important;
}

.el-drawer__header {
  color: var(--dark) !important;
}

/* Popover */
.el-popover.el-popper {
  background: #fff !important;
  border: 1px solid var(--border) !important;
  color: var(--text) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.el-popover.el-popper .el-popper__arrow::before {
  background: #fff !important;
  border-color: var(--border) !important;
}

/* Dropdown */
.el-dropdown-menu {
  background: #fff !important;
  border: 1px solid var(--border) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border-radius: var(--radius);
}

.el-dropdown-menu__item {
  color: var(--text) !important;
}

.el-dropdown-menu__item:hover {
  background: var(--bg-hover) !important;
  color: var(--dark) !important;
}

.el-dropdown-menu__item--divided {
  border-top-color: var(--border-light) !important;
}

/* Time Picker */
.el-time-panel {
  background: #fff !important;
  border: 1px solid var(--border) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.el-time-spinner__item {
  color: var(--text-secondary) !important;
}

.el-time-spinner__item.is-active {
  color: var(--dark) !important;
  font-weight: 700;
}

.el-time-spinner__item:hover:not(.is-disabled):not(.is-active) {
  background: var(--bg-hover) !important;
}

.el-time-panel__footer {
  border-top-color: var(--border-light) !important;
}

/* Message */
.el-message {
  background: #fff !important;
  border-color: var(--border) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

/* Buttons — 描边按钮风格 */
.el-button--default {
  background: transparent;
  border: 1.5px solid var(--dark);
  color: var(--dark);
  font-weight: 600;
  border-radius: var(--radius);
}

.el-button--default:hover {
  background: var(--dark);
  border-color: var(--dark);
  color: #fff;
}

.el-button--primary {
  background: var(--dark);
  border-color: var(--dark);
  color: #fff;
  font-weight: 600;
  border-radius: var(--radius);
}

.el-button--primary:hover {
  background: #333;
  border-color: #333;
}

.el-button--success {
  background: var(--success);
  border-color: var(--success);
  color: #fff;
  font-weight: 600;
  border-radius: var(--radius);
}

.el-button--success:hover {
  background: #247a42;
  border-color: #247a42;
}

.el-button--danger {
  background: transparent;
  border: 1.5px solid var(--danger);
  color: var(--danger);
  font-weight: 600;
  border-radius: var(--radius);
}

.el-button--danger:hover {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}

.el-button--danger.is-plain {
  background: transparent;
  border: 1.5px solid var(--danger);
  color: var(--danger);
}

.el-button--danger.is-plain:hover {
  background: var(--danger);
  color: #fff;
}

/* Radio Button */
.el-radio-button__inner {
  background: transparent !important;
  border-color: var(--border) !important;
  color: var(--text-secondary) !important;
}

.el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: var(--dark) !important;
  border-color: var(--dark) !important;
  color: #fff !important;
  box-shadow: -1px 0 0 0 var(--dark) !important;
}

/* Scrollbar */
.el-scrollbar__bar.is-horizontal,
.el-scrollbar__bar.is-vertical {
  opacity: 0.4;
}

/* Radio / Checkbox */
.el-radio__label,
.el-checkbox__label {
  color: var(--text) !important;
}

/* InputNumber */
.el-input-number .el-input-number__decrease,
.el-input-number .el-input-number__increase {
  background: var(--bg-hover) !important;
  border-color: var(--border) !important;
  color: var(--text-secondary) !important;
}

/* Breadcrumb */
.el-breadcrumb__inner {
  color: var(--text-muted) !important;
}

.el-breadcrumb__separator {
  color: var(--border) !important;
}

/* Timeline */
.el-timeline-item__wrapper {
  padding-left: 20px;
}

/* MessageBox */
.el-message-box {
  background: #fff !important;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.el-message-box__title {
  color: var(--dark);
  font-weight: 700;
}

.el-message-box__content {
  color: var(--text);
}

/* Overlay */
.el-overlay {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
