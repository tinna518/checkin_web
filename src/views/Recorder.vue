<template>
  <div class="recorder">
    <h2>录制新任务</h2>

    <!-- 任务类型选择 -->
    <el-form :model="form" label-width="100px">
      <el-form-item label="任务类型">
        <el-radio-group v-model="form.type" :disabled="recording">
          <el-radio-button value="web">网页端</el-radio-button>
          <el-radio-button value="desktop">桌面端</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="任务名称">
        <el-input v-model="form.name" placeholder="例如：WPS社区签到" />
      </el-form-item>
      <!-- 网页端：显示 URL 输入 -->
      <el-form-item v-if="form.type === 'web'" label="目标网址">
        <el-input v-model="form.url" placeholder="https://example.com" />
      </el-form-item>
      <!-- 桌面端：显示程序路径输入 + 浏览按钮 -->
      <el-form-item v-if="form.type === 'desktop'" label="程序路径">
        <div style="display:flex;gap:8px;width:100%;">
          <el-input v-model="form.processPath" placeholder="选择或输入程序路径（可选，留空则连接已运行的程序）" />
          <el-button @click="showFileBrowser = true" class="custBttton" :disabled="recording">浏览</el-button>
        </div>
      </el-form-item>
    </el-form>

    <div class="recorder-controls">
      <el-button v-if="!recording" type="primary" :loading="starting" class="start-record-btn"
        :disabled="!form.name || (form.type === 'web' && !form.url)" @click="startRecord">
        开始录制
      </el-button>
      <el-button v-else type="danger" :loading="stopping" @click="stopRecord">
        结束录制
      </el-button>
    </div>

    <!-- 录制状态 -->
    <el-alert v-if="recording && form.type === 'web'" type="info" :closable="false" style="margin:16px 0;">
      <strong>录制中...</strong> 请在弹出的浏览器窗口中完成签到操作，完成后点击"结束录制"
    </el-alert>
    <el-alert v-if="recording && form.type === 'desktop'" type="info" :closable="false" style="margin:16px 0;">
      <strong>录制中...</strong> 请在目标桌面程序中完成签到操作（全局监听鼠标键盘），完成后点击"结束录制"
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
          :type="getTimelineType(step)">
          <div class="step-item">
            <el-tag size="small" :type="getTagType(step)">{{ getActionLabel(step.action) }}</el-tag>
            <!-- 网页端步骤信息 -->
            <template v-if="form.type === 'web'">
              <code class="step-selector" v-if="step.selector">{{ step.selector }}</code>
              <span v-if="step.text" class="step-text">{{ step.text }}</span>
              <el-tag v-if="step.page_index > 0" size="small" type="info">
                页面{{ step.page_index + 1 }}
              </el-tag>
            </template>
            <!-- 桌面端步骤信息 -->
            <template v-if="form.type === 'desktop'">
              <span v-if="step.control_name" class="step-text">{{ step.control_name }}</span>
              <el-tag v-if="step.control_type" size="small" type="info">{{ step.control_type }}</el-tag>
              <span v-if="step.window_title" class="step-window">{{ step.window_title }}</span>
              <span v-if="step.key" class="step-text">按键: {{ step.key }}</span>
              <span v-if="step.value" class="step-text">输入: {{ step.value }}</span>
            </template>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 回放起始步骤选择（仅网页端） -->
    <div v-if="form.type === 'web' && steps.length > 1" class="start-step-section">
      <el-form :model="replayForm" inline>
        <el-form-item label="回放起始步骤">
          <el-select v-model="replayForm.startFromStep" style="width: 320px;">
            <el-option
              v-for="(step, i) in steps"
              :key="i"
              :label="`从第 ${i + 1} 步开始: ${step.text || step.action}`"
              :value="i"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div style="color:#999;font-size:12px;margin-top:-8px;">
        回放时会跳过起始步骤之前的所有步骤（如登录操作），因为 Cookie 已保存登录状态
      </div>
    </div>

    <!-- 保存 -->
    <div v-if="steps.length > 0" class="save-section">
      <el-form :model="scheduleForm" inline>
        <el-form-item label="定时执行">
          <el-time-picker v-model="scheduleForm.time" format="HH:mm" value-format="HH:mm" placeholder="选择时间" />
        </el-form-item>
      </el-form>
      <div style="display:flex;gap:12px;align-items:center;">
        <el-button type="success" :loading="saving" @click="saveConfig">保存任务</el-button>
        <el-button @click="router.push('/')">取消</el-button>
      </div>
    </div>

    <!-- 文件浏览弹窗 -->
    <el-dialog v-model="showFileBrowser" title="选择程序" width="640px" :close-on-click-modal="false">
      <div class="file-browser">
        <!-- 当前路径 -->
        <div class="browser-path">
          <el-button size="small" text @click="navigateTo('')">🏠 常用目录</el-button>
          <el-button v-if="browserData.parent" size="small" text @click="navigateTo(browserData.parent)">
            ⬆ 返回上级
          </el-button>
          <span class="current-path">{{ browserData.current || '常用目录' }}</span>
        </div>
        <!-- 磁盘列表（始终显示，方便随时切换磁盘） -->
        <div v-if="browserData.drives && browserData.drives.length" class="drive-list">
          <span class="drive-label">磁盘:</span>
          <el-button v-for="drive in browserData.drives" :key="drive" size="small" plain
            :type="browserData.current && browserData.current.startsWith(drive) ? 'primary' : ''"
            @click="navigateTo(drive)">{{ drive }}</el-button>
        </div>
        <!-- 文件列表 -->
        <div class="file-list" v-loading="browserLoading">
          <div v-for="item in browserData.items" :key="item.path"
            class="file-item" :class="{ 'is-dir': item.type === 'dir', 'is-exe': item.type === 'exe' }"
            @click="item.type === 'dir' ? navigateTo(item.path) : selectFile(item.path)">
            <span class="file-icon">{{ item.type === 'dir' ? '📁' : '⚙️' }}</span>
            <span class="file-name">{{ item.name }}</span>
          </div>
          <el-empty v-if="!browserLoading && browserData.items.length === 0" description="此目录下没有程序文件" :image-size="60" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showFileBrowser = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  startRecording, stopRecording, getRecordingStatus,
  startDesktopRecording, stopDesktopRecording, getDesktopRecordingStatus,
  createTask, browseFiles
} from '../api'

