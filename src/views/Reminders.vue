<template>
  <div class="page-container reminders-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><AlarmClock /></el-icon>
        提醒事项
        <el-tag v-if="overdueCount > 0" type="danger" class="overdue-count-tag">
          {{ overdueCount }} 个逾期
        </el-tag>
      </div>
      <div class="page-actions">
        <el-radio-group v-model="filterStatus" size="default">
          <el-radio-button label="pending">待完成</el-radio-button>
          <el-radio-button label="overdue">已逾期</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
          <el-radio-button label="all">全部</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon> 新建提醒
        </el-button>
      </div>
    </div>

    <div class="batch-bar" v-if="selectedIds.length > 0">
      <div class="batch-info">
        <el-checkbox
          :model-value="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="toggleSelectAll"
        >
          已选择 {{ selectedIds.length }} 项
        </el-checkbox>
      </div>
      <div class="batch-actions">
        <el-button type="primary" size="small" @click="batchComplete">
          <el-icon><Check /></el-icon> 批量完成
        </el-button>
        <el-button type="warning" size="small" @click="openBatchPostpone">
          <el-icon><Clock /></el-icon> 批量延期
        </el-button>
        <el-button type="danger" size="small" @click="batchDelete">
          <el-icon><Delete /></el-icon> 批量删除
        </el-button>
        <el-button size="small" @click="clearSelection">取消选择</el-button>
      </div>
    </div>

    <div class="reminders-today" v-if="todayReminders.length > 0 && filterStatus !== 'completed'">
      <div class="today-header">
        <span class="today-icon">🔔</span>
        <span>今日待办 ({{ todayReminders.length }})</span>
      </div>
      <div class="today-list">
        <div class="today-item" v-for="rem in todayReminders" :key="rem.id" :class="{ overdue: isOverdue(rem) }">
          <div class="item-left">
            <el-checkbox
              :model-value="selectedIds.includes(rem.id)"
              @change="(val: boolean) => toggleSelect(rem.id, val)"
              @click.stop
            />
            <span class="item-type" :style="{ background: getCareTypeColor(rem.type) + '22', color: getCareTypeColor(rem.type) }">
              {{ getCareTypeIcon(rem.type) }}
              {{ careTypeLabel(rem.type) }}
            </span>
            <span class="item-title">{{ rem.title }}</span>
            <span class="item-plant">{{ getPlantName(rem.plantId) }}</span>
            <span class="item-time" v-if="rem.scheduledTime">⏰ {{ rem.scheduledTime }}</span>
            <span class="item-overdue" v-if="isOverdue(rem)">
              ⏰ {{ getOverdueText(rem) }}
            </span>
          </div>
          <div class="item-actions">
            <el-dropdown trigger="click" @command="(cmd: string) => handlePostpone(cmd, rem.id)">
              <el-button size="small" round>
                <el-icon><Clock /></el-icon> 稍后
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="1h">推迟 1 小时</el-dropdown-item>
                  <el-dropdown-item command="3h">推迟 3 小时</el-dropdown-item>
                  <el-dropdown-item command="tomorrow">推迟到明天</el-dropdown-item>
                  <el-dropdown-item command="custom" divided>自定义时间...</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" size="small" round @click="openFeedbackDialog(rem.id)">完成</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="reminders-list" v-if="filteredReminders.length > 0">
      <div
        class="reminder-card"
        v-for="rem in filteredReminders"
        :key="rem.id"
        :class="{ completed: rem.completed, overdue: isOverdue(rem) && !rem.completed, selected: selectedIds.includes(rem.id) }"
      >
        <div class="rem-left">
          <el-checkbox
            :model-value="selectedIds.includes(rem.id)"
            @change="(val: boolean) => toggleSelect(rem.id, val)"
            @click.stop
          />
          <div class="rem-type-badge" :style="{ background: getCareTypeColor(rem.type), color: '#fff' }">
            {{ getCareTypeIcon(rem.type) }}
          </div>
          <div class="rem-info">
            <div class="rem-title-row">
              <div class="rem-title" :class="{ 'line-through': rem.completed }">{{ rem.title }}</div>
              <el-tag
                size="small"
                class="rem-type-tag"
                :style="{ background: getCareTypeColor(rem.type) + '22', color: getCareTypeColor(rem.type), borderColor: getCareTypeColor(rem.type) + '44' }"
              >
                {{ careTypeLabel(rem.type) }}
              </el-tag>
            </div>
            <div class="rem-meta">
              <span>🌱 {{ getPlantName(rem.plantId) }}</span>
              <span>📅 {{ formatDate(rem.scheduledDate, 'YYYY-MM-DD') }}</span>
              <span v-if="rem.scheduledTime">⏰ {{ rem.scheduledTime }}</span>
              <span v-if="rem.repeatInterval">🔄 每{{ rem.repeatInterval }}{{ rem.repeatUnit === 'day' ? '天' : rem.repeatUnit === 'week' ? '周' : '月' }}</span>
              <span v-if="rem.postponedCount && rem.postponedCount > 0" class="postponed-tag">
                ⏸ 已推迟 {{ rem.postponedCount }} 次
              </span>
              <span v-if="isOverdue(rem) && !rem.completed" class="overdue-tag">
                ⏰ {{ getOverdueText(rem) }}
              </span>
            </div>
            <div class="rem-feedback" v-if="rem.completed && rem.completionFeedback">
              <el-tag
                size="small"
                :style="{ background: completionFeedbackColor(rem.completionFeedback) + '22', color: completionFeedbackColor(rem.completionFeedback), borderColor: completionFeedbackColor(rem.completionFeedback) + '44' }"
              >
                {{ completionFeedbackLabel(rem.completionFeedback) }}
              </el-tag>
              <span v-if="rem.completionNote" class="feedback-note">{{ rem.completionNote }}</span>
            </div>
          </div>
        </div>
        <div class="rem-actions">
          <el-tag v-if="rem.completed" type="success" size="small">✅ 已完成</el-tag>
          <template v-else>
            <el-dropdown trigger="click" @command="(cmd: string) => handlePostpone(cmd, rem.id)">
              <el-button size="small" round>
                <el-icon><Clock /></el-icon> 稍后
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="1h">推迟 1 小时</el-dropdown-item>
                  <el-dropdown-item command="3h">推迟 3 小时</el-dropdown-item>
                  <el-dropdown-item command="tomorrow">推迟到明天</el-dropdown-item>
                  <el-dropdown-item command="custom" divided>自定义时间...</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" type="primary" round @click="openFeedbackDialog(rem.id)">完成</el-button>
          </template>
          <el-button size="small" circle @click="deleteReminder(rem.id)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">🔔</div>
      <div class="empty-text">
        {{ filterStatus === 'completed' ? '暂无已完成的提醒' : filterStatus === 'overdue' ? '暂无逾期的提醒，太棒了！' : '暂无提醒，轻松一下~' }}
      </div>
    </div>

    <el-dialog v-model="showAddDialog" title="新建提醒" width="560px" destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-form-item label="选择植物" required>
          <el-select v-model="form.plantId" placeholder="选择植物" style="width: 100%">
            <el-option v-for="p in store.plants" :key="p.id" :label="p.name + ' (' + p.species + ')'" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒类型">
          <el-radio-group v-model="form.type">
            <el-radio-button label="water">💧 浇水</el-radio-button>
            <el-radio-button label="fertilize">🧪 施肥</el-radio-button>
            <el-radio-button label="prune">✂️ 修剪</el-radio-button>
            <el-radio-button label="repot">🪴 换盆</el-radio-button>
            <el-radio-button label="custom">📝 自定义</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提醒标题">
          <el-input v-model="form.title" placeholder="如：给小绿浇水" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="提醒日期" required>
              <el-date-picker v-model="form.scheduledDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提醒时间">
              <el-time-picker
                v-model="form.scheduledTime"
                placeholder="选择时间"
                style="width: 100%"
                value-format="HH:mm"
                format="HH:mm"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="重复间隔">
              <el-input-number v-model="form.repeatInterval" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重复单位" v-if="form.repeatInterval > 0">
              <el-select v-model="form.repeatUnit" style="width: 100%">
                <el-option label="天" value="day" />
                <el-option label="周" value="week" />
                <el-option label="月" value="month" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addReminder">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showFeedbackDialog" title="完成提醒 - 反馈" width="480px" destroy-on-close>
      <div class="feedback-content">
        <div class="feedback-reminder-info">
          <span class="rem-type-mini" :style="{ background: getCareTypeColor(feedbackReminder?.type || '') + '22', color: getCareTypeColor(feedbackReminder?.type || '') }">
            {{ getCareTypeIcon(feedbackReminder?.type || '') }}
          </span>
          <span class="feedback-title">{{ feedbackReminder?.title }}</span>
        </div>
        <div class="feedback-label">请选择完成情况：</div>
        <div class="feedback-options">
          <el-radio-group v-model="feedbackForm.feedback" class="feedback-radio-group">
            <el-radio-button label="completed">✅ 已完成</el-radio-button>
            <el-radio-button label="healthy">🌿 植物状态良好</el-radio-button>
            <el-radio-button label="pest">🐛 发现病虫害</el-radio-button>
            <el-radio-button label="sick">🥀 状态不佳</el-radio-button>
            <el-radio-button label="other">📝 其他</el-radio-button>
          </el-radio-group>
        </div>
        <el-form-item label="备注（可选）">
          <el-input
            v-model="feedbackForm.note"
            type="textarea"
            :rows="3"
            placeholder="添加一些备注信息..."
          />
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="showFeedbackDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确认完成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCustomPostponeDialog" title="自定义延期时间" width="480px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="延期到">
          <el-date-picker v-model="postponeForm.date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="时间">
          <el-time-picker
            v-model="postponeForm.time"
            placeholder="选择时间"
            style="width: 100%"
            value-format="HH:mm"
            format="HH:mm"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCustomPostponeDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCustomPostpone">确认延期</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchPostponeDialog" title="批量延期" width="420px" destroy-on-close>
      <div class="batch-postpone-content">
        <div class="postpone-label">选择延期时间：</div>
        <div class="postpone-options">
          <el-button @click="confirmBatchPostpone(1)">推迟 1 小时</el-button>
          <el-button @click="confirmBatchPostpone(3)">推迟 3 小时</el-button>
          <el-button @click="confirmBatchPostpone(0, 1)">推迟到明天</el-button>
          <el-button @click="confirmBatchPostpone(0, 7)">推迟一周</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  formatDate,
  careTypeLabel,
  getCareTypeColor,
  completionFeedbackLabel,
  completionFeedbackColor,
  getOverdueInfo,
  formatOverdueText,
  getDefaultTime
} from '@/utils'
import type { Reminder, CompletionFeedback } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useAppStore()
const filterStatus = ref('pending')
const showAddDialog = ref(false)
const showFeedbackDialog = ref(false)
const showCustomPostponeDialog = ref(false)
const showBatchPostponeDialog = ref(false)
const selectedIds = ref<string[]>([])
const currentPostponeId = ref<string | null>(null)
const feedbackReminder = ref<Reminder | null>(null)

