<template>
  <div class="page-container diary-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><EditPen /></el-icon>
        生长日记
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="handleAddDiary">
          <el-icon><Plus /></el-icon> 写日记
        </el-button>
        <el-button v-if="!store.hasDiaryPassword" text @click="showSetPasswordDialog = true">
          <el-icon><Lock /></el-icon> 设置私密
        </el-button>
        <el-button v-else-if="store.canViewPrivateDiary" text @click="handleLockDiary">
          <el-icon><Lock /></el-icon> 锁定私密
        </el-button>
        <el-button v-else text @click="showUnlockDialog = true">
          <el-icon><Unlock /></el-icon> 解锁私密
        </el-button>
      </div>
    </div>

    <div class="diary-stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ store.diaryEntries.length }}</span>
        <span class="stat-label">日记总数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ currentMonthCount }}</span>
        <span class="stat-label">本月日记</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ store.getDiaryStreak }}</span>
        <span class="stat-label">最长连续</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ privateCount }}</span>
        <span class="stat-label">私密日记</span>
      </div>
    </div>

    <div class="diary-content">
      <div class="diary-left">
        <div class="calendar-section">
          <div class="calendar-header">
            <el-button text circle @click="prevMonth">
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <span class="calendar-title">{{ calendarYear }}年{{ calendarMonth + 1 }}月</span>
            <el-button text circle @click="nextMonth">
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="calendar-grid">
            <div class="calendar-weekday" v-for="w in weekdays" :key="w">{{ w }}</div>
            <div
              v-for="(day, idx) in calendarDays"
              :key="idx"
              class="calendar-day"
              :class="{
                'other-month': !day.currentMonth,
                'is-today': day.isToday,
                'has-diary': day.hasDiary,
                'is-selected': day.dateStr === selectedDate,
                'is-private': day.hasPrivateOnly && !store.canViewPrivateDiary
              }"
              @click="handleDayClick(day)"
            >
              <span class="day-number">{{ day.day }}</span>
              <div v-if="day.hasDiary" class="day-dots">
                <span
                  v-for="entry in day.entries.slice(0, 3)"
                  :key="entry.id"
                  class="dot"
                  :style="{ background: moodColor(entry.mood) }"
                ></span>
              </div>
            </div>
          </div>
        </div>

        <div class="mood-stats-section">
          <h4 class="section-label">本月心情分布</h4>
          <div class="mood-chart-container" v-if="Object.keys(currentMonthMoodStats).length > 0">
            <v-chart :option="moodChartOption" autoresize style="height: 200px" />
          </div>
          <div class="mood-empty" v-else>
            <span>本月暂无日记</span>
          </div>
        </div>
      </div>

      <div class="diary-right">
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索日记内容..."
            clearable
            prefix-icon="Search"
            style="flex: 1"
          />
          <el-select v-model="searchMood" placeholder="心情" clearable style="width: 120px">
            <el-option v-for="m in moodOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
          <el-select v-model="searchPlantId" placeholder="关联植物" clearable style="width: 140px">
            <el-option v-for="p in store.plants" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </div>

        <div class="diary-list" v-if="displayEntries.length > 0">
          <div
            v-for="entry in displayEntries"
            :key="entry.id"
            class="diary-card"
            :style="{ borderLeftColor: moodColor(entry.mood) }"
            @click="goToDetail(entry.id)"
          >
            <div class="diary-card-header">
              <div class="diary-date-info">
                <span class="diary-emoji">{{ moodEmoji(entry.mood) }}</span>
                <span class="diary-date">{{ entry.date }}</span>
                <span class="diary-weekday">{{ getWeekDay(entry.date) }}</span>
              </div>
              <div class="diary-meta">
                <span class="weather-badge" v-if="entry.weather">
                  {{ weatherEmoji(entry.weather) }} {{ weatherLabel(entry.weather) }}
                </span>
                <span class="temp-badge" v-if="entry.temperature">{{ entry.temperature }}°C</span>
                <el-tag v-if="entry.isPrivate" size="small" type="warning" round>
                  <el-icon><Lock /></el-icon> 私密
                </el-tag>
              </div>
            </div>
            <div class="diary-content-preview">{{ entry.content }}</div>
            <div class="diary-card-footer">
              <div class="diary-plants" v-if="entry.plantIds.length > 0">
                <el-tag
                  v-for="pid in entry.plantIds.slice(0, 3)"
                  :key="pid"
                  size="small"
                  round
                  type="success"
                >
                  {{ getPlantName(pid) }}
                </el-tag>
                <el-tag v-if="entry.plantIds.length > 3" size="small" round>+{{ entry.plantIds.length - 3 }}</el-tag>
              </div>
              <div class="diary-photos-count" v-if="entry.photos.length > 0">
                <el-icon><Picture /></el-icon> {{ entry.photos.length }}
              </div>
            </div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <div class="empty-icon">📖</div>
          <div class="empty-text">{{ selectedDate ? '这天还没有日记' : '暂无日记记录' }}</div>
          <el-button type="primary" v-if="selectedDate" @click="handleAddDiary">
            <el-icon><Plus /></el-icon> 写一篇
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showAddDialog" :title="editingDiary ? '编辑日记' : '写日记'" width="640px" destroy-on-close>
      <el-form :model="diaryForm" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日期">
              <el-date-picker v-model="diaryForm.date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="心情" required>
              <div class="mood-selector">
                <div
                  v-for="m in moodOptions"
                  :key="m.value"
                  class="mood-item"
                  :class="{ active: diaryForm.mood === m.value }"
                  @click="diaryForm.mood = m.value as DiaryMood"
                >
                  <span class="mood-emoji">{{ m.emoji }}</span>
                  <span class="mood-text">{{ m.label }}</span>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="今日观察" required>
          <el-input v-model="diaryForm.content" type="textarea" :rows="5" placeholder="记录今天的观察和感受..." />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="天气">
              <el-select v-model="diaryForm.weather" placeholder="选择天气" style="width: 100%">
                <el-option v-for="w in weatherOptions" :key="w.value" :label="w.label" :value="w.value">
                  {{ w.emoji }} {{ w.label }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="温度(°C)">
              <el-input-number v-model="diaryForm.temperature" :min="-40" :max="50" placeholder="温度" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="私密日记">
              <el-switch v-model="diaryForm.isPrivate" active-text="私密" inactive-text="公开" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关联植物">
          <el-select v-model="diaryForm.plantIds" multiple placeholder="选择关联的植物" style="width: 100%">
            <el-option v-for="p in store.plants" :key="p.id" :label="p.name + ' (' + p.species + ')'" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传照片">
          <div class="photo-upload-area">
            <div class="photo-list">
              <div v-for="(photo, idx) in diaryForm.photos" :key="idx" class="photo-preview">
                <img :src="photo" alt="photo" />
                <div class="photo-remove" @click="removePhoto(idx)">×</div>
              </div>
              <div class="photo-add" @click="triggerFileInput" v-if="diaryForm.photos.length < 9">
                <el-icon :size="24"><Plus /></el-icon>
                <span>添加</span>
              </div>
            </div>
            <input ref="fileInputRef" type="file" accept="image/*" multiple style="display: none" @change="handleFileChange" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitDiary">{{ editingDiary ? '保存' : '发布' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showSetPasswordDialog" title="设置私密日记密码" width="420px" destroy-on-close>
      <el-form :model="passwordForm" label-position="top">
        <el-form-item label="设置密码" required>
          <el-input v-model="passwordForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入密码" />
        </el-form-item>
        <el-form-item label="密码提示（可选）">
          <el-input v-model="passwordForm.hint" placeholder="如：我的生日" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSetPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSetPassword">确认设置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showUnlockDialog" title="解锁私密日记" width="400px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="输入密码">
          <el-input v-model="unlockPassword" type="password" show-password placeholder="请输入私密日记密码" @keyup.enter="handleUnlock" />
        </el-form-item>
        <div v-if="store.diaryPassword?.passwordHint" class="password-hint">
          💡 提示：{{ store.diaryPassword.passwordHint }}
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showUnlockDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUnlock">解锁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { formatDate, moodEmoji, moodLabel, moodColor, weatherEmoji, weatherLabel, getWeekDay, getMonthDays, getFirstDayOfWeek, todayStr, compressImage } from '@/utils'
import { ElMessage } from 'element-plus'
import type { DiaryMood, WeatherCondition, DiaryEntry } from '@/types'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent])

