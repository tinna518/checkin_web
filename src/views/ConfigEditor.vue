<template>
  <div class="config-editor">
    <div class="header">
      <h2>编辑配置</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <div v-if="loading" style="text-align:center;padding:40px;">加载中...</div>

    <el-form v-else :model="config" label-width="100px">
      <el-form-item label="任务类型">
        <el-tag :effect="isDesktop ? 'dark' : 'plain'">
          {{ isDesktop ? '桌面端' : '网页端' }}
        </el-tag>
      </el-form-item>
      <el-form-item label="任务名称">
        <el-input v-model="config.site.name" />
      </el-form-item>
      <!-- 网页端：URL -->
      <el-form-item v-if="!isDesktop" label="目标网址">
        <el-input v-model="config.site.url" />
      </el-form-item>
      <!-- 桌面端：程序路径 -->
      <el-form-item v-if="isDesktop" label="程序路径">
        <el-input v-model="config.site.process" placeholder="C:\Program Files\App\app.exe" />
      </el-form-item>
      <el-form-item label="执行时间">
        <el-time-picker v-model="config.schedule" format="HH:mm" value-format="HH:mm" />
      </el-form-item>

      <!-- 网页端：回放设置 (移动到最下方) -->
      <template v-if="!isDesktop">
      </template>

      <el-divider content-position="left" class="custom-divider">
        <el-icon><CopyDocument /></el-icon> 签 到 步 骤
      </el-divider>

      <div v-for="(step, index) in config.checkin.steps" :key="index" class="step-editor">
        <el-card shadow="never">
          <div class="step-header" @click="step._collapsed = !step._collapsed" style="cursor:pointer;">
            <span class="step-num">
              <el-icon style="margin-right:8px;transition:0.3s;" :style="{ transform: step._collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }">
                <ArrowDown />
              </el-icon>
              步骤 {{ index + 1 }}: {{ step.name || '未命名' }}
              <el-tag v-if="!isDesktop && step.page_index > 0" size="small" type="info" style="margin-left:4px;">
                页面{{ step.page_index + 1 }}
              </el-tag>
              <el-tag v-if="isDesktop && step.window_title" size="small" type="info" style="margin-left:4px;">
                {{ step.window_title }}
              </el-tag>
              <el-tag size="small" style="margin-left:8px;" type="success">
                {{ step.action }}
              </el-tag>
            </span>
            <div @click.stop>
              <el-button size="small" :disabled="index === 0" @click="moveStep(index, -1)">上移</el-button>
              <el-button size="small" :disabled="index === config.checkin.steps.length - 1" @click="moveStep(index, 1)">下移</el-button>
              <el-button size="small" type="danger" text @click="removeStep(index)">删除</el-button>
            </div>
          </div>

          <div v-show="!step._collapsed">
            <!-- 后面所有的 form-item 都包裹在这里面 -->
            <el-form-item label="操作类型">
            <el-select v-model="step.action" @change="onActionChange(step)">
              <!-- 网页端操作 -->
              <template v-if="!isDesktop">
                <el-option label="点击元素" value="click" />
                <el-option label="跳转链接(href)" value="goto_href" />
                <el-option label="填写输入框" value="fill" />
                <el-option label="关闭弹窗" value="dismiss_popup" />
                <el-option label="切换页面" value="switch_page" />
                <el-option label="等待" value="wait" />
              </template>
              <!-- 桌面端操作 -->
              <template v-else>
                <el-option label="点击控件" value="click" />
                <el-option label="填写输入框" value="fill" />
                <el-option label="按键" value="key_press" />
                <el-option label="等待" value="wait" />
                <el-option label="等待窗口" value="wait_window" />
              </template>
            </el-select>
          </el-form-item>

          <el-form-item label="名称">
            <el-input v-model="step.name" placeholder="步骤描述" />
          </el-form-item>

          <!-- ═══ 桌面端步骤编辑 ═══ -->
          <template v-if="isDesktop">
            <!-- 通用：窗口标题 -->
            <el-form-item label="窗口标题" v-if="step.action !== 'wait'">
              <el-input v-model="step.window_title" placeholder="目标窗口标题" />
            </el-form-item>

            <template v-if="step.action === 'click'">
              <!-- 在大部分跨平台框架的桌面软件中，这些控件信息都是无用的黑盒容器名，所以我们默认隐藏它们以保持页面整洁，只在高级模式显示 -->
              <el-collapse style="margin-bottom: 18px; border: 1px dashed #dcdfe6; border-radius: 4px;" class="custom-collapse">
                <el-collapse-item>
                  <template #title>
                    <div style="color: #909399; font-size: 13px; display: flex; align-items: center; width: 100%;">
                      <el-icon style="margin-right: 6px;"><Setting /></el-icon>
                      展开高级控件选项 (普通桌面客户端无需填写此项)
                    </div>
                  </template>
                  <el-form-item label="控件名称">
                    <el-input v-model="step.control_name" placeholder="控件的文本/名称" />
                  </el-form-item>
                  <el-form-item label="控件类型">
                    <el-input v-model="step.control_type" placeholder="Button, Edit 等" />
                  </el-form-item>
                  <el-form-item label="控件类名">
                    <el-input v-model="step.control_class" placeholder="Win32 类名（可选）" />
                  </el-form-item>
                  <el-form-item label="AutomationId">
                    <el-input v-model="step.automation_id" placeholder="控件的 AutomationId" />
                  </el-form-item>
                </el-collapse-item>
              </el-collapse>

              <el-form-item label="坐标 (X, Y)">
                <div style="display:flex;gap:8px;align-items:center;">
                  <el-input-number v-model="step.x" :min="0" placeholder="X" style="width:120px;" />
                  <span>,</span>
                  <el-input-number v-model="step.y" :min="0" placeholder="Y" style="width:120px;" />
                  <span style="color:#999;font-size:12px;">控件找不到时用坐标兜底</span>
                </div>
              </el-form-item>
              <el-form-item label="超时(ms)">
                <el-input-number v-model="step.timeout" :min="1000" :max="30000" :step="1000" />
              </el-form-item>
            </template>

            <template v-else-if="step.action === 'fill'">
              <el-form-item label="控件名称">
                <el-input v-model="step.control_name" placeholder="输入框的名称" />
              </el-form-item>
              <el-form-item label="填写内容">
                <el-input v-model="step.value" placeholder="要填写的文本" />
              </el-form-item>
              <el-form-item label="超时(ms)">
                <el-input-number v-model="step.timeout" :min="1000" :max="30000" :step="1000" />
              </el-form-item>
            </template>

            <template v-else-if="step.action === 'key_press'">
              <el-form-item label="按键">
                <el-select v-model="step.key" filterable allow-create placeholder="选择或输入按键">
                  <el-option label="Enter" value="enter" />
                  <el-option label="Tab" value="tab" />
                  <el-option label="Escape" value="escape" />
                  <el-option label="Space" value="space" />
                  <el-option label="Backspace" value="backspace" />
                  <el-option label="Delete" value="delete" />
                  <el-option label="F5" value="f5" />
                </el-select>
              </el-form-item>
            </template>

            <template v-else-if="step.action === 'wait_window'">
              <el-form-item label="超时(ms)">
                <el-input-number v-model="step.timeout" :min="1000" :max="60000" :step="1000" />
              </el-form-item>
            </template>

            <template v-else-if="step.action === 'wait'">
              <el-form-item label="等待秒数">
                <el-input-number v-model="step.seconds" :min="1" :max="60" />
              </el-form-item>
            </template>
          </template>

          <!-- ═══ 网页端步骤编辑 ═══ -->
          <template v-else>
            <template v-if="step.action === 'switch_page'">
              <el-form-item label="目标页面">
                <el-input-number v-model="step.page_index" :min="0" :max="10" />
                <span style="color:#999;font-size:12px;margin-left:8px;">页面编号（0=主页面，1=第二个标签页...）</span>
              </el-form-item>
            </template>

            <template v-else-if="step.action === 'fill'">
              <el-form-item label="选择器">
                <el-input v-model="step.selector" placeholder="input[name='username']" />
              </el-form-item>
              <el-form-item label="填写内容">
                <el-input v-model="step.value" placeholder="要填写的文本" />
              </el-form-item>
              <el-form-item label="超时(ms)">
                <el-input-number v-model="step.timeout" :min="1000" :max="30000" :step="1000" />
              </el-form-item>
            </template>

            <template v-else-if="step.action === 'dismiss_popup'">
              <el-form-item label="选择器">
                <el-input v-for="(sel, si) in (step.selectors || [])" :key="si"
                  v-model="step.selectors[si]" style="margin-bottom:4px;" placeholder=".close-btn" />
                <el-button size="small" text @click="step.selectors = step.selectors || []; step.selectors.push('')">
                  + 添加选择器
                </el-button>
              </el-form-item>
              <el-form-item label="超时(ms)">
                <el-input-number v-model="step.timeout" :min="1000" :max="30000" :step="1000" />
              </el-form-item>
            </template>

            <template v-else-if="step.action === 'wait'">
              <el-form-item label="等待秒数">
                <el-input-number v-model="step.seconds" :min="1" :max="60" />
              </el-form-item>
            </template>

            <template v-else>
              <el-form-item label="选择器">
                <el-input v-model="step.selector" placeholder="a.sign 或 text=点击签到" />
              </el-form-item>
              <el-form-item label="超时(ms)">
                <el-input-number v-model="step.timeout" :min="1000" :max="30000" :step="1000" />
              </el-form-item>
              <el-form-item label="等待秒数" v-if="step.action === 'goto_href'">
                <el-input-number v-model="step.wait" :min="1" :max="10" />
              </el-form-item>
            </template>
          </template>
          </div>
        </el-card>
      </div>

      <el-divider content-position="left" class="custom-divider">
        <el-icon><Monitor /></el-icon> 结 果 验 证 与 高 级
      </el-divider>

      <!-- 网页端：回放设置放在这里 -->
      <template v-if="!isDesktop">
        <el-form-item label="起 始 步 骤" class="highlight-item">
          <el-select v-model="config.checkin.start_from_step" placeholder="从第1步开始（默认）" style="width:100%;">
            <el-option
              v-for="(step, index) in config.checkin.steps"
              :key="index"
              :label="`从第 ${index + 1} 步开始: ${step.name || '未命名'}`"
              :value="index"
            />
          </el-select>
          <div style="color:#666;font-size:13px;margin-top:6px;line-height:1.5;">
            回放时会跳过起始步骤之前的所有步骤（通常是登录操作），因为 Cookie 已保存登录状态。
          </div>
        </el-form-item>
      </template>

      <el-form-item label="成功关键词">
        <div class="tag-input">
          <el-tag v-for="(kw, i) in config.verify.success" :key="i" closable @close="config.verify.success.splice(i, 1)">
            {{ kw }}
          </el-tag>
          <el-input v-model="newSuccessKw" size="small" style="width:120px;" placeholder="回车添加"
            @keyup.enter="addKeyword('success')" />
        </div>
      </el-form-item>
      <el-form-item label="失败关键词">
        <div class="tag-input">
          <el-tag v-for="(kw, i) in config.verify.fail" :key="i" type="danger" closable @close="config.verify.fail.splice(i, 1)">
            {{ kw }}
          </el-tag>
          <el-input v-model="newFailKw" size="small" style="width:120px;" placeholder="回车添加"
            @keyup.enter="addKeyword('fail')" />
        </div>
      </el-form-item>
    </el-form>

    <div class="actions" v-if="!loading">
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      <el-button type="success" :loading="testing" @click="test">测试运行</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, CopyDocument, Monitor, Setting } from '@element-plus/icons-vue'
import { getTask, updateTask, runConfig } from '../api'

