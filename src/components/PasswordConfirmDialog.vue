<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="420px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="warning-icon" v-if="showWarning">
        <el-icon :size="48" color="#E74C3C"><Warning /></el-icon>
      </div>
      <p class="description">{{ description }}</p>
      <div class="password-hint" v-if="passwordHint">
        <el-icon><QuestionFilled /></el-icon>
        <span>密码提示：{{ passwordHint }}</span>
      </div>
      <el-form-item label="密码" required>
        <el-input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          show-password
          @keyup.enter="handleConfirm"
          ref="passwordInput"
          :disabled="loading"
        />
      </el-form-item>
      <div class="error-message" v-if="errorMessage">
        <el-icon><CircleCloseFilled /></el-icon>
        <span>{{ errorMessage }}</span>
      </div>
      <div class="attempt-info" v-if="failedAttempts > 0">
        <span>已尝试 {{ failedAttempts }} 次</span>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleClose" :disabled="loading">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, QuestionFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  modelValue: boolean
  title?: string
  description?: string
  confirmText?: string
  showWarning?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', password: string): void
  (e: 'cancel'): void
}>()

const store = useAppStore()

const visible = ref(props.modelValue)
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)
const passwordInput = ref()
const failedAttempts = ref(0)

const title = computed(() => props.title || '请确认操作')
const description = computed(() => props.description || '请输入密码以确认此操作')
const confirmText = computed(() => props.confirmText || '确认')
const showWarning = computed(() => props.showWarning !== false)
const passwordHint = computed(() => store.securitySettings?.passwordHint)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    password.value = ''
    errorMessage.value = ''
    failedAttempts.value = 0
    nextTick(() => {
      passwordInput.value?.focus()
    })
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  if (!loading.value) {
    visible.value = false
    emit('cancel')
  }
}

const handleConfirm = async () => {
  errorMessage.value = ''
  
  if (!store.hasMasterPassword) {
    emit('confirm', '')
    visible.value = false
    return
  }

  if (!password.value.trim()) {
    errorMessage.value = '请输入密码'
    return
  }

  loading.value = true
  
  try {
    const isValid = store.verifyMasterPassword(password.value)
    
    if (isValid) {
      failedAttempts.value = 0
      const confirmedPassword = password.value
      password.value = ''
      emit('confirm', confirmedPassword)
      visible.value = false
    } else {
      failedAttempts.value++
      errorMessage.value = '密码错误，请重试'
      password.value = ''
      nextTick(() => {
        passwordInput.value?.focus()
      })
    }
  } catch (e) {
    errorMessage.value = '验证失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.dialog-content {
  padding: 10px 0;

  .warning-icon {
    text-align: center;
    margin-bottom: 16px;
  }

  .description {
    color: #606266;
    margin-bottom: 16px;
    line-height: 1.6;
  }

  .password-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    background: #fdf6ec;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #e6a23c;

    .el-icon {
      flex-shrink: 0;
    }
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 13px;
    color: #f56c6c;

    .el-icon {
      flex-shrink: 0;
    }
  }

  .attempt-info {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
    text-align: right;
  }
}
</style>
