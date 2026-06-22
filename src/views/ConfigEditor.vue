<template>
  <div class="config-editor">
    <div class="header">
      <h2>编辑配置</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <div v-if="loading" style="text-align:center;padding:40px;">加载中...</div>

    <el-form v-else :model="config" label-width="100px">
      <el-form-item label="任务名称">
        <el-input v-model="config.site.name" />
      </el-form-item>
      <el-form-item label="目标网址">
        <el-input v-model="config.site.url" />
      </el-form-item>
      <el-form-item label="执行时间">
        <el-time-picker v-model="config.schedule" format="HH:mm" value-format="HH:mm" />
      </el-form-item>

      <el-divider content-position="left">回放设置</el-divider>

      <el-form-item label="起始步骤">
        <el-select v-model="config.checkin.start_from_step" placeholder="从第1步开始（默认）">
          <el-option
            v-for="(step, index) in config.checkin.steps"
            :key="index"
            :label="`从第 ${index + 1} 步开始: ${step.name || '未命名'}`"
            :value="index"
          />
        </el-select>
        <div style="color:#999;font-size:12px;margin-top:4px;">
          回放时会跳过起始步骤之前的所有步骤（通常是登录操作），因为 Cookie 已保存登录状态
        </div>
      </el-form-item>

      <el-divider content-position="left">签到步骤</el-divider>

      <div v-for="(step, index) in config.checkin.steps" :key="index" class="step-editor">
        <el-card shadow="never">
          <div class="step-header">
            <span class="step-num">步骤 {{ index + 1 }}: {{ step.name || '未命名' }}</span>
            <div>
              <el-button size="small" :disabled="index === 0" @click="moveStep(index, -1)">上移</el-button>
              <el-button size="small" :disabled="index === config.checkin.steps.length - 1" @click="moveStep(index, 1)">下移</el-button>
              <el-button size="small" type="danger" text @click="removeStep(index)">删除</el-button>
            </div>
          </div>

          <el-form-item label="操作类型">
            <el-select v-model="step.action" @change="onActionChange(step)">
              <el-option label="点击元素" value="click" />
              <el-option label="跳转链接(href)" value="goto_href" />
              <el-option label="关闭弹窗" value="dismiss_popup" />
              <el-option label="等待" value="wait" />
            </el-select>
          </el-form-item>

          <el-form-item label="名称">
            <el-input v-model="step.name" placeholder="步骤描述" />
          </el-form-item>

          <template v-if="step.action === 'dismiss_popup'">
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
        </el-card>
      </div>

      <el-button type="dashed" style="width:100%;margin-top:16px;" @click="addStep">+ 添加步骤</el-button>

      <el-divider content-position="left">结果验证</el-divider>

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
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTask, updateTask, runConfig } from '../api'

const route = useRoute()
const router = useRouter()
const config = reactive({
  site: { name: '', url: '', type: 'web' },
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

onMounted(async () => {
  try {
    const task = await getTask(route.params.id)
    Object.assign(config, task.config)
    config.schedule = task.schedule || '08:00'
  } catch (e) {
    ElMessage.error('加载配置失败')
  }
  loading.value = false
})

const addStep = () => {
  config.checkin.steps.push({ name: '', action: 'click', selector: '', timeout: 10000 })
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
  if (step.action === 'dismiss_popup') {
    step.selectors = step.selectors || ['']
    step.timeout = step.timeout || 5000
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
    await updateTask(route.params.id, { config, schedule: config.schedule })
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
.config-editor { max-width: 800px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.step-editor { margin-bottom: 16px; }
.step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.step-num { font-weight: bold; }
.tag-input { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.actions { margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee; }
</style>
