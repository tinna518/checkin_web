<template>
  <div class="task-list">
    <div class="header">
      <h2>任务列表</h2>
      <el-button type="primary" @click="$router.push('/record')">+ 新建任务</el-button>
    </div>

    <el-empty v-if="loading === false && tasks.length === 0" description="暂无任务，点击右上角创建" />

    <div v-if="loading" style="text-align:center;padding:40px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <el-card v-for="task in tasks" :key="task.id" class="task-card">
      <div class="task-info">
        <div class="task-name">
          {{ task.name }}
          <el-tag size="small" :type="task.enabled ? 'success' : 'info'" style="margin-left:8px;">
            {{ task.enabled ? '运行中' : '已暂停' }}
          </el-tag>
        </div>
        <div class="task-url">{{ task.url }}</div>
        <div class="task-meta">
          <span>定时: {{ task.schedule || '08:00' }}</span>
          <span v-if="task.last_run" class="last-run">
            上次: {{ formatTime(task.last_run) }}
            <el-tag size="small" :type="task.last_result?.success ? 'success' : 'danger'">
              {{ task.last_result?.success ? '成功' : '失败' }}
            </el-tag>
          </span>
        </div>
      </div>
      <div class="task-actions">
        <el-button size="small" @click="$router.push(`/edit/${task.id}`)">编辑</el-button>
        <el-button size="small" type="success" :loading="runningId === task.id" @click="testRun(task)">
          测试运行
        </el-button>
        <el-button size="small" @click="$router.push({ path: '/logs', query: { task: task.name } })">日志</el-button>
        <el-button size="small" @click="toggleEnabled(task)">
          {{ task.enabled ? '暂停' : '启用' }}
        </el-button>
        <el-button size="small" type="danger" @click="handleDelete(task)">删除</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getTasks, runTask, updateTask, deleteTask } from '../api'

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

const formatTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN')
}
</script>

<style scoped>
.task-list { max-width: 900px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.task-card { margin-bottom: 16px; }
.task-info { margin-bottom: 12px; }
.task-name { font-size: 18px; font-weight: bold; }
.task-url { color: #666; font-size: 14px; margin-top: 4px; }
.task-meta { margin-top: 8px; display: flex; gap: 20px; font-size: 13px; color: #999; }
.last-run { display: flex; align-items: center; gap: 8px; }
</style>