const router = useRouter()
const store = useAppStore()

const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())
const selectedDate = ref('')
const searchKeyword = ref('')
const searchMood = ref('')
const searchPlantId = ref('')
const showAddDialog = ref(false)
const showSetPasswordDialog = ref(false)
const showUnlockDialog = ref(false)
const editingDiary = ref<DiaryEntry | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const unlockPassword = ref('')

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

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

const diaryForm = reactive({
  date: todayStr(),
  content: '',
  mood: 'happy' as DiaryMood,
  plantIds: [] as string[],
  photos: [] as string[],
  weather: 'sunny' as WeatherCondition,
  temperature: undefined as number | undefined,
  isPrivate: false
})

const passwordForm = reactive({
  password: '',
  confirmPassword: '',
  hint: ''
})

interface CalendarDay {
  day: number
  dateStr: string
  currentMonth: boolean
  isToday: boolean
  hasDiary: boolean
  hasPrivateOnly: boolean
  entries: DiaryEntry[]
}

const calendarDays = computed(() => {
  const days: CalendarDay[] = []
  const year = calendarYear.value
  const month = calendarMonth.value
  const totalDays = getMonthDays(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const todayDate = todayStr()

  const prevMonthDays = getMonthDays(year, month - 1)
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entries = store.getDiaryByDate(dateStr)
    const visibleEntries = entries.filter(e => !e.isPrivate || store.canViewPrivateDiary)
    days.push({
      day,
      dateStr,
      currentMonth: false,
      isToday: dateStr === todayDate,
      hasDiary: visibleEntries.length > 0,
      hasPrivateOnly: entries.length > 0 && visibleEntries.length === 0,
      entries: visibleEntries
    })
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const entries = store.getDiaryByDate(dateStr)
    const visibleEntries = entries.filter(e => !e.isPrivate || store.canViewPrivateDiary)
    days.push({
      day: d,
      dateStr,
      currentMonth: true,
      isToday: dateStr === todayDate,
      hasDiary: visibleEntries.length > 0,
      hasPrivateOnly: entries.length > 0 && visibleEntries.length === 0,
      entries: visibleEntries
    })
  }

  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const entries = store.getDiaryByDate(dateStr)
    const visibleEntries = entries.filter(e => !e.isPrivate || store.canViewPrivateDiary)
    days.push({
      day: d,
      dateStr,
      currentMonth: false,
      isToday: dateStr === todayDate,
      hasDiary: visibleEntries.length > 0,
      hasPrivateOnly: entries.length > 0 && visibleEntries.length === 0,
      entries: visibleEntries
    })
  }

  return days
})

