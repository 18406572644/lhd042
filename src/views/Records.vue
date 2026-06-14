<template>
  <div class="page-container records-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Notebook /></el-icon>
        养护记录
      </div>
      <div class="page-actions">
        <el-select v-model="filterPlant" placeholder="选择植物" clearable style="width: 160px">
          <el-option v-for="p in store.plants" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-select v-model="filterType" placeholder="记录类型" clearable style="width: 140px">
          <el-option label="💧 浇水" value="water" />
          <el-option label="🧪 施肥" value="fertilize" />
          <el-option label="✂️ 修剪" value="prune" />
          <el-option label="🪴 换盆" value="repot" />
          <el-option label="📝 其他" value="other" />
        </el-select>
        <el-date-picker v-model="filterDateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px" />
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 新增记录
        </el-button>
      </div>
    </div>

    <div class="records-summary">
      <div class="summary-item">
        <span class="summary-icon">💧</span>
        <span class="summary-count">{{ waterCount }}</span>
        <span class="summary-label">浇水</span>
      </div>
      <div class="summary-item">
        <span class="summary-icon">🧪</span>
        <span class="summary-count">{{ fertilizeCount }}</span>
        <span class="summary-label">施肥</span>
      </div>
      <div class="summary-item">
        <span class="summary-icon">✂️</span>
        <span class="summary-count">{{ pruneCount }}</span>
        <span class="summary-label">修剪</span>
      </div>
      <div class="summary-item">
        <span class="summary-icon">🪴</span>
        <span class="summary-count">{{ repotCount }}</span>
        <span class="summary-label">换盆</span>
      </div>
    </div>

    <div class="records-list" v-if="filteredRecords.length > 0">
      <div class="record-item" v-for="rec in filteredRecords" :key="rec.id" :style="{ borderLeftColor: getCareTypeColor(rec.type) }">
        <div class="record-icon" :style="{ background: getCareTypeColor(rec.type) + '22', color: getCareTypeColor(rec.type) }">
          {{ rec.type === 'water' ? '💧' : rec.type === 'fertilize' ? '🧪' : rec.type === 'prune' ? '✂️' : rec.type === 'repot' ? '🪴' : '📝' }}
        </div>
        <div class="record-content">
          <div class="record-title">
            <span class="plant-name" @click="goToPlant(rec.plantId)">{{ getPlantName(rec.plantId) }}</span>
            <el-tag size="small" :style="{ background: getCareTypeColor(rec.type) + '22', color: getCareTypeColor(rec.type), border: 'none' }" round>
              {{ careTypeLabel(rec.type) }}
            </el-tag>
          </div>
          <div class="record-time">{{ formatDate(rec.date, 'YYYY-MM-DD HH:mm') }}</div>
          <div class="record-note" v-if="rec.note">{{ rec.note }}</div>
          <div class="record-amount" v-if="rec.amount">用量：{{ rec.amount }}</div>
        </div>
        <el-button size="small" text type="danger" @click="store.deleteRecord(rec.id)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">📝</div>
      <div class="empty-text">暂无养护记录</div>
    </div>

    <el-dialog v-model="showAddDialog" title="新增养护记录" width="520px" destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-form-item label="选择植物" required>
          <el-select v-model="form.plantId" placeholder="选择植物" style="width: 100%">
            <el-option v-for="p in store.plants" :key="p.id" :label="p.name + ' (' + p.species + ')'" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="记录类型" required>
          <el-radio-group v-model="form.type">
            <el-radio-button label="water">💧 浇水</el-radio-button>
            <el-radio-button label="fertilize">🧪 施肥</el-radio-button>
            <el-radio-button label="prune">✂️ 修剪</el-radio-button>
            <el-radio-button label="repot">🪴 换盆</el-radio-button>
            <el-radio-button label="other">📝 其他</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="form.date" type="datetime" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="3" placeholder="记录一些细节..." />
        </el-form-item>
        <el-form-item label="用量">
          <el-input v-model="form.amount" placeholder="如：500ml、适量" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRecord">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { formatDate, careTypeLabel, getCareTypeColor } from '@/utils'
import { ElMessage } from 'element-plus'

const router = useRouter()
const store = useAppStore()

const filterPlant = ref('')
const filterType = ref('')
const filterDateRange = ref<string[]>([])
const showAddDialog = ref(false)

const form = reactive({
  plantId: '',
  type: 'water' as 'water' | 'fertilize' | 'prune' | 'repot' | 'other',
  date: new Date().toISOString().slice(0, 19),
  note: '',
  amount: ''
})

const filteredRecords = computed(() => {
  let list = [...store.careRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  if (filterPlant.value) list = list.filter(r => r.plantId === filterPlant.value)
  if (filterType.value) list = list.filter(r => r.type === filterType.value)
  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const start = new Date(filterDateRange.value[0])
    const end = new Date(filterDateRange.value[1])
    end.setHours(23, 59, 59)
    list = list.filter(r => {
      const d = new Date(r.date)
      return d >= start && d <= end
    })
  }
  return list
})

const waterCount = computed(() => filteredRecords.value.filter(r => r.type === 'water').length)
const fertilizeCount = computed(() => filteredRecords.value.filter(r => r.type === 'fertilize').length)
const pruneCount = computed(() => filteredRecords.value.filter(r => r.type === 'prune').length)
const repotCount = computed(() => filteredRecords.value.filter(r => r.type === 'repot').length)

const getPlantName = (plantId: string) => {
  return store.plants.find(p => p.id === plantId)?.name || '未知植物'
}

const goToPlant = (id: string) => {
  router.push(`/plant/${id}`)
}

const submitRecord = () => {
  if (!form.plantId) {
    ElMessage.warning('请选择植物')
    return
  }
  store.addRecord({
    plantId: form.plantId,
    type: form.type,
    date: form.date || new Date().toISOString(),
    note: form.note || undefined,
    amount: form.amount || undefined
  })
  ElMessage.success('记录已添加')
  showAddDialog.value = false
  Object.assign(form, { plantId: '', type: 'water', date: new Date().toISOString().slice(0, 19), note: '', amount: '' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.records-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
    .page-title {
      font-size: 24px; font-weight: 600; color: $brown-dark;
      display: flex; align-items: center; gap: 12px;
      .title-icon { color: $forest-green; font-size: 28px; }
    }
    .page-actions {
      display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
    }
  }

  .records-summary {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    .summary-item {
      flex: 1;
      background: $cream-light;
      border: 1px solid $cream-dark;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      transition: all 0.2s;
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(107,142,90,0.1); }
      .summary-icon { font-size: 28px; display: block; margin-bottom: 4px; }
      .summary-count { font-size: 24px; font-weight: 700; color: $brown-dark; display: block; }
      .summary-label { font-size: 13px; color: $brown-light; }
    }
  }

  .records-list {
    .record-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: $cream-light;
      border-radius: 12px;
      margin-bottom: 12px;
      border-left: 4px solid $forest-green;
      align-items: flex-start;

      .plant-name {
        cursor: pointer;
        font-weight: 600;
        &:hover { color: $forest-green; }
      }
    }
  }
}
</style>
