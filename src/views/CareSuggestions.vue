<template>
  <div class="page-container care-suggestions-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><MagicStick /></el-icon>
        智能养护建议
      </div>
      <div class="header-actions">
        <el-button type="primary" plain @click="refreshAll">
          <el-icon><Refresh /></el-icon>
          刷新建议
        </el-button>
        <el-dropdown @command="handleDismissAll">
          <el-button plain>
            <el-icon><MoreFilled /></el-icon>
            更多操作
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="dismissSuggestions">忽略所有建议</el-dropdown-item>
              <el-dropdown-item command="dismissWarnings">忽略所有预警</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane label="养护建议" name="suggestions">
        <div v-if="!store.settings.smartSuggestionsEnabled" class="disabled-hint">
          <el-icon :size="48"><Bell /></el-icon>
          <p>智能养护建议已关闭</p>
          <el-button type="primary" @click="enableSuggestions">
            开启智能建议
          </el-button>
        </div>

        <div v-else-if="store.activeSuggestions.length === 0" class="empty-state">
          <el-icon :size="48" color="#6B8E5A"><CircleCheck /></el-icon>
          <p>太棒了！暂无养护建议</p>
          <span class="empty-desc">你目前的养护习惯非常好，继续保持！</span>
        </div>

        <div v-else class="suggestions-list">
          <div
            v-for="suggestion in store.activeSuggestions"
            :key="suggestion.id"
            class="suggestion-card"
          >
            <div class="suggestion-header">
              <div class="suggestion-icon" :style="{ background: getPriorityBg(suggestion.priority) }">
                {{ getSuggestionTypeIcon(suggestion.type) }}
              </div>
              <div class="suggestion-main">
                <div class="suggestion-title-row">
                  <h4 class="suggestion-title">{{ suggestion.title }}</h4>
                  <el-tag
                    size="small"
                    :type="getPriorityTagType(suggestion.priority)"
                    effect="dark"
                    round
                  >
                    {{ getPriorityName(suggestion.priority) }}
                  </el-tag>
                </div>
                <div v-if="suggestion.plantName" class="suggestion-plant">
                  🪴 关联植物：{{ suggestion.plantName }}
                </div>
              </div>
              <el-button
                text
                type="info"
                size="small"
                @click="dismissSuggestion(suggestion.id)"
                class="dismiss-btn"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="suggestion-content">{{ suggestion.content }}</div>
            <div v-if="suggestion.actionable" class="suggestion-actions">
              <el-button
                type="primary"
                size="small"
                @click="executeAction(suggestion)"
              >
                {{ suggestion.actionLabel || '立即处理' }}
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="智能预警" name="warnings">
        <div v-if="!store.settings.warningAlertsEnabled" class="disabled-hint">
          <el-icon :size="48"><Warning /></el-icon>
          <p>智能预警已关闭</p>
          <el-button type="primary" @click="enableWarnings">
            开启智能预警
          </el-button>
        </div>

        <div v-else-if="store.activeWarnings.length === 0" class="empty-state">
          <el-icon :size="48" color="#6B8E5A"><SuccessFilled /></el-icon>
          <p>一切正常！暂无预警</p>
          <span class="empty-desc">你的植物都很健康，继续保持良好的养护习惯！</span>
        </div>

        <div v-else class="warnings-list">
          <div
            v-for="warning in store.activeWarnings"
            :key="warning.id"
            class="warning-card"
            :class="`risk-${warning.riskLevel}`"
          >
            <div class="warning-header">
              <div class="warning-icon" :style="{ background: getRiskBg(warning.riskLevel) }">
                {{ getWarningTypeIcon(warning.type) }}
              </div>
              <div class="warning-main">
                <div class="warning-title-row">
                  <h4 class="warning-title">{{ warning.title }}</h4>
                  <el-tag
                    size="small"
                    :type="getRiskTagType(warning.riskLevel)"
                    effect="dark"
                    round
                  >
                    {{ getRiskLevelName(warning.riskLevel) }}
                  </el-tag>
                </div>
                <div class="warning-plant">
                  🪴 {{ warning.plantName }}
                </div>
              </div>
              <el-button
                text
                type="info"
                size="small"
                @click="dismissWarning(warning.id)"
                class="dismiss-btn"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="warning-description">{{ warning.description }}</div>

            <el-collapse v-if="warning.evidence.length > 0 || warning.suggestions.length > 0">
              <el-collapse-item title="查看详情" name="details">
                <div v-if="warning.evidence.length > 0" class="evidence-section">
                  <h5>📋 诊断依据</h5>
                  <ul>
                    <li v-for="(item, idx) in warning.evidence" :key="idx">{{ item }}</li>
                  </ul>
                </div>
                <div v-if="warning.suggestions.length > 0" class="suggestion-section">
                  <h5>💡 处理建议</h5>
                  <ul>
                    <li v-for="(item, idx) in warning.suggestions" :key="idx">{{ item }}</li>
                  </ul>
                </div>
              </el-collapse-item>
            </el-collapse>

            <div class="warning-actions">
              <el-button
                type="primary"
                size="small"
                @click="goToPlant(warning.plantId)"
              >
                查看植物
              </el-button>
              <el-button
                size="small"
                @click="goToKnowledge"
              >
                了解更多
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showAdjustDialog" title="调整浇水间隔" width="420px">
      <p v-if="currentSuggestion">
        建议将 <strong>{{ currentSuggestion.plantName }}</strong> 的浇水间隔调整为
        <strong>{{ extractInterval(currentSuggestion.content) }}</strong> 天
      </p>
      <template #footer>
        <el-button @click="showAdjustDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAdjust">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { MagicStick, Refresh, MoreFilled, Bell, CircleCheck, Close, Warning, SuccessFilled } from '@element-plus/icons-vue'
