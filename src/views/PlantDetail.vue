<template>
  <div class="page-container plant-detail" v-if="plant">
    <div class="detail-header">
      <el-button @click="$router.back()" text>
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
    </div>

    <div class="detail-hero">
      <div class="hero-image">
        <img v-if="plant.image" :src="plant.image" alt="" />
        <div class="emoji-placeholder" v-else>{{ getPlantEmoji(plant.species) }}</div>
      </div>
      <div class="hero-info">
        <div class="hero-name">
          <h2>{{ plant.name }}</h2>
          <el-tag :color="getStatusColor(plant.status)" effect="dark" round>{{ statusLabel(plant.status) }}</el-tag>
        </div>
        <div class="hero-species">{{ plant.species }} <span v-if="plant.nickname">· {{ plant.nickname }}</span></div>
        <div class="hero-meta">
          <div class="meta-item"><el-icon><Location /></el-icon> {{ plant.location }}</div>
          <div class="meta-item"><el-icon><Calendar /></el-icon> {{ formatDate(plant.acquiredDate, 'YYYY-MM-DD') }} 入住</div>
          <div class="meta-item"><el-icon><Sunny /></el-icon> {{ sunlightLabel(plant.sunlightNeed) }}</div>
          <div class="meta-item"><el-icon><Star /></el-icon> {{ difficultyLabel(plant.difficulty) }}</div>
        </div>
        <p class="hero-desc" v-if="plant.description">{{ plant.description }}</p>
        <div class="hero-tags">
          <el-tag v-for="tag in plant.tags" :key="tag" size="small" round type="info">{{ tag }}</el-tag>
        </div>
        <div class="hero-actions">
          <el-button type="primary" @click="showRecordDialog = true">
            <el-icon><Plus /></el-icon> 添加记录
          </el-button>
          <el-button @click="showPhotoDialog = true">
            <el-icon><Camera /></el-icon> 上传照片
          </el-button>
          <el-button @click="editPlantInfo">
            <el-icon><Edit /></el-icon> 编辑
          </el-button>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="养护记录" name="records">
        <div class="tab-header">
          <el-radio-group v-model="recordFilter" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="water">💧 浇水</el-radio-button>
            <el-radio-button label="fertilize">🧪 施肥</el-radio-button>
            <el-radio-button label="prune">✂️ 修剪</el-radio-button>
            <el-radio-button label="repot">🪴 换盆</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="filteredRecords.length > 0">
          <div class="timeline-item" v-for="rec in filteredRecords" :key="rec.id">
            <div class="timeline-dot" :style="{ borderColor: getCareTypeColor(rec.type) }">
              <span class="dot-emoji">{{ rec.type === 'water' ? '💧' : rec.type === 'fertilize' ? '🧪' : rec.type === 'prune' ? '✂️' : rec.type === 'repot' ? '🪴' : '📝' }}</span>
            </div>
            <div class="record-card">
              <div class="record-header">
                <span class="record-type" :style="{ color: getCareTypeColor(rec.type) }">{{ careTypeLabel(rec.type) }}</span>
                <span class="record-date">{{ formatDate(rec.date, 'YYYY-MM-DD HH:mm') }}</span>
                <el-button size="small" text type="danger" @click="deleteRecord(rec.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <div class="record-note" v-if="rec.note">{{ rec.note }}</div>
              <div class="record-amount" v-if="rec.amount">用量：{{ rec.amount }}</div>
            </div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <div class="empty-icon">📝</div>
          <div class="empty-text">暂无养护记录</div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="生长相册" name="photos">
        <div class="photo-grid" v-if="plantPhotos.length > 0">
          <div class="photo-item" v-for="photo in plantPhotos" :key="photo.id" @click="previewPhoto(photo.image)">
            <img :src="photo.image" :alt="photo.note || ''" />
            <div class="photo-overlay">
              <span class="photo-date">{{ formatDate(photo.date, 'MM-DD') }}</span>
              <span class="photo-note" v-if="photo.note">{{ photo.note }}</span>
            </div>
            <el-button class="photo-delete" size="small" circle type="danger" @click.stop="deletePhoto(photo.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="empty-state" v-else>
          <div class="empty-icon">📷</div>
          <div class="empty-text">暂无照片记录</div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="提醒设置" name="reminders">
        <div class="reminder-list" v-if="plantReminders.length > 0">
          <div class="reminder-card" v-for="rem in plantReminders" :key="rem.id">
            <div class="reminder-left">
              <span class="reminder-type-badge" :style="{ background: getCareTypeColor(rem.type) + '22', color: getCareTypeColor(rem.type) }">
                {{ careTypeLabel(rem.type) }}
              </span>
              <span class="reminder-title">{{ rem.title }}</span>
              <span class="reminder-schedule">
                {{ formatDate(rem.scheduledDate, 'YYYY-MM-DD') }}
                <span v-if="rem.scheduledTime">{{ rem.scheduledTime }}</span>
              </span>
              <span class="reminder-repeat" v-if="rem.repeatInterval">
                每{{ rem.repeatInterval }}{{ rem.repeatUnit === 'day' ? '天' : rem.repeatUnit === 'week' ? '周' : '月' }}
              </span>
            </div>
            <div class="reminder-right">
              <el-tag v-if="rem.completed" type="success" size="small">已完成</el-tag>
              <el-button v-else size="small" type="primary" @click="completeReminder(rem.id)">完成</el-button>
              <el-button size="small" circle @click="deleteReminder(rem.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        <el-button type="primary" plain @click="showReminderDialog = true" style="margin-top: 12px;">
          <el-icon><Plus /></el-icon> 添加提醒
        </el-button>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showRecordDialog" title="添加养护记录" width="480px" destroy-on-close>
      <el-form :model="recordForm" label-position="top">
        <el-form-item label="记录类型" required>
          <el-radio-group v-model="recordForm.type">
            <el-radio-button label="water">💧 浇水</el-radio-button>
            <el-radio-button label="fertilize">🧪 施肥</el-radio-button>
            <el-radio-button label="prune">✂️ 修剪</el-radio-button>
            <el-radio-button label="repot">🪴 换盆</el-radio-button>
            <el-radio-button label="other">📝 其他</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="recordForm.date" type="datetime" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="recordForm.note" type="textarea" :rows="3" placeholder="记录一下..." />
        </el-form-item>
        <el-form-item label="用量">
          <el-input v-model="recordForm.amount" placeholder="如：500ml、适量" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecordDialog = false">取消</el-button>
        <el-button type="primary" @click="addRecord">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPhotoDialog" title="上传生长照片" width="480px" destroy-on-close>
      <el-form :model="photoForm" label-position="top">
        <el-form-item label="选择照片" required>
          <el-upload :auto-upload="false" :on-change="handlePhotoChange" accept="image/*" list-type="picture-card" :limit="1" :file-list="photoFileList">
            <el-icon :size="28"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="photoForm.date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="photoForm.note" placeholder="记录这天的生长状况" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="高度(cm)">
              <el-input-number v-model="photoForm.height" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="叶片数">
              <el-input-number v-model="photoForm.leafCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showPhotoDialog = false">取消</el-button>
        <el-button type="primary" @click="addPhoto">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReminderDialog" title="添加提醒" width="520px" destroy-on-close>
      <el-form :model="reminderForm" label-position="top">
        <el-form-item label="提醒类型">
          <el-radio-group v-model="reminderForm.type">
            <el-radio-button label="water">💧 浇水</el-radio-button>
            <el-radio-button label="fertilize">🧪 施肥</el-radio-button>
            <el-radio-button label="prune">✂️ 修剪</el-radio-button>
            <el-radio-button label="repot">🪴 换盆</el-radio-button>
            <el-radio-button label="custom">📝 自定义</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提醒标题">
          <el-input v-model="reminderForm.title" placeholder="如：给小绿浇水" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="提醒日期" required>
              <el-date-picker v-model="reminderForm.scheduledDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提醒时间">
              <el-time-picker
                v-model="reminderForm.scheduledTime"
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
              <el-input-number v-model="reminderForm.repeatInterval" :min="0" placeholder="0为不重复" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重复单位" v-if="reminderForm.repeatInterval > 0">
              <el-select v-model="reminderForm.repeatUnit" style="width: 100%">
                <el-option label="天" value="day" />
                <el-option label="周" value="week" />
                <el-option label="月" value="month" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showReminderDialog = false">取消</el-button>
        <el-button type="primary" @click="addReminder">添加</el-button>
      </template>
    </el-dialog>

    <el-image-viewer v-if="showViewer" :url-list="[viewerUrl]" @close="showViewer = false" />

    <PasswordConfirmDialog
      v-model="showDeleteConfirm"
      title="确认删除"
      description="此操作将永久删除该数据，且无法恢复。请输入密码确认。"
      confirm-text="确认删除"
      :show-warning="true"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { formatDate, statusLabel, getStatusColor, sunlightLabel, difficultyLabel, careTypeLabel, getCareTypeColor, getPlantEmoji, compressImage, getDefaultTime } from '@/utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import PasswordConfirmDialog from '@/components/PasswordConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const plantId = computed(() => route.params.id as string)