const form = reactive({
  plantId: '',
  type: 'water' as 'water' | 'fertilize' | 'prune' | 'repot' | 'custom',
  title: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  scheduledTime: getDefaultTime(),
  repeatInterval: 0,
  repeatUnit: 'day' as 'day' | 'week' | 'month'
})

const feedbackForm = reactive({
  feedback: 'completed' as CompletionFeedback,
  note: ''
})

const postponeForm = reactive({
  date: new Date().toISOString().split('T')[0],
  time: getDefaultTime()
})

const getCareTypeIcon = (type: string): string => {
  const map: Record<string, string> = {
    water: '💧',
    fertilize: '🧪',
    prune: '✂️',
    repot: '🪴',
    custom: '📝'
  }
  return map[type] || '📝'
}

const overdueCount = computed(() => {
  return store.reminders.filter(r => !r.completed && isOverdue(r)).length
})

const isOverdue = (rem: Reminder): boolean => {
  if (rem.completed) return false
  const { isOverdue } = getOverdueInfo(rem.scheduledDate, rem.scheduledTime)
  return isOverdue
}

const getOverdueText = (rem: Reminder): string => {
  const { overdueDays, overdueHours, overdueMinutes } = getOverdueInfo(rem.scheduledDate, rem.scheduledTime)
  return formatOverdueText(overdueDays, overdueHours, overdueMinutes)
}