import type { CareSuggestion } from '@/types'
import {
  getPriorityColor,
  getPriorityName,
  getSuggestionTypeIcon,
  getWarningTypeIcon
} from '@/utils/careAI'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useAppStore()
const router = useRouter()

const activeTab = ref('suggestions')
const showAdjustDialog = ref(false)
const currentSuggestion = ref<CareSuggestion | null>(null)

const refreshAll = () => {
  store.analyzeSmartCare()
  ElMessage.success('已刷新养护建议和预警')
}

const dismissSuggestion = (id: string) => {
  store.dismissSuggestion(id)
}

const dismissWarning = (id: string) => {
  store.dismissWarning(id)
}

const handleDismissAll = (command: string) => {
  if (command === 'dismissSuggestions') {
    ElMessageBox.confirm('确定要忽略所有养护建议吗？', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      store.dismissAllSuggestions()
      ElMessage.success('已忽略所有养护建议')
    }).catch(() => {})
  } else if (command === 'dismissWarnings') {
    ElMessageBox.confirm('确定要忽略所有智能预警吗？', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      store.dismissAllWarnings()
      ElMessage.success('已忽略所有智能预警')
    }).catch(() => {})
  }
}

const enableSuggestions = () => {
  store.setSmartSuggestionsEnabled(true)
  ElMessage.success('已开启智能养护建议')
}

const enableWarnings = () => {
  store.setWarningAlertsEnabled(true)
  ElMessage.success('已开启智能预警')
}

const executeAction = (suggestion: CareSuggestion) => {
  if (!suggestion.actionType) return

  switch (suggestion.actionType) {
    case 'adjust_watering':
      currentSuggestion.value = suggestion
      showAdjustDialog.value = true
      break
    case 'add_reminder':
      router.push('/reminders')
      dismissSuggestion(suggestion.id)
      break
    case 'check_plant':
      if (suggestion.plantId) {
        router.push(`/plant/${suggestion.plantId}`)
        dismissSuggestion(suggestion.id)
      }
      break
    case 'learn_more':
      router.push('/knowledge')
      dismissSuggestion(suggestion.id)
      break
    case 'adjust_sunlight':
      if (suggestion.plantId) {
        router.push(`/plant/${suggestion.plantId}`)
        dismissSuggestion(suggestion.id)
      }
      break
  }
}

