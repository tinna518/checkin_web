<template>
  <div class="recorder">
    <h2>录制新任务</h2>

    <el-form :model="form" label-width="100px">
      <el-form-item label="任务名称">
        <el-input v-model="form.name" placeholder="例如：WPS社区签到" />
      </el-form-item>
      <el-form-item label="目标网址">
        <el-input v-model="form.url" placeholder="https://example.com" />
      </el-form-item>
    </el-form>

    <div class="recorder-controls">
      <el-button v-if="!recording" type="primary" :loading="starting"
        :disabled="!form.url || !form.name" @click="startRecord">
        开始录制
      </el-button>
      <el-button v-else type="danger" :loading="stopping" @click="stopRecord">
        结束录制
      </el-button>
    </div>

    <!-- 录制状态 -->
    <el-alert v-if="recording" type="info" :closable="false" style="margin:16px 0;">
      <strong>录制中...</strong> 请在弹出的浏览器窗口中完成签到操作，完成后点击"结束录制"
    </el-alert>

    <!-- 录制的步骤 -->
    <el-card v-if="steps.length > 0" class="steps-card">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>已录制 {{ steps.length }} 个步骤</span>
          <el-button size="small" @click="undoLast">撤销上一步</el-button>
        </div>
      </template>
      <el-timeline>
        <el-timeline-item v-for="(step, i) in steps" :key="i"
          :type="step.action === 'click' ? 'primary' : step.action === 'goto_href' ? 'warning' : 'success'">
          <div class="step-item">
            <el-tag size="small">{{ getActionLabel(step.action) }}</el-tag>
            <code class="step-selector">{{ step.selector }}</code>
            <span v-if="step.text" class="step-text">{{ step.text }}</span>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 保存 -->
    <div v-if="steps.length > 0" class="save-section">
      <el-form :model="scheduleForm" inline>
        <el-form-item label="定时执行">
          <el-time-picker v-model="scheduleForm.time" format="HH:mm" value-format="HH:mm" placeholder="选择时间" />
        </el-form-item>
      </el-form>
      <el-button type="success" :loading="saving" @click="saveConfig">保存任务</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { startRecording, stopRecording, createTask, getRecordingStatus } from '../api'

const router = useRouter()
const form = reactive({ name: '', url: '' })
const scheduleForm = reactive({ time: '08:00' })
const recording = ref(false)
const starting = ref(false)
const stopping = ref(false)
const saving = ref(false)
const steps = ref([])
const cookieFile = ref(null)  // 存储录制的 Cookie 文件路径

const startRecord = async () => {
  starting.value = true
  try {
    await startRecording(form.url, form.name)
    ElMessage.info('浏览器正在启动，请稍候...')
    // 轮询等待录制真正开始
    let retries = 0
    const poll = setInterval(async () => {
      retries++
      try {
        const status = await getRecordingStatus()
        if (status.status === 'recording') {
          clearInterval(poll)
          recording.value = true
          starting.value = false
          ElMessage.success('录制已开始，请在浏览器中操作')
        } else if (status.status === 'error') {
          clearInterval(poll)
          starting.value = false
          ElMessage.error('启动失败: ' + (status.error || '未知错误'))
        } else if (retries > 30) {
          clearInterval(poll)
          starting.value = false
          ElMessage.error('启动超时')
        }
      } catch (e) {
        // ignore
      }
    }, 1000)
  } catch (e) {
    ElMessage.error('启动录制失败: ' + (e.response?.data?.detail || e.message))
    starting.value = false
  }
}

const stopRecord = async () => {
  stopping.value = true
  try {
    const result = await stopRecording()
    steps.value = result.steps || []
    cookieFile.value = result.cookie_file || null  // 保存 Cookie 文件路径
    recording.value = false
    if (steps.value.length === 0) {
      ElMessage.warning('未录制到任何操作')
    } else {
      ElMessage.success(`录制完成: ${steps.value.length} 个步骤`)
    }
  } catch (e) {
    ElMessage.error('停止录制失败')
  }
  stopping.value = false
}

const undoLast = () => {
  steps.value.pop()
  ElMessage.info('已撤销')
}

const getActionLabel = (action) => {
  const map = { click: '点击', goto_href: '跳转', dismiss_popup: '关闭弹窗', wait: '等待', input: '输入' }
  return map[action] || action
}

const saveConfig = async () => {
  saving.value = true
  try {
    // 使用录制的 Cookie 文件路径，或生成默认路径
    const cookiePath = cookieFile.value || `./output/${form.name}_cookies.json`
    const config = {
      site: { name: form.name, url: form.url, type: 'web' },
      login: { method: 'cookie', cookie_file: cookiePath },
      checkin: {
        steps: steps.value.map((s, i) => ({
          name: `步骤${i + 1}: ${s.text || s.action}`.slice(0, 40),
          action: s.action,
          selector: s.selector,
          ...(s.action === 'goto_href' ? { wait: 3 } : {}),
          ...(s.action === 'click' ? { timeout: 10000 } : {})
        }))
      },
      verify: { success: ['签到成功', '已签到'], fail: ['请先登录'] }
    }
    await createTask({
      name: form.name,
      url: form.url,
      config,
      schedule: scheduleForm.time || '08:00'
    })
    ElMessage.success('任务已保存')
    router.push('/')
  } catch (e) {
    ElMessage.error('保存失败: ' + (e.response?.data?.detail || e.message))
  }
  saving.value = false
}
</script>

<style scoped>
.recorder { max-width: 800px; margin: 0 auto; }
.recorder-controls { margin: 20px 0; }
.steps-card { margin-top: 20px; }
.step-item { display: flex; align-items: center; gap: 10px; }
.step-selector { color: #409eff; font-size: 13px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
.step-text { color: #666; font-size: 13px; }
.save-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee; }
</style>