const displayEntries = computed(() => {
  if (selectedDate.value) {
    let entries = store.getDiaryByDate(selectedDate.value)
    if (!store.canViewPrivateDiary) {
      entries = entries.filter(e => !e.isPrivate)
    }
    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const results = store.searchDiaryEntries({
    keyword: searchKeyword.value || undefined,
    mood: (searchMood.value as DiaryMood) || undefined,
    plantId: searchPlantId.value || undefined,
    includePrivate: store.canViewPrivateDiary
  })

  if (!searchKeyword.value && !searchMood.value && !searchPlantId.value) {
    let entries = store.canViewPrivateDiary ? store.allDiaryEntries : store.publicDiaryEntries
    return entries.slice(0, 30)
  }

  return results.slice(0, 30)
})

const currentMonthCount = computed(() => {
  const now = new Date()
  return store.diaryEntries.filter(d => {
    const date = new Date(d.date)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length
})

const privateCount = computed(() => {
  return store.diaryEntries.filter(d => d.isPrivate).length
})

const currentMonthMoodStats = computed(() => {
  return store.getDiaryMoodStats(calendarMonth.value, calendarYear.value)
})

const moodChartOption = computed(() => {
  const stats = currentMonthMoodStats.value
  const data = Object.entries(stats).map(([key, value]) => ({
    name: moodLabel(key),
    value: value as number,
    itemStyle: { color: moodColor(key) }
  }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}篇 ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: '#FAF8F3', borderWidth: 2 },
      label: { fontSize: 11, color: '#6B5344' },
      data
    }]
  }
})