const route = useRoute()
const router = useRouter()
const config = reactive({
  site: { name: '', url: '', type: 'web', process: '' },
  login: { method: 'cookie', cookie_file: '' },
  checkin: { steps: [], start_from_step: 0 },
  verify: { success: [], fail: [] },
  schedule: '08:00'
})
const loading = ref(true)
const saving = ref(false)
const testing = ref(false)
const newSuccessKw = ref('')
const newFailKw = ref('')

const isDesktop = computed(() => config.site.type === 'desktop')

onMounted(async () => {
  try {
    const task = await getTask(route.params.id)
    Object.assign(config, task.config)
    config.schedule = task.schedule || '08:00'
    // 确保 process 字段存在
    if (!config.site.process) config.site.process = ''
    config.checkin.steps.forEach(step => {
      step._collapsed = true
    })
  } catch (e) {
    ElMessage.error('加载配置失败')
  }
  loading.value = false
})

const addStep = () => {
  if (isDesktop.value) {
    config.checkin.steps.push({
      name: '', action: 'click', window_title: '', control_name: '',
      control_type: '', control_class: '', automation_id: '',
      x: 0, y: 0, timeout: 5000, _collapsed: false
    })
  } else {
    config.checkin.steps.push({ name: '', action: 'click', selector: '', timeout: 10000, _collapsed: false })
  }
}

