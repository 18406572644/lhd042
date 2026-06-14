<template>
  <div class="page-container diary-detail-page" v-if="diary">
    <div class="detail-header">
      <el-button text @click="router.push('/diary')">
        <el-icon><ArrowLeft /></el-icon> 返回日记
      </el-button>
      <div class="detail-actions">
        <el-button text @click="handleEdit">
          <el-icon><Edit /></el-icon> 编辑
        </el-button>
        <el-button text type="danger" @click="handleDelete">
          <el-icon><Delete /></el-icon> 删除
        </el-button>
      </div>
    </div>

    <div class="detail-content" :style="{ borderTopColor: moodColor(diary.mood) }">
      <div class="detail-top">
        <div class="detail-mood">
          <span class="mood-emoji">{{ moodEmoji(diary.mood) }}</span>
          <span class="mood-label" :style="{ color: moodColor(diary.mood) }">{{ moodLabel(diary.mood) }}</span>
        </div>
        <el-tag v-if="diary.isPrivate" type="warning" round>
          <el-icon><Lock /></el-icon> 私密日记
        </el-tag>
      </div>

      <div class="detail-date-row">
        <div class="detail-date">
          <el-icon><Calendar /></el-icon>
          <span>{{ diary.date }}</span>
          <span class="detail-weekday">{{ getWeekDay(diary.date) }}</span>
        </div>
        <div class="detail-weather" v-if="diary.weather">
          <span>{{ weatherEmoji(diary.weather) }} {{ weatherLabel(diary.weather) }}</span>
          <span v-if="diary.temperature" class="detail-temp">{{ diary.temperature }}°C</span>
        </div>
      </div>

      <div class="detail-body">
        <div class="detail-text">{{ diary.content }}</div>
      </div>

      <div class="detail-photos" v-if="diary.photos.length > 0">
        <h4 class="detail-section-title">📷 日记照片</h4>
        <div class="photos-grid">
          <div v-for="(photo, idx) in diary.photos" :key="idx" class="photo-item" @click="previewPhoto(idx)">
            <img :src="photo" alt="photo" />
          </div>
        </div>
      </div>

      <div class="detail-plants" v-if="diary.plantIds.length > 0">
        <h4 class="detail-section-title">🌱 关联植物</h4>
        <div class="plants-list">
          <div
            v-for="pid in diary.plantIds"
            :key="pid"
            class="plant-tag"
            @click="router.push(`/plant/${pid}`)"
          >
            <span class="plant-emoji">{{ getPlantEmoji(getPlantSpecies(pid)) }}</span>
            <span class="plant-name">{{ getPlantName(pid) }}</span>
          </div>
        </div>
      </div>

      <div class="detail-footer">
        <span>创建于 {{ formatDate(diary.createdAt, 'YYYY-MM-DD HH:mm') }}</span>
        <span v-if="diary.updatedAt !== diary.createdAt">
          · 更新于 {{ formatDate(diary.updatedAt, 'YYYY-MM-DD HH:mm') }}
        </span>
      </div>
    </div>

    <el-dialog v-model="showEditDialog" title="编辑日记" width="640px" destroy-on-close>
      <el-form :model="editForm" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日期">
              <el-date-picker v-model="editForm.date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="心情" required>
              <div class="mood-selector">
                <div
                  v-for="m in moodOptions"
                  :key="m.value"
                  class="mood-item"
                  :class="{ active: editForm.mood === m.value }"
                  @click="editForm.mood = m.value as DiaryMood"
                >
                  <span class="mood-emoji">{{ m.emoji }}</span>
                  <span class="mood-text">{{ m.label }}</span>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="今日观察" required>
          <el-input v-model="editForm.content" type="textarea" :rows="5" placeholder="记录今天的观察和感受..." />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="天气">
              <el-select v-model="editForm.weather" placeholder="选择天气" style="width: 100%">
                <el-option v-for="w in weatherOptions" :key="w.value" :label="w.label" :value="w.value">
                  {{ w.emoji }} {{ w.label }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="温度(°C)">
              <el-input-number v-model="editForm.temperature" :min="-40" :max="50" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="私密日记">
              <el-switch v-model="editForm.isPrivate" active-text="私密" inactive-text="公开" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关联植物">
          <el-select v-model="editForm.plantIds" multiple placeholder="选择关联的植物" style="width: 100%">
            <el-option v-for="p in store.plants" :key="p.id" :label="p.name + ' (' + p.species + ')'" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传照片">
          <div class="photo-upload-area">
            <div class="photo-list">
              <div v-for="(photo, idx) in editForm.photos" :key="idx" class="photo-preview">
                <img :src="photo" alt="photo" />
                <div class="photo-remove" @click="removeEditPhoto(idx)">×</div>
              </div>
              <div class="photo-add" @click="triggerEditFileInput" v-if="editForm.photos.length < 9">
                <el-icon :size="24"><Plus /></el-icon>
                <span>添加</span>
              </div>
            </div>
            <input ref="editFileInputRef" type="file" accept="image/*" multiple style="display: none" @change="handleEditFileChange" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPhotoPreview" width="auto" style="max-width: 90vw" destroy-on-close>
      <img :src="diary?.photos[previewIdx] || ''" alt="preview" style="max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 8px" />
    </el-dialog>
  </div>

  <div class="page-container diary-detail-page" v-else>
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <div class="empty-text">日记不存在或已被删除</div>
      <el-button type="primary" @click="router.push('/diary')">返回日记</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { formatDate, moodEmoji, moodLabel, moodColor, weatherEmoji, weatherLabel, getWeekDay, getPlantEmoji, compressImage } from '@/utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { DiaryMood, WeatherCondition } from '@/types'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const showEditDialog = ref(false)
const showPhotoPreview = ref(false)
const previewIdx = ref(0)
const editFileInputRef = ref<HTMLInputElement | null>(null)

const diary = computed(() => {
  const id = route.params.id as string
  return store.getDiaryById(id)
})

const moodOptions = [
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'calm', label: '平静', emoji: '😌' },
  { value: 'worried', label: '担心', emoji: '😟' },
  { value: 'surprised', label: '惊喜', emoji: '😲' },
  { value: 'sad', label: '难过', emoji: '😢' },
  { value: 'excited', label: '兴奋', emoji: '🤩' },
  { value: 'grateful', label: '感恩', emoji: '🙏' },
  { value: 'tired', label: '疲惫', emoji: '😴' }
]

