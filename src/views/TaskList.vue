<template>
  <div class="task-list">
    <div class="header">
      <h2>自动化任务中心</h2>
      <el-button type="primary" size="large" @click="$router.push('/record')">
        <el-icon style="margin-right:4px;"><Plus /></el-icon>新建可视化任务
      </el-button>
    </div>

    <el-empty v-if="loading === false && tasks.length === 0" description="暂无任务，点击右上角创建" />

    <div v-if="loading" style="text-align:center;padding:40px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else class="task-grid">
      <div v-for="task in tasks" :key="task.id" class="task-card" :class="{ disabled: !task.enabled }">
        <!-- 顶部装饰条 -->
        <div class="task-card-strip" :class="getTaskType(task)"></div>

        <!-- 头部：类型 + 状态 -->
        <div class="task-card-header">
          <div class="task-type-badge" :class="getTaskType(task)">
            <el-icon style="margin-right:4px;">
              <component :is="getTaskType(task) === 'desktop' ? 'Monitor' : 'Link'" />
            </el-icon>
            {{ getTaskType(task) === 'desktop' ? '桌面端' : '网页端' }}
          </div>
          <div class="task-status-dot" :class="task.enabled ? 'on' : 'off'">
            <span class="dot"></span>
            {{ task.enabled ? '运行中' : '已暂停' }}
          </div>
        </div>

        <!-- 主体：任务名称 + 目标 -->
        <div class="task-card-body" @click="$router.push(`/edit/${task.id}`)">
          <div class="task-name" :title="task.name">{{ task.name }}</div>
          <div class="task-target" :title="getTaskTarget(task)">
            <el-icon style="margin-right:4px;font-size:14px;"><Link /></el-icon>
            {{ getTaskTarget(task) || '未设置' }}
          </div>
        </div>

        <!-- 信息区：时间 + 状态 -->
        <div class="task-card-info">
          <div class="info-item">
            <div class="info-label">定时</div>
            <div class="info-value">
              <el-icon style="margin-right:2px;"><Clock /></el-icon>
              {{ task.schedule || '08:00' }}
            </div>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <div class="info-label">最近</div>
            <div class="info-value" :class="getLastRunClass(task)">
              <template v-if="task.last_run">
                <el-icon style="margin-right:2px;">
                  <component :is="task.last_result?.success ? 'CircleCheck' : 'CircleClose'" />
                </el-icon>
                {{ formatTime(task.last_run) }}
              </template>
              <template v-else>
                <span style="color:#c0c4cc;">未运行</span>
              </template>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="task-card-footer">
          <div class="action-btn edit" @click.stop="$router.push(`/edit/${task.id}`)">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </div>
          <div class="action-btn run" :class="{ loading: runningId === task.id }" @click.stop="testRun(task)">
            <el-icon v-if="runningId !== task.id" class="is-loading-run"><VideoPlay /></el-icon>
            <span>{{ runningId === task.id ? '运行中' : '运行' }}</span>
          </div>
          <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, task)">
            <div class="action-btn more" @click.stop>
              <el-icon><MoreFilled /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logs">
                  <el-icon><Document /></el-icon>查看日志
                </el-dropdown-item>
                <el-dropdown-item command="toggle">
                  <el-icon><component :is="task.enabled ? 'VideoPause' : 'VideoPlay'" /></el-icon>
                  {{ task.enabled ? '暂停任务' : '启用任务' }}
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon style="color:#f56c6c;"><Delete /></el-icon>
                  <span style="color:#f56c6c;">删除任务</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Loading, Plus, Monitor, Link, Clock, CircleCheck, CircleClose,
  Edit, VideoPlay, VideoPause, MoreFilled, Document, Delete
} from '@element-plus/icons-vue'
import { getTasks, runTask, updateTask, deleteTask } from '../api'

const router = useRouter()
const tasks = ref([])
const loading = ref(true)
const runningId = ref(null)