const todayReminders = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return store.reminders.filter(r => {
    if (r.completed) return false
    return r.scheduledDate <= today
  }).sort((a, b) => {
    const timeA = (a.scheduledTime || '00:00').localeCompare(b.scheduledTime || '00:00')
    if (timeA !== 0) return timeA
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  })
})

const filteredReminders = computed(() => {
  let list = [...store.reminders].sort((a, b) => {
    const dateA = new Date(a.scheduledDate + (a.scheduledTime ? ' ' + a.scheduledTime : '')).getTime()
    const dateB = new Date(b.scheduledDate + (b.scheduledTime ? ' ' + b.scheduledTime : '')).getTime()
    return dateA - dateB
  })
  if (filterStatus.value === 'pending') {
    list = list.filter(r => !r.completed && !isOverdue(r))
  } else if (filterStatus.value === 'overdue') {
    list = list.filter(r => !r.completed && isOverdue(r))
  } else if (filterStatus.value === 'completed') {
    list = list.filter(r => r.completed)
  }
  return list
})

const getPlantName = (plantId: string) => {
  return store.plants.find(p => p.id === plantId)?.name || '未知植物'
}

const isAllSelected = computed(() => {
  return filteredReminders.value.length > 0 && filteredReminders.value.every(r => selectedIds.value.includes(r.id))
})