const prevMonth = () => {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
  selectedDate.value = ''
}

const nextMonth = () => {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
  selectedDate.value = ''
}

const handleDayClick = (day: CalendarDay) => {
  selectedDate.value = day.dateStr === selectedDate.value ? '' : day.dateStr
  searchKeyword.value = ''
  searchMood.value = ''
  searchPlantId.value = ''
}

const handleAddDiary = () => {
  editingDiary.value = null
  Object.assign(diaryForm, {
    date: selectedDate.value || todayStr(),
    content: '',
    mood: 'happy',
    plantIds: [],
    photos: [],
    weather: 'sunny',
    temperature: undefined,
    isPrivate: false
  })
  showAddDialog.value = true
}

const getPlantName = (plantId: string) => {
  return store.plants.find(p => p.id === plantId)?.name || '未知植物'
}

const goToDetail = (id: string) => {
  router.push(`/diary/${id}`)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files) return
  for (let i = 0; i < input.files.length && diaryForm.photos.length < 9; i++) {
    try {
      const compressed = await compressImage(input.files[i], 600, 0.7)
      diaryForm.photos.push(compressed)
    } catch {
      ElMessage.error('图片处理失败')
    }
  }
  input.value = ''
}

const removePhoto = (idx: number) => {
  diaryForm.photos.splice(idx, 1)
}

const submitDiary = () => {
  if (!diaryForm.content.trim()) {
    ElMessage.warning('请输入今日观察')
    return
  }
  if (!diaryForm.mood) {
    ElMessage.warning('请选择心情')
    return
  }

  if (editingDiary.value) {
    store.updateDiaryEntry(editingDiary.value.id, {
      date: diaryForm.date,
      content: diaryForm.content,
      mood: diaryForm.mood,
      plantIds: diaryForm.plantIds,
      photos: diaryForm.photos,
      weather: diaryForm.weather,
      temperature: diaryForm.temperature,
      isPrivate: diaryForm.isPrivate
    })
    ElMessage.success('日记已更新')
  } else {
    store.addDiaryEntry({
      date: diaryForm.date,
      content: diaryForm.content,
      mood: diaryForm.mood,
      plantIds: diaryForm.plantIds,
      photos: diaryForm.photos,
      weather: diaryForm.weather,
      temperature: diaryForm.temperature,
      isPrivate: diaryForm.isPrivate
    })
    ElMessage.success('日记已发布 🎉')
  }

  showAddDialog.value = false
  editingDiary.value = null
}