const plant = computed(() => store.plants.find(p => p.id === plantId.value))

const activeTab = ref('records')
const recordFilter = ref('all')
const showRecordDialog = ref(false)
const showPhotoDialog = ref(false)
const showReminderDialog = ref(false)
const showViewer = ref(false)
const viewerUrl = ref('')
const photoFileList = ref<any[]>([])
const showDeleteConfirm = ref(false)
const deletingRecordId = ref('')
const deletingPhotoId = ref('')
const deletingReminderId = ref('')

const filteredRecords = computed(() => {
  const records = store.getRecordsByPlantId(plantId.value)
  if (recordFilter.value === 'all') return records
  return records.filter(r => r.type === recordFilter.value)
})

const plantPhotos = computed(() => store.getPhotosByPlantId(plantId.value))
const plantReminders = computed(() => store.getRemindersByPlantId(plantId.value))

const recordForm = reactive({
  type: 'water' as 'water' | 'fertilize' | 'prune' | 'repot' | 'other',
  date: new Date().toISOString().slice(0, 19).replace('Z', ''),
  note: '',
  amount: ''
})

const photoForm = reactive({
  date: new Date().toISOString().split('T')[0],
  note: '',
  height: undefined as number | undefined,
  leafCount: undefined as number | undefined,
  image: ''
})