const weatherOptions = [
  { value: 'sunny', label: '晴天', emoji: '☀️' },
  { value: 'cloudy', label: '多云', emoji: '☁️' },
  { value: 'rainy', label: '雨天', emoji: '🌧️' },
  { value: 'snowy', label: '雪天', emoji: '❄️' },
  { value: 'windy', label: '大风', emoji: '💨' },
  { value: 'foggy', label: '雾天', emoji: '🌫️' },
  { value: 'hot', label: '酷热', emoji: '🔥' },
  { value: 'cold', label: '寒冷', emoji: '🥶' }
]

const editForm = reactive({
  date: '',
  content: '',
  mood: 'happy' as DiaryMood,
  plantIds: [] as string[],
  photos: [] as string[],
  weather: 'sunny' as WeatherCondition,
  temperature: undefined as number | undefined,
  isPrivate: false
})

const getPlantName = (plantId: string) => {
  return store.plants.find(p => p.id === plantId)?.name || '未知植物'
}

const getPlantSpecies = (plantId: string) => {
  return store.plants.find(p => p.id === plantId)?.species || ''
}

const previewPhoto = (idx: number) => {
  previewIdx.value = idx
  showPhotoPreview.value = true
}

const handleEdit = () => {
  if (!diary.value) return
  Object.assign(editForm, {
    date: diary.value.date,
    content: diary.value.content,
    mood: diary.value.mood,
    plantIds: [...diary.value.plantIds],
    photos: [...diary.value.photos],
    weather: diary.value.weather,
    temperature: diary.value.temperature,
    isPrivate: diary.value.isPrivate
  })
  showEditDialog.value = true
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这篇日记吗？删除后无法恢复。', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    if (diary.value) {
      store.deleteDiaryEntry(diary.value.id)
      ElMessage.success('日记已删除')
      router.push('/diary')
    }
  } catch {
    // cancelled
  }
}

const triggerEditFileInput = () => {
  editFileInputRef.value?.click()
}

const handleEditFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files) return
  for (let i = 0; i < input.files.length && editForm.photos.length < 9; i++) {
    try {
      const compressed = await compressImage(input.files[i], 600, 0.7)
      editForm.photos.push(compressed)
    } catch {
      ElMessage.error('图片处理失败')
    }
  }
  input.value = ''
}

const removeEditPhoto = (idx: number) => {
  editForm.photos.splice(idx, 1)
}

const submitEdit = () => {
  if (!diary.value) return
  if (!editForm.content.trim()) {
    ElMessage.warning('请输入今日观察')
    return
  }
  store.updateDiaryEntry(diary.value.id, {
    date: editForm.date,
    content: editForm.content,
    mood: editForm.mood,
    plantIds: editForm.plantIds,
    photos: editForm.photos,
    weather: editForm.weather,
    temperature: editForm.temperature,
    isPrivate: editForm.isPrivate
  })
  ElMessage.success('日记已更新')
  showEditDialog.value = false
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.diary-detail-page {
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .detail-content {
    background: $cream-light;
    border: 1px solid $cream-dark;
    border-top: 4px solid $forest-green;
    border-radius: 16px;
    padding: 28px;
    max-width: 800px;

    .detail-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .detail-mood {
        display: flex;
        align-items: center;
        gap: 10px;

        .mood-emoji { font-size: 36px; }
        .mood-label { font-size: 20px; font-weight: 600; }
      }
    }

    .detail-date-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid $cream-dark;
      margin-bottom: 20px;

      .detail-date {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        color: $brown;

        .detail-weekday {
          color: $brown-light;
        }
      }

      .detail-weather {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        color: $brown;

        .detail-temp {
          background: rgba(91, 155, 213, 0.1);
          padding: 2px 10px;
          border-radius: 10px;
        }
      }
    }

    .detail-body {
      margin-bottom: 24px;

      .detail-text {
        font-size: 16px;
        line-height: 1.8;
        color: $brown-dark;
        white-space: pre-wrap;
        word-break: break-word;
      }
    }

    .detail-photos {
      margin-bottom: 24px;

      .detail-section-title {
        font-size: 15px;
        font-weight: 600;
        color: $brown-dark;
        margin-bottom: 12px;
      }

      .photos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;

        .photo-item {
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;

          &:hover { transform: scale(1.03); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }

          img { width: 100%; height: 100%; object-fit: cover; }
        }
      }
    }

    .detail-plants {
      margin-bottom: 24px;

      .detail-section-title {
        font-size: 15px;
        font-weight: 600;
        color: $brown-dark;
        margin-bottom: 12px;
      }

      .plants-list {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;

        .plant-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(107, 142, 90, 0.08);
          border: 1px solid rgba(107, 142, 90, 0.2);
          border-radius: 20px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: rgba(107, 142, 90, 0.15);
            border-color: $forest-green;
          }

          .plant-emoji { font-size: 18px; }
          .plant-name { font-size: 14px; font-weight: 500; color: $brown-dark; }
        }
      }
    }

    .detail-footer {
      padding-top: 16px;
      border-top: 1px solid $cream-dark;
      font-size: 13px;
      color: $brown-light;
    }
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;

    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-text { font-size: 16px; color: $brown-light; margin-bottom: 20px; }
  }

  .mood-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .mood-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      border: 2px solid $cream-dark;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;

      .mood-emoji { font-size: 22px; }
      .mood-text { font-size: 12px; color: $brown-light; }

      &:hover { border-color: $forest-green; }

      &.active {
        border-color: $forest-green;
        background: rgba(107, 142, 90, 0.1);
        .mood-text { color: $forest-green; font-weight: 600; }
      }
    }
  }

  .photo-upload-area {
    .photo-list {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      .photo-preview {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        position: relative;

        img { width: 100%; height: 100%; object-fit: cover; }

        .photo-remove {
          position: absolute;
          top: 0;
          right: 0;
          width: 20px;
          height: 20px;
          background: rgba(231, 76, 60, 0.85);
          color: #fff;
          border-radius: 0 8px 0 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
          line-height: 1;
        }
      }

      .photo-add {
        width: 80px;
        height: 80px;
        border: 2px dashed $cream-dark;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        cursor: pointer;
        color: $brown-light;
        font-size: 12px;
        transition: all 0.2s;

        &:hover { border-color: $forest-green; color: $forest-green; }
      }
    }
  }
}
</style>