const handleSetPassword = () => {
  if (!passwordForm.password) {
    ElMessage.warning('请输入密码')
    return
  }
  if (passwordForm.password !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  if (passwordForm.password.length < 4) {
    ElMessage.warning('密码至少4位')
    return
  }
  store.setDiaryPassword(passwordForm.password, passwordForm.hint || undefined)
  ElMessage.success('私密日记密码已设置')
  showSetPasswordDialog.value = false
  Object.assign(passwordForm, { password: '', confirmPassword: '', hint: '' })
}

const handleUnlock = () => {
  if (!unlockPassword.value) {
    ElMessage.warning('请输入密码')
    return
  }
  const valid = store.verifyDiaryPassword(unlockPassword.value)
  if (valid) {
    ElMessage.success('解锁成功')
    showUnlockDialog.value = false
    unlockPassword.value = ''
  } else {
    ElMessage.error('密码错误')
  }
}

const handleLockDiary = () => {
  store.lockDiary()
  ElMessage.success('私密日记已锁定')
}

onMounted(() => {
  calendarYear.value = new Date().getFullYear()
  calendarMonth.value = new Date().getMonth()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.diary-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;

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

    .page-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  .diary-stats-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .stat-item {
      background: $cream-light;
      border: 1px solid $cream-dark;
      border-radius: 12px;
      padding: 16px 20px;
      text-align: center;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(107, 142, 90, 0.1);
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: $forest-green;
        display: block;
      }

      .stat-label {
        font-size: 13px;
        color: $brown-light;
        margin-top: 4px;
        display: block;
      }
    }
  }

  .diary-content {
    display: flex;
    gap: 24px;

    .diary-left {
      width: 340px;
      flex-shrink: 0;

      .calendar-section {
        background: $cream-light;
        border: 1px solid $cream-dark;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;

          .calendar-title {
            font-size: 16px;
            font-weight: 600;
            color: $brown-dark;
          }
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;

          .calendar-weekday {
            text-align: center;
            font-size: 12px;
            color: $brown-light;
            padding: 4px 0;
            font-weight: 500;
          }

          .calendar-day {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            gap: 2px;

            .day-number {
              font-size: 14px;
              color: $brown-dark;
            }

            .day-dots {
              display: flex;
              gap: 2px;

              .dot {
                width: 5px;
                height: 5px;
                border-radius: 50%;
              }
            }

            &.other-month {
              .day-number {
                color: $brown-light;
                opacity: 0.4;
              }
            }

            &.is-today {
              background: rgba(107, 142, 90, 0.12);
              .day-number { font-weight: 700; color: $forest-green; }
            }

            &.has-diary {
              background: rgba(107, 142, 90, 0.08);
              &:hover { background: rgba(107, 142, 90, 0.18); }
            }

            &.is-selected {
              background: $forest-green;
              .day-number { color: #fff; font-weight: 600; }
              .dot { opacity: 0.8; }
            }

            &.is-private {
              background: rgba(232, 180, 184, 0.15);
            }

            &:hover {
              background: rgba(107, 142, 90, 0.1);
            }
          }
        }
      }

      .mood-stats-section {
        background: $cream-light;
        border: 1px solid $cream-dark;
        border-radius: 16px;
        padding: 20px;

        .section-label {
          font-size: 14px;
          font-weight: 600;
          color: $brown-dark;
          margin-bottom: 12px;
        }

        .mood-empty {
          text-align: center;
          padding: 20px;
          color: $brown-light;
          font-size: 13px;
        }
      }
    }

    .diary-right {
      flex: 1;
      min-width: 0;

      .search-bar {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .diary-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .diary-card {
        background: $cream-light;
        border: 1px solid $cream-dark;
        border-left: 4px solid $forest-green;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(107, 142, 90, 0.12);
        }

        .diary-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .diary-date-info {
            display: flex;
            align-items: center;
            gap: 8px;

            .diary-emoji { font-size: 22px; }
            .diary-date { font-size: 15px; font-weight: 600; color: $brown-dark; }
            .diary-weekday { font-size: 13px; color: $brown-light; }
          }

          .diary-meta {
            display: flex;
            align-items: center;
            gap: 8px;

            .weather-badge {
              font-size: 13px;
              color: $brown;
              background: rgba(107, 142, 90, 0.08);
              padding: 2px 8px;
              border-radius: 10px;
            }

            .temp-badge {
              font-size: 13px;
              color: $brown;
              background: rgba(91, 155, 213, 0.1);
              padding: 2px 8px;
              border-radius: 10px;
            }
          }
        }

        .diary-content-preview {
          font-size: 14px;
          color: $brown;
          line-height: 1.6;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .diary-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .diary-plants {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .diary-photos-count {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: $brown-light;
          }
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;

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

        &:hover {
          border-color: $forest-green;
          color: $forest-green;
        }
      }
    }
  }

  .password-hint {
    background: rgba(244, 208, 63, 0.15);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    color: $brown;
    margin-top: 4px;
  }
}
</style>
