<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <h1>T.</h1>
        <p class="brand-subtitle">登录你的账号以继续</p>
      </div>

      <el-form :model="form" @keyup.enter="handleLogin" class="auth-form">
        <el-form-item>
          <!-- <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          /> -->
           <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <!-- <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          /> -->
           <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="handleLogin"
          >登 录</el-button>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { login } from '../api'

const router = useRouter()
const form = ref({ username: '', password: '' })
const loading = ref(false)

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  try {
    loading.value = true
    const res = await login(form.value.username, form.value.password)
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('username', res.username)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg);
}

.auth-card {
  width: 380px;
  padding: 48px 36px 32px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.auth-brand {
  text-align: center;
  margin-bottom: 36px;
}

.auth-brand h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: var(--dark);
  letter-spacing: -1px;
}

.brand-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--text-muted);
}

.auth-form :deep(.el-input__wrapper) {
  background: var(--bg-input) !important;
  box-shadow: none !important;
  border-radius: var(--radius);
  padding: 4px 12px;
}

.auth-form :deep(.el-input__wrapper:hover) {
  background: #efe9c8 !important;
}

.auth-form :deep(.el-input__wrapper.is-focus) {
  background: #fff !important;
  box-shadow: 0 0 0 1.5px var(--dark) !important;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2px;
  border: none;
  border-radius: var(--radius);
  background: var(--dark);
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-muted);
}

.auth-footer a {
  color: var(--dark);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1.5px solid var(--dark);
  padding-bottom: 1px;
  transition: opacity 0.2s;
}

.auth-footer a:hover {
  opacity: 0.7;
}
</style>