const router = useRouter()
const form = reactive({ name: '', url: '', processPath: '', type: 'web' })
const scheduleForm = reactive({ time: '08:00' })
const replayForm = reactive({ startFromStep: 0 })
const recording = ref(false)
const starting = ref(false)
const stopping = ref(false)
const saving = ref(false)
const steps = ref([])
const cookieFile = ref(null)

// ── 文件浏览器状态 ──────────────
const showFileBrowser = ref(false)
const browserLoading = ref(false)
const browserData = reactive({ current: '', parent: '', drives: [], items: [] })

const navigateTo = async (path) => {
  browserLoading.value = true
  try {
    const result = await browseFiles(path)
    Object.assign(browserData, result)
  } catch (e) {
    ElMessage.error('无法访问该目录')
  }
  browserLoading.value = false
}

const selectFile = (path) => {
  form.processPath = path
  showFileBrowser.value = false
  ElMessage.success(`已选择: ${path.split('\\').pop()}`)
}

// 打开弹窗时加载初始目录
watch(showFileBrowser, (val) => {
  if (val && !browserData.current) {
    navigateTo('')
  }
})

const startRecord = async () => {
  starting.value = true
  try {
    if (form.type === 'desktop') {
      await startDesktopRecording(form.processPath, form.name)
      ElMessage.info('桌面录制正在启动，请稍候...')
      let retries = 0
      const poll = setInterval(async () => {
        retries++
        try {
          const status = await getDesktopRecordingStatus()
          if (status.status === 'recording') {
            clearInterval(poll)
            recording.value = true
            starting.value = false
            ElMessage.success('录制已开始，请在桌面程序中操作')
          } else if (status.status === 'error') {
            clearInterval(poll)
            starting.value = false
            ElMessage.error('启动失败: ' + (status.error || '未知错误'))
          } else if (retries > 30) {
            clearInterval(poll)
            starting.value = false
            ElMessage.error('启动超时')
          }
        } catch (e) { /* ignore */ }
      }, 1000)
    } else {
      await startRecording(form.url, form.name)
      ElMessage.info('浏览器正在启动，请稍候...')
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
        } catch (e) { /* ignore */ }
      }, 1000)
    }
  } catch (e) {
    ElMessage.error('启动录制失败: ' + (e.response?.data?.detail || e.message))
    starting.value = false
  }
}

