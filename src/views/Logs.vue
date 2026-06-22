<template>
  <div class="logs">
    <div class="header">
      <h2>运行日志</h2>
      <div class="filters">
        <el-input v-model="taskFilter" placeholder="按任务名筛选" clearable style="width:200px;" @input="loadLogs" />
        <el-button @click="loadLogs">刷新</el-button>
      </div>
    </div>

    <div v-if="loading" style="text-align:center;padding:40px;">加载中...</div>

    <el-table v-else :data="logs" style="width: 100%" :default-sort="{ prop: 'time', order: 'descending' }">
      <el-table-column prop="time" label="时间" width="180" sortable />
      <el-table-column prop="task" label="任务" width="140" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.success ? 'success' : 'danger'">
            {{ row.success ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="message" label="详细信息" show-overflow-tooltip />
    </el-table>

    <el-empty v-if="!loading && logs.length === 0" description="暂无日志" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLogs } from '../api'

const route = useRoute()
const logs = ref([])
const loading = ref(true)
const taskFilter = ref('')

onMounted(async () => {
  if (route.query.task) {
    taskFilter.value = route.query.task
  }
  await loadLogs()
})

const loadLogs = async () => {
  loading.value = true
  try {
    logs.value = await getLogs(taskFilter.value || undefined)
  } catch (e) {
    ElMessage.error('加载日志失败')
  }
  loading.value = false
}
</script>

<style scoped>
.logs { max-width: 1000px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.filters { display: flex; gap: 12px; }
</style>
