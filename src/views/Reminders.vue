<template>
  <div class="page-container reminders-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><AlarmClock /></el-icon>
        提醒事项
      </div>
      <div class="page-actions">
        <el-radio-group v-model="filterStatus" size="default">
          <el-radio-button label="pending">待完成</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
          <el-radio-button label="all">全部</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 新建提醒
        </el-button>
      </div>
    </div>

    <div class="reminders-today" v-if="todayReminders.length > 0 && filterStatus !== 'completed'">
      <div class="today-header">
        <span class="today-icon">🔔</span>
        <span>今日待办 ({{ todayReminders.length }})</span>
      </div>
      <div class="today-list">
        <div class="today-item" v-for="rem in todayReminders" :key="rem.id">
          <div class="item-left">
            <span class="item-type" :style="{ background: getCareTypeColor(rem.type) + '22', color: getCareTypeColor(rem.type) }">
              {{ rem.type === 'water' ? '💧' : rem.type === 'fertilize' ? '🧪' : rem.type === 'prune' ? '✂️' : rem.type === 'repot' ? '🪴' : '📝' }}
              {{ careTypeLabel(rem.type) }}
            </span>
            <span class="item-title">{{ rem.title }}</span>
            <span class="item-plant">{{ getPlantName(rem.plantId) }}</span>
          </div>
          <el-button type="primary" size="small" round @click="completeReminder(rem.id)">完成</el-button>
        </div>
      </div>
    </div>

    <div class="reminders-list" v-if="filteredReminders.length > 0">
      <div class="reminder-card" v-for="rem in filteredReminders" :key="rem.id" :class="{ completed: rem.completed, overdue: isOverdue(rem) }">
        <div class="rem-left">
          <div class="rem-type-badge" :style="{ background: getCareTypeColor(rem.type) + '22', color: getCareTypeColor(rem.type) }">
            {{ rem.type === 'water' ? '💧' : rem.type === 'fertilize' ? '🧪' : rem.type === 'prune' ? '✂️' : rem.type === 'repot' ? '🪴' : '📝' }}
          </div>
          <div class="rem-info">
            <div class="rem-title" :class="{ 'line-through': rem.completed }">{{ rem.title }}</div>
            <div class="rem-meta">
              <span>🌱 {{ getPlantName(rem.plantId) }}</span>
              <span>📅 {{ formatDate(rem.scheduledDate, 'YYYY-MM-DD') }}</span>
              <span v-if="rem.repeatInterval">🔄 每{{ rem.repeatInterval }}{{ rem.repeatUnit === 'day' ? '天' : rem.repeatUnit === 'week' ? '周' : '月' }}</span>
              <span v-if="isOverdue(rem)" class="overdue-tag">⏰ 已逾期</span>
            </div>
          </div>
        </div>
        <div class="rem-actions">
          <el-tag v-if="rem.completed" type="success" size="small">✅ 已完成</el-tag>
          <template v-else>
            <el-button size="small" type="primary" round @click="completeReminder(rem.id)">完成</el-button>
          </template>
          <el-button size="small" circle @click="deleteReminder(rem.id)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">🔔</div>
      <div class="empty-text">{{ filterStatus === 'completed' ? '暂无已完成的提醒' : '暂无提醒，轻松一下~' }}</div>
    </div>

    <el-dialog v-model="showAddDialog" title="新建提醒" width="520px" destroy-on-close>
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
        <el-form-item label="提醒日期">
          <el-date-picker v-model="form.scheduledDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useAppStore } from '@/stores/app'
import { formatDate, careTypeLabel, getCareTypeColor } from '@/utils'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const filterStatus = ref('pending')
const showAddDialog = ref(false)

const form = reactive({
  plantId: '',
  type: 'water' as 'water' | 'fertilize' | 'prune' | 'repot' | 'custom',
  title: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  repeatInterval: 0,
  repeatUnit: 'day' as 'day' | 'week' | 'month'
})

const todayReminders = computed(() => {
  const today = new Date().toDateString()
  return store.reminders.filter(r => !r.completed && new Date(r.scheduledDate).toDateString() <= today)
})

const filteredReminders = computed(() => {
  let list = [...store.reminders].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  if (filterStatus.value === 'pending') list = list.filter(r => !r.completed)
  else if (filterStatus.value === 'completed') list = list.filter(r => r.completed)
  return list
})

const getPlantName = (plantId: string) => {
  return store.plants.find(p => p.id === plantId)?.name || '未知植物'
}

const isOverdue = (rem: any) => {
  if (rem.completed) return false
  return new Date(rem.scheduledDate) < new Date()
}

const completeReminder = (id: string) => {
  store.completeReminder(id)
  ElMessage.success('已完成！')
}

const deleteReminder = (id: string) => {
  store.deleteReminder(id)
}

const addReminder = () => {
  if (!form.plantId) { ElMessage.warning('请选择植物'); return }
  store.addReminder({
    plantId: form.plantId,
    type: form.type,
    title: form.title || careTypeLabel(form.type),
    scheduledDate: form.scheduledDate,
    repeatInterval: form.repeatInterval || undefined,
    repeatUnit: form.repeatInterval ? form.repeatUnit : undefined
  })
  ElMessage.success('提醒已创建')
  showAddDialog.value = false
  Object.assign(form, { plantId: '', type: 'water', title: '', scheduledDate: new Date().toISOString().split('T')[0], repeatInterval: 0, repeatUnit: 'day' })
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
    }
    .page-actions { display: flex; gap: 12px; align-items: center; }
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
      padding: 10px 14px;
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      margin-bottom: 8px;
      backdrop-filter: blur(4px);

      .item-left {
        display: flex;
        align-items: center;
        gap: 10px;
        .item-type {
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
        }
        .item-title { font-weight: 500; }
        .item-plant { opacity: 0.7; font-size: 13px; }
      }

      .el-button { background: rgba(255,255,255,0.9); border: none; color: $forest-green; }
    }
  }

  .reminder-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: $cream-light;
    border-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid $cream-dark;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba(107,142,90,0.1);
    }

    &.completed {
      opacity: 0.6;
    }

    &.overdue {
      border-left: 4px solid #E74C3C;
    }

    .rem-left {
      display: flex;
      align-items: center;
      gap: 14px;

      .rem-type-badge {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .rem-info {
        .rem-title {
          font-weight: 600;
          color: $brown-dark;
          font-size: 15px;
          &.line-through { text-decoration: line-through; }
        }
        .rem-meta {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: $brown-light;
          margin-top: 4px;
          .overdue-tag { color: #E74C3C; }
        }
      }
    }

    .rem-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}
</style>