const stopRecord = async () => {
  stopping.value = true
  try {
    if (form.type === 'desktop') {
      const result = await stopDesktopRecording()
      steps.value = result.steps || []
      recording.value = false
      if (steps.value.length === 0) {
        ElMessage.warning('未录制到任何操作')
      } else {
        ElMessage.success(`录制完成: ${steps.value.length} 个步骤`)
      }
    } else {
      const result = await stopRecording()
      steps.value = result.steps || []
      cookieFile.value = result.cookie_file || null
      recording.value = false
      if (steps.value.length === 0) {
        ElMessage.warning('未录制到任何操作')
      } else {
        ElMessage.success(`录制完成: ${steps.value.length} 个步骤`)
      }
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
  const map = {
    click: '点击',
    goto_href: '跳转',
    fill: '填写',
    dismiss_popup: '关闭弹窗',
    switch_page: '切换页面',
    wait: '等待',
    input: '输入',
    key_press: '按键',
    wait_window: '等待窗口',
  }
  return map[action] || action
}

const getTimelineType = (step) => {
  const map = {
    click: 'primary',
    goto_href: 'warning',
    fill: 'primary',
    dismiss_popup: 'success',
    switch_page: 'danger',
    wait: 'info',
    key_press: 'warning',
    wait_window: 'info',
  }
  return map[step.action] || 'primary'
}

const getTagType = (step) => {
  if (step.action === 'switch_page' || step.action === 'wait_window') return 'danger'
  if (step.action === 'fill' || step.action === 'key_press') return 'warning'
  return ''
}

const saveConfig = async () => {
  saving.value = true
  try {
    let config

    if (form.type === 'desktop') {
      // 提取主窗口信息用于回放时精准还原窗口尺寸
      const validSteps = steps.value.filter(s => s.window_title && s.window_width && s.window_height);
      const firstValid = validSteps[0] || {};

      // 桌面端配置
      config = {
        site: {
          name: form.name,
          process: form.processPath,
          type: 'desktop',
          window_title: firstValid.window_title || '',
          window_width: firstValid.window_width || null,
          window_height: firstValid.window_height || null,
        },
        checkin: {
          steps: steps.value.map((s, i) => ({
            name: s.name || `步骤${i + 1}: ${s.control_name || s.action}`,
            action: s.action,
            window_title: s.window_title || '',
            control_type: s.control_type || '',
            control_name: s.control_name || '',
            control_class: s.control_class || '',
            automation_id: s.automation_id || '',
            x: s.x,
            y: s.y,
            relative_x: s.relative_x,
            relative_y: s.relative_y,
            timeout: s.timeout || 5000,
            ...(s.key ? { key: s.key } : {}),
            ...(s.value ? { value: s.value } : {}),
          })),
          start_from_step: 0,
        },
        verify: { success: ['签到成功', '已签到', '完成'], fail: ['请先登录', '签到失败'] },
      }
    } else {
      // 网页端配置（原有逻辑）
      const cookiePath = cookieFile.value || `./output/${form.name}_cookies.json`
      config = {
        site: { name: form.name, url: form.url, type: 'web' },
        login: { method: 'cookie', cookie_file: cookiePath },
        checkin: {
          steps: steps.value.map((s, i) => {
            const base = {
              name: `步骤${i + 1}: ${s.text || s.action}`.slice(0, 40),
              action: s.action,
              selector: s.selector,
              page_index: s.page_index || 0,
            }
            if (s.action === 'goto_href') {
              base.wait = 3
            } else if (s.action === 'click') {
              base.timeout = 10000
            } else if (s.action === 'fill') {
              base.value = s.text || ''
              base.timeout = 5000
            } else if (s.action === 'switch_page') {
              base.name = `切换到页面 ${(s.page_index || 0) + 1}`
              base.page_index = s.page_index || 0
              delete base.selector
            }
            return base
          })
        },
        verify: { success: ['签到成功', '已签到'], fail: ['请先登录'] }
      }
      if (replayForm.startFromStep > 0) {
        config.checkin.start_from_step = replayForm.startFromStep
      }
    }

    await createTask({
      name: form.name,
      url: form.type === 'web' ? form.url : '',
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
.recorder h2 { color: var(--dark); font-weight: 800; font-size: 28px; letter-spacing: -0.5px; }
.recorder-controls { margin: 20px 0; }
.steps-card { margin-top: 20px; }
.step-item { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; color: var(--text); }
.step-selector { color: var(--dark); font-size: 13px; background: var(--bg-hover); padding: 2px 6px; border-radius: 3px; font-weight: 600; }
.step-text { color: var(--text-secondary); font-size: 13px; }
.step-window { color: var(--text-muted); font-size: 12px; font-style: italic; }
.start-step-section { margin-top: 20px; padding: 16px; background: var(--bg-hover); border-radius: var(--radius); }
.save-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }

/* 文件浏览器 */
.file-browser { min-height: 300px; }
.browser-path { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.current-path { color: var(--text-secondary); font-size: 13px; word-break: break-all; flex: 1; min-width: 100px; }
.drive-list { display: flex; gap: 6px; margin-bottom: 12px; padding: 8px 10px; background: var(--bg-hover); border-radius: 6px; align-items: center; flex-wrap: wrap; }
.drive-label { color: var(--text-muted); font-size: 12px; margin-right: 4px; }
.file-list { max-height: 350px; overflow-y: auto; }
.file-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: var(--text); }
.file-item:hover { background: var(--bg-hover); }
.file-item.is-dir .file-name { font-weight: 500; }
.file-item.is-exe .file-name { color: var(--dark); font-weight: 600; }
.file-icon { font-size: 18px; flex-shrink: 0; }
.file-name { font-size: 14px; }
.custBttton{
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
/* 开始录制按钮：禁用时保持黑色底（可点击状态保持 Element Plus 默认蓝色） */
.start-record-btn.is-disabled,
.start-record-btn.is-disabled:hover {
  background-color: var(--dark) !important;
  border-color: var(--dark) !important;
  color: #fff !important;
  opacity: 0.5;
}
</style>
