<template>
  <div class="page-container settings-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Setting /></el-icon>
        设置
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">🌿 应用设置</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">开机自启动</div>
          <div class="setting-desc">启动系统时自动运行绿意盎然</div>
        </div>
        <el-switch v-model="settings.autoStart" @change="saveSettings" />
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">提醒通知</div>
          <div class="setting-desc">开启桌面提醒弹窗，及时获取养护提醒</div>
        </div>
        <el-switch v-model="settings.reminderEnabled" @change="saveSettings" />
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">智能养护建议</div>
          <div class="setting-desc">基于养护数据生成个性化养护建议</div>
        </div>
        <el-switch v-model="settings.smartSuggestionsEnabled" @change="saveSmartSuggestions" />
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">智能预警</div>
          <div class="setting-desc">分析养护规律，提醒可能的养护风险和误区</div>
        </div>
        <el-switch v-model="settings.warningAlertsEnabled" @change="saveWarningAlerts" />
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">🔒 安全设置</h3>
      <div class="setting-item" v-if="!store.hasMasterPassword">
        <div class="setting-info">
          <div class="setting-name">设置主密码</div>
          <div class="setting-desc">设置密码后可启用加密、自动锁定等安全功能</div>
        </div>
        <el-button type="primary" plain @click="showSetPasswordDialog = true">设置密码</el-button>
      </div>
      <div class="setting-item" v-else>
        <div class="setting-info">
          <div class="setting-name">主密码</div>
          <div class="setting-desc">已设置主密码，保护数据安全</div>
        </div>
        <div class="setting-actions">
          <el-button plain @click="showChangePasswordDialog = true">修改密码</el-button>
          <el-button type="danger" plain @click="showRemovePasswordDialog = true">移除密码</el-button>
        </div>
      </div>
      <div class="setting-item" v-if="store.hasMasterPassword">
        <div class="setting-info">
          <div class="setting-name">数据加密存储</div>
          <div class="setting-desc">
            使用 AES-256 加密算法保护本地数据
            <el-tag v-if="store.isEncryptionEnabled" type="success" size="small" round style="margin-left: 8px;">已启用</el-tag>
            <el-tag v-else type="info" size="small" round style="margin-left: 8px;">未启用</el-tag>
          </div>
        </div>
        <el-switch
          v-model="encryptionEnabled"
          @change="toggleEncryption"
          :disabled="!store.hasMasterPassword"
        />
      </div>
      <div class="setting-item" v-if="store.hasMasterPassword">
        <div class="setting-info">
          <div class="setting-name">隐私模式</div>
          <div class="setting-desc">隐藏敏感数据（如植物价值、购买价格等扩展字段）</div>
        </div>
        <el-switch
          v-model="privacyMode"
          @change="togglePrivacyMode"
          :disabled="!store.hasMasterPassword"
        />
      </div>
      <div class="setting-item" v-if="store.hasMasterPassword">
        <div class="setting-info">
          <div class="setting-name">自动锁定</div>
          <div class="setting-desc">一段时间无操作后自动锁定应用</div>
        </div>
        <div class="auto-lock-controls">
          <el-switch
            v-model="autoLockEnabled"
            @change="toggleAutoLock"
            :disabled="!store.hasMasterPassword"
          />
          <el-input-number
            v-if="autoLockEnabled"
            v-model="autoLockMinutes"
            :min="1"
            :max="60"
            size="small"
            style="width: 120px; margin-left: 12px;"
            @change="updateAutoLockMinutes"
          />
          <span v-if="autoLockEnabled" class="auto-lock-unit">分钟</span>
        </div>
      </div>
      <div class="setting-item" v-if="store.hasMasterPassword">
        <div class="setting-info">
          <div class="setting-name">立即锁定</div>
          <div class="setting-desc">手动锁定应用，需要输入密码才能继续使用</div>
        </div>
        <el-button type="warning" plain @click="lockApp">
          <el-icon><Lock /></el-icon> 锁定
        </el-button>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">🛡️ 数据完整性</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">数据完整性校验</div>
          <div class="setting-desc">检测存储数据是否损坏或被篡改</div>
        </div>
        <el-button type="primary" plain :loading="checkingIntegrity" @click="checkIntegrity">
          立即检查
        </el-button>
      </div>
      <div class="integrity-results" v-if="integrityResults.length > 0">
        <div
          class="integrity-item"
          v-for="item in integrityResults"
          :key="item.key"
          :class="{ corrupted: item.status === 'corrupted', valid: item.status === 'valid' }"
        >
          <div class="integrity-key">{{ getDataKeyLabel(item.key) }}</div>
          <div class="integrity-info">
            <el-tag :type="item.status === 'valid' ? 'success' : item.status === 'corrupted' ? 'danger' : 'info'" size="small" round>
              {{ item.status === 'valid' ? '正常' : item.status === 'corrupted' ? '损坏' : '未知' }}
            </el-tag>
            <span class="integrity-count">{{ item.recordCount }} 条记录</span>
            <span class="integrity-time" v-if="item.lastChecked">
              {{ formatDate(item.lastChecked, 'MM-DD HH:mm') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">📊 数据管理</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">导出数据</div>
          <div class="setting-desc">将所有植物数据导出为 JSON 文件</div>
        </div>
        <el-button type="primary" plain @click="exportData">导出</el-button>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">导入数据</div>
          <div class="setting-desc">从 JSON 文件导入植物数据</div>
        </div>
        <el-upload :auto-upload="false" :show-file-list="false" accept=".json" :on-change="importData">
          <el-button type="primary" plain>导入</el-button>
        </el-upload>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">操作日志</div>
          <div class="setting-desc">查看所有重要操作记录</div>
        </div>
        <el-button type="primary" plain @click="$router.push('/logs')">查看日志</el-button>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">清除所有数据</div>
          <div class="setting-desc danger">此操作不可恢复，请谨慎操作</div>
        </div>
        <el-button type="danger" plain @click="handleClearData">清除</el-button>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">🎨 关于</h3>
      <div class="about-card">
        <div class="about-logo">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" fill="#F5F0E6"/>
            <path d="M40 10C25 20 18 38 40 70C62 38 55 20 40 10Z" fill="#6B8E5A"/>
            <path d="M40 24L40 60" stroke="#8B7355" stroke-width="2.5" stroke-linecap="round"/>
            <ellipse cx="26" cy="34" rx="10" ry="6" fill="#8FA978" transform="rotate(-25 26 34)"/>
            <ellipse cx="54" cy="40" rx="10" ry="6" fill="#8FA978" transform="rotate(25 54 40)"/>
            <circle cx="40" cy="18" r="4" fill="#E8B4B8"/>
          </svg>
        </div>
        <div class="about-info">
          <h2>绿意盎然</h2>
          <p>植物生长记录工具 v1.0.0</p>
          <p class="about-desc">用心记录每一份生长，让生活充满绿意</p>
          <p class="about-tech">Tauri + Vue3 + Element Plus</p>
        </div>
      </div>
    </div>

    <PasswordConfirmDialog
      v-model="showClearConfirmDialog"
      title="确认清除数据"
      description="此操作将清除所有植物数据且不可恢复！请输入密码以确认操作。"
      confirm-text="确认清除"
      :show-warning="true"
      @confirm="clearAllData"
    />

    <el-dialog v-model="showSetPasswordDialog" title="设置主密码" width="420px" :close-on-click-modal="false">
      <el-form :model="passwordForm" label-position="top">
        <el-form-item label="密码" required>
          <el-input v-model="passwordForm.password" type="password" placeholder="请输入密码（至少6位）" show-password />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="密码提示（可选）">
          <el-input v-model="passwordForm.hint" placeholder="帮助您记住密码的提示" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSetPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="setPassword">确认设置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showChangePasswordDialog" title="修改主密码" width="420px" :close-on-click-modal="false">
      <el-form :model="changePasswordForm" label-position="top">
        <el-form-item label="当前密码" required>
          <el-input v-model="changePasswordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="changePasswordForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" required>
          <el-input v-model="changePasswordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
        <el-form-item label="密码提示（可选）">
          <el-input v-model="changePasswordForm.hint" placeholder="帮助您记住密码的提示" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangePasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>

    <PasswordConfirmDialog
      v-model="showRemovePasswordDialog"
      title="移除主密码"
      description="移除主密码将同时禁用数据加密和自动锁定功能。确定要继续吗？"
      confirm-text="确认移除"
      :show-warning="true"
      @confirm="removePassword"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import type { AppSettings, DataIntegrityInfo } from '@/types'
import { ElMessage } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import PasswordConfirmDialog from '@/components/PasswordConfirmDialog.vue'
import { formatDate } from '@/utils'

const store = useAppStore()

const settings = reactive<AppSettings>({
  autoStart: false,
  reminderEnabled: true,
  theme: 'forest',
  dataDir: '',
  smartSuggestionsEnabled: true,
  warningAlertsEnabled: true
})

const encryptionEnabled = ref(false)
const privacyMode = ref(false)
const autoLockEnabled = ref(false)
const autoLockMinutes = ref(5)
const checkingIntegrity = ref(false)
const integrityResults = ref<DataIntegrityInfo[]>([])

const showSetPasswordDialog = ref(false)
const showChangePasswordDialog = ref(false)
const showRemovePasswordDialog = ref(false)
const showClearConfirmDialog = ref(false)

const passwordForm = reactive({
  password: '',
  confirmPassword: '',
  hint: ''
})

const changePasswordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  hint: ''
})