const removeStep = (i) => config.checkin.steps.splice(i, 1)

const moveStep = (i, dir) => {
  const j = i + dir
  if (j < 0 || j >= config.checkin.steps.length) return
  const temp = config.checkin.steps[i]
  config.checkin.steps[i] = config.checkin.steps[j]
  config.checkin.steps[j] = temp
}

const onActionChange = (step) => {
  if (isDesktop.value) {
    // 桌面端
    if (step.action === 'key_press') {
      step.key = step.key || 'enter'
    } else if (step.action === 'fill') {
      step.value = step.value || ''
      step.timeout = step.timeout || 5000
    } else if (step.action === 'click') {
      step.timeout = step.timeout || 5000
    } else if (step.action === 'wait_window') {
      step.timeout = step.timeout || 10000
    } else if (step.action === 'wait') {
      step.seconds = step.seconds || 1
    }
  } else {
    // 网页端
    if (step.action === 'dismiss_popup') {
      step.selectors = step.selectors || ['']
      step.timeout = step.timeout || 5000
    } else if (step.action === 'switch_page') {
      step.page_index = step.page_index || 1
      step.name = step.name || `切换到页面 ${(step.page_index || 1) + 1}`
    } else if (step.action === 'fill') {
      step.timeout = step.timeout || 5000
      step.value = step.value || ''
    }
  }
}