const reminderForm = reactive({
  type: 'water' as 'water' | 'fertilize' | 'prune' | 'repot' | 'custom',
  title: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  scheduledTime: getDefaultTime(),
  repeatInterval: 0,
  repeatUnit: 'day' as 'day' | 'week' | 'month'
})

const previewPhoto = (url: string) => {
  viewerUrl.value = url
  showViewer.value = true
}

const editPlantInfo = () => {
  router.push({ path: '/plants', query: { action: 'edit', id: plantId.value } })
}

const addRecord = () => {
  store.addRecord({
    plantId: plantId.value,
    type: recordForm.type,
    date: recordForm.date || new Date().toISOString(),
    note: recordForm.note || undefined,
    amount: recordForm.amount || undefined
  })
  ElMessage.success('记录已添加')
  showRecordDialog.value = false
  Object.assign(recordForm, { type: 'water', date: new Date().toISOString().slice(0, 19), note: '', amount: '' })
}

const deleteRecord = (id: string) => {
  if (store.hasMasterPassword) {
    deletingRecordId.value = id
    deletingPhotoId.value = ''
    deletingReminderId.value = ''
    showDeleteConfirm.value = true
  } else {
    store.deleteRecord(id)
  }
}

const handlePhotoChange = async (file: any) => {
  if (file?.raw) {
    photoForm.image = await compressImage(file.raw)
  }
}

const addPhoto = () => {
  if (!photoForm.image) {
    ElMessage.warning('请选择照片')
    return
  }
  store.addPhoto({
    plantId: plantId.value,
    image: photoForm.image,
    date: photoForm.date || new Date().toISOString().split('T')[0],
    note: photoForm.note || undefined,
    height: photoForm.height,
    leafCount: photoForm.leafCount
  })
  ElMessage.success('照片已上传')
  showPhotoDialog.value = false
  Object.assign(photoForm, { date: new Date().toISOString().split('T')[0], note: '', height: undefined, leafCount: undefined, image: '' })
  photoFileList.value = []
}

const deletePhoto = (id: string) => {
  if (store.hasMasterPassword) {
    deletingRecordId.value = ''
    deletingPhotoId.value = id
    deletingReminderId.value = ''
    showDeleteConfirm.value = true
  } else {
    store.deletePhoto(id)
  }
}

