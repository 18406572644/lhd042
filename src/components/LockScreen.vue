<template>
  <div class="lock-screen" v-if="visible">
    <div class="lock-overlay"></div>
    <div class="lock-container">
      <div class="lock-icon">
        <el-icon :size="64"><Lock /></el-icon>
      </div>
      <h2 class="lock-title">应用已锁定</h2>
      <p class="lock-subtitle">{{ subtitle }}</p>
      
      <div class="password-hint" v-if="passwordHint">
        <el-icon><QuestionFilled /></el-icon>
        <span>密码提示：{{ passwordHint }}</span>
      </div>

      <div class="password-input-wrapper">
        <el-input
          v-model="password"
          type="password"
          placeholder="请输入密码解锁"
          show-password
          size="large"
          @keyup.enter="handleUnlock"
          ref="passwordInput"
          :class="{ 'input-error': errorMessage }"
        />
        <el-button type="primary" size="large" :loading="loading" @click="handleUnlock">
          解锁
        </el-button>
      </div>

      <div class="error-message" v-if="errorMessage">
        <el-icon><CircleCloseFilled /></el-icon>
        <span>{{ errorMessage }}</span>
      </div>

      <div class="lock-footer">
        <span class="lock-time">{{ currentTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, QuestionFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'unlocked'): void
}>()

const store = useAppStore()

const visible = ref(props.modelValue)
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)
const passwordInput = ref()
const currentTime = ref('')
let timeInterval: number | null = null

const passwordHint = computed(() => store.securitySettings?.passwordHint)

const subtitle = computed(() => {
  const minutes = store.autoLockMinutes
  return `已超过 ${minutes} 分钟无操作，请输入密码解锁以继续使用`
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    password.value = ''
    errorMessage.value = ''
    nextTick(() => {
      passwordInput.value?.focus()
    })
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleUnlock = async () => {
  if (!password.value) {
    errorMessage.value = '请输入密码'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const valid = store.unlockApp(password.value)
    if (valid) {
      ElMessage.success('解锁成功')
      visible.value = false
      emit('unlocked')
    } else {
      errorMessage.value = '密码错误，请重试'
    }
  } catch (e) {
    errorMessage.value = '解锁失败，请重试'
  } finally {
    loading.value = false
  }

  password.value = ''
}

onMounted(() => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style lang="scss" scoped>
.lock-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  .lock-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
    opacity: 0.95;
  }

  .lock-container {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 48px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 420px;
    width: 90%;
    animation: fadeInUp 0.3s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .lock-icon {
    margin-bottom: 24px;
    color: #f5f5f5;
  }

  .lock-title {
    font-size: 28px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
  }

  .lock-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .password-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);

    .el-icon {
      flex-shrink: 0;
    }
  }

  .password-input-wrapper {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;

    :deep(.el-input) {
      flex: 1;

      .el-input__wrapper {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        padding: 8px 15px;
        box-shadow: none;

        .el-input__inner {
          color: #fff;

          &::placeholder {
            color: rgba(255, 255, 255, 0.4);
          }
        }

        .el-input__password {
          color: rgba(255, 255, 255, 0.7);
        }

        &.is-focus {
          border-color: #6b8e5a;
        }
      }

      &.input-error .el-input__wrapper {
        border-color: #f56c6c;
      }
    }

    .el-button {
      background: #6b8e5a;
      border-color: #6b8e5a;
      padding: 0 24px;

      &:hover {
        background: #5a7a4b;
        border-color: #5a7a4b;
      }
    }
  }

  .error-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #f56c6c;

    .el-icon {
      flex-shrink: 0;
    }
  }

  .lock-footer {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .lock-time {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      font-family: 'Courier New', monospace;
    }
  }
}
</style>
