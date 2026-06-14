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
          <div class="setting-name">清除所有数据</div>
          <div class="setting-desc danger">此操作不可恢复，请谨慎操作</div>
        </div>
        <el-popconfirm title="确定要清除所有数据吗？此操作不可恢复！" @confirm="clearAllData">
          <template #reference>
            <el-button type="danger" plain>清除</el-button>
          </template>
        </el-popconfirm>
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
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import type { AppSettings } from '@/types'
import { ElMessage } from 'element-plus'

const store = useAppStore()

const settings = reactive<AppSettings>({
  autoStart: false,
  reminderEnabled: true,
  theme: 'forest',
  dataDir: ''
})

const saveSettings = () => {
  store.updateSettings({ ...settings })
  ElMessage.success('设置已保存')
}

const exportData = () => {
  const data = {
    plants: store.plants,
    careRecords: store.careRecords,
    photos: store.photos,
    reminders: store.reminders,
    knowledgeArticles: store.knowledgeArticles,
    settings: store.settings,
    exportDate: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `plant-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
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
      ElMessage.success('数据导入成功')
    } catch {
      ElMessage.error('导入失败，文件格式不正确')
    }
  }
  reader.readAsText(file.raw)
}

const clearAllData = () => {
  localStorage.clear()
  store.$patch({
    plants: [],
    careRecords: [],
    photos: [],
    reminders: [],
    knowledgeArticles: []
  })
  ElMessage.success('数据已清除')
}

onMounted(() => {
  Object.assign(settings, store.settings)
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