const saveSettings = () => {
  store.updateSettings({ ...settings })
  ElMessage.success('设置已保存')
}

const saveSmartSuggestions = (enabled: boolean) => {
  store.setSmartSuggestionsEnabled(enabled)
  ElMessage.success(enabled ? '智能养护建议已开启' : '智能养护建议已关闭')
}

const saveWarningAlerts = (enabled: boolean) => {
  store.setWarningAlertsEnabled(enabled)
  ElMessage.success(enabled ? '智能预警已开启' : '智能预警已关闭')
}

const setPassword = () => {
  if (!passwordForm.password || passwordForm.password.length < 6) {
    ElMessage.warning('密码长度至少6位')
    return
  }
  if (passwordForm.password !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  store.setMasterPassword(passwordForm.password, passwordForm.hint || undefined)
  showSetPasswordDialog.value = false
  ElMessage.success('主密码设置成功')
  Object.assign(passwordForm, { password: '', confirmPassword: '', hint: '' })
  syncSecurityState()
}

const changePassword = () => {
  if (!changePasswordForm.oldPassword) {
    ElMessage.warning('请输入当前密码')
    return
  }
  if (!changePasswordForm.newPassword || changePasswordForm.newPassword.length < 6) {
    ElMessage.warning('新密码长度至少6位')
    return
  }
  if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  const success = store.changeMasterPassword(
    changePasswordForm.oldPassword,
    changePasswordForm.newPassword,
    changePasswordForm.hint || undefined
  )
  if (success) {
    showChangePasswordDialog.value = false
    ElMessage.success('密码修改成功')
    Object.assign(changePasswordForm, { oldPassword: '', newPassword: '', confirmPassword: '', hint: '' })
  } else {
    ElMessage.error('当前密码错误')
  }
}

const removePassword = (password: string) => {
  const success = store.removeMasterPassword(password)
  if (success) {
    showRemovePasswordDialog.value = false
    encryptionEnabled.value = false
    privacyMode.value = false
    autoLockEnabled.value = false
    ElMessage.success('主密码已移除')
  } else {
    ElMessage.error('密码错误，移除失败')
  }
}

const toggleEncryption = (enabled: boolean) => {
  if (enabled) {
    if (!store.hasMasterPassword) {
      ElMessage.warning('请先设置主密码')
      encryptionEnabled.value = false
      return
    }
    const password = prompt('请输入主密码以启用加密：')
    if (password) {
      const success = store.enableEncryption(password)
      if (success) {
        ElMessage.success('数据加密已启用')
      } else {
        ElMessage.error('密码错误，加密启用失败')
        encryptionEnabled.value = false
      }
    } else {
      encryptionEnabled.value = false
    }
  } else {
    const password = prompt('请输入主密码以禁用加密：')
    if (password) {
      const success = store.disableEncryption(password)
      if (success) {
        ElMessage.success('数据加密已禁用')
      } else {
        ElMessage.error('密码错误，加密禁用失败')
        encryptionEnabled.value = true
      }
    } else {
      encryptionEnabled.value = true
    }
  }
}

const togglePrivacyMode = (enabled: boolean) => {
  store.setPrivacyMode(enabled)
  ElMessage.success(enabled ? '隐私模式已启用' : '隐私模式已关闭')
}

const toggleAutoLock = (enabled: boolean) => {
  store.setAutoLock(enabled, autoLockMinutes.value)
  ElMessage.success(enabled ? '自动锁定已启用' : '自动锁定已关闭')
}

const updateAutoLockMinutes = (val: number | undefined) => {
  if (val !== undefined && autoLockEnabled.value) {
    store.setAutoLock(true, val)
  }
}

const lockApp = () => {
  store.lockApp()
  ElMessage.info('应用已锁定')
}

const checkIntegrity = () => {
  checkingIntegrity.value = true
  setTimeout(() => {
    integrityResults.value = store.runIntegrityCheck()
    checkingIntegrity.value = false
    const corruptedCount = integrityResults.value.filter(i => i.status === 'corrupted').length
    if (corruptedCount > 0) {
      ElMessage.warning(`检测到 ${corruptedCount} 项数据损坏`)
    } else {
      ElMessage.success('数据完整性校验通过')
    }
  }, 500)
}

const getDataKeyLabel = (key: string): string => {
  const map: Record<string, string> = {
    'plant_tracker_plants': '植物数据',
    'plant_tracker_care_records': '养护记录',
    'plant_tracker_photos': '照片数据',
    'plant_tracker_reminders': '提醒数据',
    'plant_tracker_knowledge': '知识数据',
    'plant_tracker_settings': '应用设置',
    'plant_tracker_diary': '日记数据',
    'plant_tracker_achievements': '成就数据',
    'plant_tracker_suggestions': '建议数据',
    'plant_tracker_warnings': '预警数据',
    'plant_tracker_care_score': '养护评分'
  }
  return map[key] || key
}

const exportData = () => {
  const data = {
    plants: store.plants,
    careRecords: store.careRecords,
    photos: store.photos,
    reminders: store.reminders,
    knowledgeArticles: store.knowledgeArticles,
    settings: store.settings,
    achievements: store.achievements,
    suggestions: store.suggestions,
    warnings: store.warnings,
    careScore: store.careScore,
    exportDate: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `plant-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  store.exportData()
  ElMessage.success('数据已导出')
}

const importData = (file: any) => {
  if (!file?.raw) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.plants?.length >= 0) {
        store.$patch({ plants: data.plants })
        localStorage.setItem('plant_tracker_plants', JSON.stringify(data.plants))
      }
      if (data.careRecords?.length >= 0) {
        store.$patch({ careRecords: data.careRecords })
        localStorage.setItem('plant_tracker_care_records', JSON.stringify(data.careRecords))
      }
      if (data.photos?.length >= 0) {
        store.$patch({ photos: data.photos })
        localStorage.setItem('plant_tracker_photos', JSON.stringify(data.photos))
      }
      if (data.reminders?.length >= 0) {
        store.$patch({ reminders: data.reminders })
        localStorage.setItem('plant_tracker_reminders', JSON.stringify(data.reminders))
      }
      if (data.knowledgeArticles?.length >= 0) {
        store.$patch({ knowledgeArticles: data.knowledgeArticles })
        localStorage.setItem('plant_tracker_knowledge', JSON.stringify(data.knowledgeArticles))
      }
      if (data.achievements?.length >= 0) {
        store.$patch({ achievements: data.achievements })
        localStorage.setItem('plant_tracker_achievements', JSON.stringify(data.achievements))
      }
      if (data.suggestions?.length >= 0) {
        store.$patch({ suggestions: data.suggestions })
        localStorage.setItem('plant_tracker_suggestions', JSON.stringify(data.suggestions))
      }
      if (data.warnings?.length >= 0) {
        store.$patch({ warnings: data.warnings })
        localStorage.setItem('plant_tracker_warnings', JSON.stringify(data.warnings))
      }
      if (data.careScore) {
        store.$patch({ careScore: data.careScore })
        localStorage.setItem('plant_tracker_care_score', JSON.stringify(data.careScore))
      }
      store.importData()
      ElMessage.success('数据导入成功')
    } catch {
      ElMessage.error('导入失败，文件格式不正确')
    }
  }
  reader.readAsText(file.raw)
}

const handleClearData = () => {
  if (store.hasMasterPassword) {
    showClearConfirmDialog.value = true
  } else {
    store.clearAllData()
    ElMessage.success('数据已清除')
  }
}

const clearAllData = (password: string) => {
  const success = store.clearAllData(password)
  if (success) {
    showClearConfirmDialog.value = false
    ElMessage.success('数据已清除')
  } else {
    ElMessage.error('操作失败，请检查密码')
  }
}

const syncSecurityState = () => {
  encryptionEnabled.value = store.isEncryptionEnabled
  privacyMode.value = store.isPrivacyModeEnabled
  autoLockEnabled.value = store.isAutoLockEnabled
  autoLockMinutes.value = store.autoLockMinutes
}

onMounted(() => {
  Object.assign(settings, store.settings)
  syncSecurityState()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.settings-page {
  max-width: 700px;

  .page-header {
    margin-bottom: 24px;
    .page-title {
      font-size: 24px; font-weight: 600; color: $brown-dark;
      display: flex; align-items: center; gap: 12px;
      .title-icon { color: $forest-green; font-size: 28px; }
    }
  }

  .settings-section {
    background: $cream-light;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
    border: 1px solid $cream-dark;

    .section-title {
      font-size: 16px;
      color: $forest-green;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid $cream-dark;
    }
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid $cream;
    &:last-child { border-bottom: none; }
    .setting-info {
      flex: 1;
      margin-right: 16px;
      .setting-name {
        font-weight: 500;
        color: $brown-dark;
        margin-bottom: 4px;
      }
      .setting-desc {
        font-size: 13px;
        color: $brown-light;
        &.danger { color: #E74C3C; }
      }
    }
    .setting-actions {
      display: flex;
      gap: 8px;
    }
    .auto-lock-controls {
      display: flex;
      align-items: center;
      .auto-lock-unit {
        font-size: 13px;
        color: $brown-light;
        margin-left: 8px;
      }
    }
  }

  .integrity-results {
    margin-top: 16px;
    padding: 16px;
    background: $cream;
    border-radius: 12px;

    .integrity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid $cream-dark;

      &:last-child { border-bottom: none; }

      &.corrupted {
        .integrity-key { color: #E74C3C; }
      }

      .integrity-key {
        font-weight: 500;
        color: $brown-dark;
        font-size: 14px;
      }

      .integrity-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .integrity-count {
          font-size: 13px;
          color: $brown-light;
        }

        .integrity-time {
          font-size: 12px;
          color: $brown-light;
          font-family: 'Courier New', monospace;
        }
      }
    }
  }

  .about-card {
    display: flex;
    gap: 20px;
    align-items: center;
    .about-logo {
      width: 80px;
      height: 80px;
      flex-shrink: 0;
    }
    .about-info {
      h2 {
        font-size: 22px;
        color: $brown-dark;
        margin-bottom: 4px;
      }
      p {
        font-size: 14px;
        color: $brown-light;
        margin-bottom: 2px;
      }
      .about-desc {
        margin-top: 8px;
        color: $forest-green;
        font-style: italic;
      }
      .about-tech {
        font-size: 12px;
        color: $brown-light;
        margin-top: 4px;
      }
    }
  }
}
</style>