const extractInterval = (content: string): number => {
  const match = content.match(/(\d+)\s*天/)
  return match ? parseInt(match[1]) : 5
}

const confirmAdjust = () => {
  if (!currentSuggestion.value?.plantId) return
  const interval = extractInterval(currentSuggestion.value.content)
  store.updatePlant(currentSuggestion.value.plantId, { wateringInterval: interval })
  showAdjustDialog.value = false
  currentSuggestion.value = null
  ElMessage.success('浇水间隔已调整')
}

const goToPlant = (plantId: string) => {
  router.push(`/plant/${plantId}`)
}

const goToKnowledge = () => {
  router.push('/knowledge')
}

const getPriorityBg = (priority: string): string => {
  const color = getPriorityColor(priority)
  return color + '22'
}

const getPriorityTagType = (priority: string): 'success' | 'info' | 'warning' | 'danger' => {
  const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    low: 'info',
    medium: 'success',
    high: 'warning',
    critical: 'danger'
  }
  return map[priority] || 'info'
}

const getRiskBg = (riskLevel: string): string => {
  const map: Record<string, string> = {
    low: '#95A5A622',
    medium: '#3498DB22',
    high: '#F39C1222',
    critical: '#E74C3C22'
  }
  return map[riskLevel] || '#95A5A622'
}

const getRiskTagType = (riskLevel: string): 'success' | 'info' | 'warning' | 'danger' => {
  const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    low: 'info',
    medium: 'info',
    high: 'warning',
    critical: 'danger'
  }
  return map[riskLevel] || 'info'
}

const getRiskLevelName = (riskLevel: string): string => {
  const map: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '紧急'
  }
  return map[riskLevel] || riskLevel
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.care-suggestions-page {
  max-width: 900px;
  margin: 0 auto;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: $brown-dark;
      display: flex;
      align-items: center;
      gap: 12px;

      .title-icon {
        color: $forest-green;
        font-size: 28px;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .main-tabs {
    :deep(.el-tabs__item) {
      font-size: 16px;
      padding: 0 24px;
    }
  }

  .disabled-hint,
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: $brown-light;

    p {
      font-size: 18px;
      margin: 16px 0 8px;
      color: $brown-dark;
    }

    .empty-desc {
      font-size: 14px;
    }
  }

  .suggestions-list,
  .warnings-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .suggestion-card,
  .warning-card {
    background: $cream-light;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid $cream-dark;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .suggestion-header,
    .warning-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 12px;

      .suggestion-icon,
      .warning-icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
      }

      .suggestion-main,
      .warning-main {
        flex: 1;
        min-width: 0;

        .suggestion-title-row,
        .warning-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;

          .suggestion-title,
          .warning-title {
            font-size: 16px;
            font-weight: 600;
            color: $brown-dark;
            margin: 0;
          }
        }

        .suggestion-plant,
        .warning-plant {
          font-size: 13px;
          color: $brown-light;
        }
      }

      .dismiss-btn {
        flex-shrink: 0;
      }
    }

    .suggestion-content,
    .warning-description {
      font-size: 14px;
      color: $brown-dark;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .suggestion-actions,
    .warning-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  }

  .warning-card {
    &.risk-high,
    &.risk-critical {
      border-left: 4px solid #E74C3C;
    }

    &.risk-medium {
      border-left: 4px solid #F39C12;
    }

    &.risk-low {
      border-left: 4px solid #95A5A6;
    }

    .evidence-section,
    .suggestion-section {
      margin-bottom: 16px;

      h5 {
        font-size: 14px;
        font-weight: 600;
        color: $brown-dark;
        margin-bottom: 8px;
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          font-size: 13px;
          color: $brown-light;
          line-height: 1.8;
        }
      }
    }
  }
}
</style>