const addKeyword = (type) => {
  const kw = type === 'success' ? newSuccessKw.value.trim() : newFailKw.value.trim()
  if (!kw) return
  config.verify[type].push(kw)
  if (type === 'success') newSuccessKw.value = ''
  else newFailKw.value = ''
}

const save = async () => {
  saving.value = true
  try {
    await updateTask(route.params.id, {
      name: config.site.name,
      config,
      schedule: config.schedule
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
  saving.value = false
}

const test = async () => {
  testing.value = true
  try {
    const result = await runConfig(config, true)
    if (result.success) {
      ElMessage.success(`签到成功: ${result.message}`)
    } else {
      ElMessage.error(`签到失败: ${result.message}`)
    }
  } catch (e) {
    ElMessage.error('执行失败: ' + (e.response?.data?.detail || e.message))
  }
  testing.value = false
}
</script>

<style scoped>
.config-editor {
  max-width: 1000px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.header h2 {
  margin: 0;
}
.step-editor {
  margin-bottom: 16px;
}
.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.step-num {
  font-weight: bold;
}
.tag-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 优化表单留白 */
:deep(.el-form-item) {
  margin-bottom: 18px;
}
:deep(.el-form--inline .el-form-item) {
  margin-right: 24px;
}
:deep(.el-card__body) {
  padding: 16px 20px;
}

/* 强调样式与横线美化 */
.custom-divider {
  margin: 40px 0 24px;
}
:deep(.custom-divider .el-divider__text) {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f0f2f5; 
  /* 如果你的整体页面背景色是白色，这里可能需要改成 white。 */
}

.highlight-item {
  background: #fdf6ec; /* 温和的橙色提醒底色 */
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #faecd8;
}
:deep(.highlight-item .el-form-item__label) {
  font-weight: bold;
  color: #e6a23c;
}

:deep(.custom-collapse .el-collapse-item__header) {
  background: #fafafa;
  border-bottom: none;
  padding: 0 16px;
  border-radius: 4px;
}
:deep(.custom-collapse .el-collapse-item__wrap) {
  border-bottom: none;
  background: transparent;
  padding: 16px;
}
</style>