const isIndeterminate = computed(() => {
  const count = filteredReminders.value.filter(r => selectedIds.value.includes(r.id)).length
  return count > 0 && count < filteredReminders.value.length
})

const toggleSelect = (id: string, selected: boolean) => {
  if (selected) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id)
    }
  } else {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  }
}

const toggleSelectAll = (selected: boolean) => {
  if (selected) {
    selectedIds.value = filteredReminders.value.map(r => r.id)
  } else {
    selectedIds.value = []
  }
}

const clearSelection = () => {
  selectedIds.value = []
}

const openAddDialog = () => {
  Object.assign(form, {
    plantId: '',
    type: 'water',
    title: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: getDefaultTime(),
    repeatInterval: 0,
    repeatUnit: 'day'
  })
  showAddDialog.value = true
}

const addReminder = () => {
  if (!form.plantId) { ElMessage.warning('请选择植物'); return }
  store.addReminder({
    plantId: form.plantId,
    type: form.type,
    title: form.title || careTypeLabel(form.type),
    scheduledDate: form.scheduledDate,
    scheduledTime: form.scheduledTime || undefined,
    repeatInterval: form.repeatInterval || undefined,
    repeatUnit: form.repeatInterval ? form.repeatUnit : undefined
  })
  ElMessage.success('提醒已创建')
  showAddDialog.value = false
}

const openFeedbackDialog = (id: string) => {
  const rem = store.reminders.find(r => r.id === id)
  if (!rem) return
  feedbackReminder.value = rem
  feedbackForm.feedback = 'completed'
  feedbackForm.note = ''
  showFeedbackDialog.value = true
}

const confirmComplete = () => {
  if (!feedbackReminder.value) return
  store.completeReminder(feedbackReminder.value.id, feedbackForm.feedback, feedbackForm.note || undefined)
  ElMessage.success('已完成！')
  showFeedbackDialog.value = false
  toggleSelect(feedbackReminder.value.id, false)
}

const deleteReminder = (id: string) => {
  ElMessageBox.confirm('确定要删除这个提醒吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.deleteReminder(id)
    toggleSelect(id, false)
    ElMessage.success('已删除')
  }).catch(() => {})
}

const handlePostpone = (command: string, id: string) => {
  if (command === '1h') {
    store.postponeReminder(id, 1)
    ElMessage.success('已推迟 1 小时')
  } else if (command === '3h') {
    store.postponeReminder(id, 3)
    ElMessage.success('已推迟 3 小时')
  } else if (command === 'tomorrow') {
    store.postponeReminder(id, undefined, 1)
    ElMessage.success('已推迟到明天')
  } else if (command === 'custom') {
    currentPostponeId.value = id
    const rem = store.reminders.find(r => r.id === id)
    if (rem) {
      const nextDate = new Date(rem.scheduledDate)
      nextDate.setDate(nextDate.getDate() + 1)
      postponeForm.date = nextDate.toISOString().split('T')[0]
      postponeForm.time = rem.scheduledTime || getDefaultTime()
    }
    showCustomPostponeDialog.value = true
  }
}

const confirmCustomPostpone = () => {
  if (!currentPostponeId.value) return
  store.postponeReminder(currentPostponeId.value, undefined, undefined, postponeForm.date, postponeForm.time)
  ElMessage.success('已延期')
  showCustomPostponeDialog.value = false
  currentPostponeId.value = null
}