const addReminder = () => {
  store.addReminder({
    plantId: plantId.value,
    type: reminderForm.type,
    title: reminderForm.title || careTypeLabel(reminderForm.type),
    scheduledDate: reminderForm.scheduledDate,
    scheduledTime: reminderForm.scheduledTime || undefined,
    repeatInterval: reminderForm.repeatInterval || undefined,
    repeatUnit: reminderForm.repeatInterval ? reminderForm.repeatUnit : undefined
  })
  ElMessage.success('提醒已添加')
  showReminderDialog.value = false
  Object.assign(reminderForm, {
    type: 'water',
    title: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: getDefaultTime(),
    repeatInterval: 0,
    repeatUnit: 'day'
  })
}

const completeReminder = (id: string) => {
  store.completeReminder(id)
  ElMessage.success('已完成')
}

const deleteReminder = (id: string) => {
  if (store.hasMasterPassword) {
    deletingRecordId.value = ''
    deletingPhotoId.value = ''
    deletingReminderId.value = id
    showDeleteConfirm.value = true
  } else {
    store.deleteReminder(id)
  }
}

const confirmDelete = () => {
  if (deletingRecordId.value) {
    store.deleteRecord(deletingRecordId.value)
    deletingRecordId.value = ''
  } else if (deletingPhotoId.value) {
    store.deletePhoto(deletingPhotoId.value)
    deletingPhotoId.value = ''
  } else if (deletingReminderId.value) {
    store.deleteReminder(deletingReminderId.value)
    deletingReminderId.value = ''
  }
  showDeleteConfirm.value = false
}

onMounted(() => {
  if (!plant.value) {
    ElMessage.error('植物不存在')
    router.push('/plants')
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.plant-detail {
  .detail-header {
    margin-bottom: 16px;
  }

  .detail-hero {
    display: flex;
    gap: 28px;
    background: $cream-light;
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid $cream-dark;

    .hero-image {
      width: 200px;
      height: 200px;
      border-radius: 16px;
      overflow: hidden;
      flex-shrink: 0;
      background: linear-gradient(135deg, $forest-green-light, $forest-green);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .emoji-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 80px;
      }
    }

    .hero-info {
      flex: 1;

      .hero-name {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        h2 { font-size: 26px; color: $brown-dark; }
      }

      .hero-species {
        font-size: 15px;
        color: $brown-light;
        margin-bottom: 12px;
      }

      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 12px;
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: $brown;
          .el-icon { color: $forest-green; }
        }
      }

      .hero-desc {
        color: $brown;
        font-size: 14px;
        line-height: 1.8;
        margin-bottom: 12px;
      }

      .hero-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 16px;
      }

      .hero-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .detail-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
    :deep(.el-tabs__item.is-active) {
      color: $forest-green;
    }
    :deep(.el-tabs__active-bar) {
      background-color: $forest-green;
    }
  }

  .tab-header {
    margin-bottom: 16px;
  }

  .record-card {
    background: $cream;
    border-radius: 10px;
    padding: 14px 16px;
    .record-header {
      display: flex;
      align-items: center;
      gap: 10px;
      .record-type { font-weight: 600; font-size: 15px; }
      .record-date { color: $brown-light; font-size: 13px; flex: 1; }
    }
    .record-note { margin-top: 8px; color: $brown; line-height: 1.6; font-size: 14px; }
    .record-amount { margin-top: 4px; color: $brown-light; font-size: 13px; }
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .photo-item {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    aspect-ratio: 1;
    background: $cream-dark;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px 12px;
      background: linear-gradient(transparent, rgba(0,0,0,0.5));
      color: #fff;
      font-size: 12px;
      .photo-note { display: block; margin-top: 2px; }
    }

    .photo-delete {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .photo-delete { opacity: 1; }
  }

  .reminder-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: $cream;
    border-radius: 10px;
    margin-bottom: 8px;

    .reminder-left {
      display: flex;
      align-items: center;
      gap: 10px;
      .reminder-type-badge {
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
      }
      .reminder-title { font-weight: 500; color: $brown-dark; }
      .reminder-schedule { color: $brown-light; font-size: 13px; }
      .reminder-repeat { color: $forest-green; font-size: 12px; }
    }

    .reminder-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}
</style>