onMounted(async () => {
  await loadTasks()
})

const loadTasks = async () => {
  loading.value = true
  try {
    tasks.value = await getTasks()
  } catch (e) {
    ElMessage.error('加载任务失败')
  }
  loading.value = false
}

const testRun = async (task) => {
  runningId.value = task.id
  try {
    const result = await runTask(task.id, true)
    if (result.success) {
      ElMessage.success(`签到成功: ${result.message}`)
    } else {
      ElMessage.error(`签到失败: ${result.message}`)
    }
    await loadTasks()
  } catch (e) {
    ElMessage.error('执行失败: ' + (e.response?.data?.detail || e.message))
  }
  runningId.value = null
}

const toggleEnabled = async (task) => {
  try {
    await updateTask(task.id, { enabled: !task.enabled })
    ElMessage.success(task.enabled ? '已暂停' : '已启用')
    await loadTasks()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (task) => {
  try {
    await ElMessageBox.confirm(`确认删除任务 "${task.name}"？`, '提示', { type: 'warning' })
    await deleteTask(task.id)
    ElMessage.success('删除成功')
    await loadTasks()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleCommand = async (cmd, task) => {
  if (cmd === 'logs') {
    router.push({ path: '/logs', query: { task: task.name } })
  } else if (cmd === 'toggle') {
    await toggleEnabled(task)
  } else if (cmd === 'delete') {
    await handleDelete(task)
  }
}

const getTaskType = (task) => {
  return task.config?.site?.type || 'web'
}

const getTaskTarget = (task) => {
  if (getTaskType(task) === 'desktop') {
    return task.config?.site?.process || '桌面程序'
  }
  return task.config?.site?.url || task.url || ''
}

const getLastRunClass = (task) => {
  if (!task.last_run) return ''
  return task.last_result?.success ? 'success' : 'failed'
}

const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.task-list {
  margin: 0;
  padding: 0;
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* ============ 卡片主体 ============ */
.task-card {
  position: relative;
  height: 240px;
  border-radius: 14px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.task-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 8px 16px rgba(102, 126, 234, 0.12),
    0 16px 32px rgba(102, 126, 234, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.task-card.disabled {
  opacity: 0.65;
  filter: grayscale(0.3);
}

/* 顶部装饰条 */
.task-card-strip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.task-card-strip.desktop {
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
}

/* ============ 头部 ============ */
.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 8px;
}

.task-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4f46e5;
}

.task-type-badge.desktop {
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
  color: #be185d;
}

.task-status-dot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #909399;
}

.task-status-dot .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c0c4cc;
  position: relative;
}

.task-status-dot.on {
  color: #67c23a;
}

.task-status-dot.on .dot {
  background: #67c23a;
  box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.6);
  animation: pulse 2s infinite;
}

.task-status-dot.off {
  color: #909399;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.6);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(103, 194, 58, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0);
  }
}

/* ============ 主体 ============ */
.task-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 20px;
  min-height: 0;
}

.task-name {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
  letter-spacing: -0.2px;
}

.task-target {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

/* ============ 信息区 ============ */
.task-card-info {
  display: flex;
  align-items: center;
  margin: 0 20px;
  padding: 12px 0;
  border-top: 1px dashed #e5e7eb;
  border-bottom: 1px dashed #e5e7eb;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.info-value {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.info-value.success {
  color: #67c23a;
}

.info-value.failed {
  color: #f56c6c;
}

.info-divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 12px;
}

/* ============ 底部操作 ============ */
.task-card-footer {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fafbfc;
  gap: 4px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
}

.action-btn.edit:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.action-btn.run {
  color: #67c23a;
}

.action-btn.run:hover {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.action-btn.run.loading {
  color: #e6a23c;
  pointer-events: none;
}

.action-btn.more {
  flex: 0 0 36px;
}

.action-btn .el-icon {
  font-size: 16px;
}

.is-loading-run {
  animation: rotating 1.5s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