const batchComplete = () => {
  if (selectedIds.value.length === 0) return
  ElMessageBox.confirm(`确定要完成选中的 ${selectedIds.value.length} 个提醒吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.batchCompleteReminders(selectedIds.value)
    ElMessage.success(`已完成 ${selectedIds.value.length} 个提醒`)
    clearSelection()
  }).catch(() => {})
}

const openBatchPostpone = () => {
  if (selectedIds.value.length === 0) return
  showBatchPostponeDialog.value = true
}

const confirmBatchPostpone = (hours?: number, days?: number) => {
  store.batchPostponeReminders(selectedIds.value, hours, days)
  ElMessage.success(`已延期 ${selectedIds.value.length} 个提醒`)
  showBatchPostponeDialog.value = false
  clearSelection()
}

const batchDelete = () => {
  if (selectedIds.value.length === 0) return
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个提醒吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.batchDeleteReminders(selectedIds.value)
    ElMessage.success(`已删除 ${selectedIds.value.length} 个提醒`)
    clearSelection()
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.reminders-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
    .page-title {
      font-size: 24px; font-weight: 600; color: $brown-dark;
      display: flex; align-items: center; gap: 12px;
      .title-icon { color: $forest-green; font-size: 28px; }
      .overdue-count-tag { margin-left: 8px; }
    }
    .page-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  }

  .batch-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: linear-gradient(135deg, #FFF8E1, #FFECB3);
    border-radius: 12px;
    margin-bottom: 20px;
    border: 1px solid #FFD54F;

    .batch-info {
      font-weight: 500;
      color: $brown-dark;
    }
    .batch-actions {
      display: flex;
      gap: 8px;
    }
  }

  .reminders-today {
    background: linear-gradient(135deg, $forest-green, $forest-green-light);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
    color: #fff;

    .today-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .today-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      margin-bottom: 8px;
      backdrop-filter: blur(4px);
      transition: all 0.2s;
      border-left: 3px solid transparent;

      &.overdue {
        background: rgba(231, 76, 60, 0.25);
        border-left-color: #fff;
      }

      .item-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        .item-type {
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
        }
        .item-title { font-weight: 500; }
        .item-plant { opacity: 0.8; font-size: 13px; }
        .item-time { font-size: 13px; opacity: 0.9; }
        .item-overdue { font-size: 13px; font-weight: 600; color: #FFEBEE; }
      }

      .item-actions {
        display: flex;
        gap: 8px;
      }

      .el-button { background: rgba(255,255,255,0.9); border: none; color: $forest-green; }
    }
  }

  .reminder-card {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 20px;
    background: $cream-light;
    border-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid $cream-dark;
    border-left: 4px solid transparent;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba(107,142,90,0.1);
    }

    &.selected {
      background: #FFF8E1;
      border-color: #FFD54F;
    }

    &.completed {
      opacity: 0.6;
    }

    &.overdue {
      border-left: 4px solid #E74C3C;
      background: linear-gradient(to right, rgba(231, 76, 60, 0.08), $cream-light);
    }

    .rem-left {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      flex: 1;

      .rem-type-badge {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
      }

      .rem-info {
        flex: 1;
        min-width: 0;
        .rem-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        .rem-title {
          font-weight: 600;
          color: $brown-dark;
          font-size: 15px;
          &.line-through { text-decoration: line-through; }
        }
        .rem-type-tag {
          font-weight: 500;
          border: 1px solid;
        }
        .rem-meta {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: $brown-light;
          margin-top: 4px;
          flex-wrap: wrap;
          .overdue-tag { color: #E74C3C; font-weight: 600; }
          .postponed-tag { color: #F39C12; }
        }
        .rem-feedback {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          .feedback-note {
            font-size: 13px;
            color: $brown-light;
            font-style: italic;
          }
        }
      }
    }

    .rem-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
  }

  .feedback-content {
    .feedback-reminder-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: $cream;
      border-radius: 10px;
      margin-bottom: 20px;
      .rem-type-mini {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      .feedback-title {
        font-weight: 600;
        color: $brown-dark;
      }
    }
    .feedback-label {
      font-size: 14px;
      font-weight: 500;
      color: $brown-dark;
      margin-bottom: 12px;
    }
    .feedback-options {
      margin-bottom: 16px;
      .feedback-radio-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }

  .batch-postpone-content {
    .postpone-label {
      font-size: 14px;
      font-weight: 500;
      color: $brown-dark;
      margin-bottom: 16px;
    }
    .postpone-options {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
  }
}
</style>
