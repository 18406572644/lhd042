<template>
  <div class="page-container dashboard">
    <div class="welcome-section">
      <div class="welcome-text">
        <h2>🌿 绿意盎然，用心记录每一份生长</h2>
        <p>今天是 {{ todayDate }}，你有 <strong>{{ pendingReminders }}</strong> 条待办提醒</p>
      </div>
      <div class="welcome-decoration">
        <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 110 C80 90 50 80 40 60 C30 40 50 20 70 30 C90 40 80 60 100 50 C120 40 110 20 130 30 C150 40 170 20 160 60 C150 80 120 90 100 110Z" fill="#8FA978" opacity="0.3"/>
          <path d="M100 110 L100 60" stroke="#6B8E5A" stroke-width="2" opacity="0.4"/>
          <circle cx="70" cy="35" r="5" fill="#E8B4B8" opacity="0.4"/>
          <circle cx="130" cy="35" r="4" fill="#F4D03F" opacity="0.4"/>
          <path d="M30 110 Q40 100 50 110 Q60 100 70 110 Q80 100 90 110 Q100 100 110 110 Q120 100 130 110 Q140 100 150 110 Q160 100 170 110" stroke="#8B7355" stroke-width="2" fill="none" opacity="0.3"/>
        </svg>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #6B8E5A, #8FA978);">
          <el-icon :size="24"><Grape /></el-icon>
        </div>
        <div class="stat-value">{{ totalPlants }}</div>
        <div class="stat-label">我的植物</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #6B8E5A, #7CB342);">
          <el-icon :size="24"><Sunrise /></el-icon>
        </div>
        <div class="stat-value">{{ healthyPlants }}</div>
        <div class="stat-label">健康成长</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #F4D03F, #E8B4B8);">
          <el-icon :size="24"><Warning /></el-icon>
        </div>
        <div class="stat-value">{{ needsCarePlants }}</div>
        <div class="stat-label">需要照料</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #5B9BD5, #8FA978);">
          <el-icon :size="24"><Notebook /></el-icon>
        </div>
        <div class="stat-value">{{ totalRecords }}</div>
        <div class="stat-label">养护记录</div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="14">
        <div class="section-card">
          <div class="section-header">
            <h3>🌱 我的植物</h3>
            <el-button text type="primary" @click="$router.push('/plants')">查看全部</el-button>
          </div>
          <div class="plant-grid" v-if="plantList.length > 0">
            <div class="plant-card" v-for="plant in plantList.slice(0, 4)" :key="plant.id" @click="goToPlant(plant.id)">
              <div class="plant-image">
                {{ getPlantEmoji(plant.species) }}
              </div>
              <div class="plant-info">
                <div class="plant-name">
                  {{ plant.name }}
                  <el-tag size="small" :color="getStatusColor(plant.status)" effect="dark" round>
                    {{ statusLabel(plant.status) }}
                  </el-tag>
                </div>
                <div class="plant-species">{{ plant.species }} · {{ plant.location }}</div>
                <div class="plant-tags">
                  <el-tag v-for="tag in plant.tags.slice(0, 2)" :key="tag" size="small" type="info" round>{{ tag }}</el-tag>
                </div>
              </div>
            </div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-icon">🌱</div>
            <div class="empty-text">还没有植物，快去添加第一棵吧！</div>
          </div>
        </div>
      </el-col>
      <el-col :span="10">
        <div class="section-card">
          <div class="section-header">
            <h3>🔔 今日提醒</h3>
            <el-button text type="primary" @click="$router.push('/reminders')">全部</el-button>
          </div>
          <div v-if="todayReminders.length > 0">
            <div class="reminder-item" v-for="rem in todayReminders" :key="rem.id">
              <div class="reminder-dot" :style="{ background: getCareTypeColor(rem.type) }"></div>
              <div class="reminder-content">
                <div class="reminder-title">{{ rem.title }}</div>
                <div class="reminder-time">{{ formatDate(rem.scheduledDate, 'MM-DD HH:mm') }}</div>
              </div>
              <el-button size="small" type="primary" round @click="completeReminder(rem.id)">完成</el-button>
            </div>
          </div>
          <div class="empty-hint" v-else>
            <span>✨ 今天没有待办提醒</span>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3>📝 最近记录</h3>
            <el-button text type="primary" @click="$router.push('/records')">更多</el-button>
          </div>
          <div v-if="recentRecords.length > 0">
            <div class="record-item" v-for="rec in recentRecords" :key="rec.id" :style="{ borderLeftColor: getCareTypeColor(rec.type) }">
              <div class="record-icon" :style="{ background: getCareTypeColor(rec.type) + '22', color: getCareTypeColor(rec.type) }">
                {{ rec.type === 'water' ? '💧' : rec.type === 'fertilize' ? '🧪' : rec.type === 'prune' ? '✂️' : rec.type === 'repot' ? '🪴' : '📝' }}
              </div>
              <div class="record-content">
                <div class="record-title">{{ getPlantName(rec.plantId) }} · {{ careTypeLabel(rec.type) }}</div>
                <div class="record-time">{{ formatDate(rec.date, 'MM-DD HH:mm') }}</div>
              </div>
            </div>
          </div>
          <div class="empty-hint" v-else>
            <span>暂无记录</span>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { formatDate, statusLabel, getStatusColor, careTypeLabel, getCareTypeColor, getPlantEmoji } from '@/utils'

const router = useRouter()
const store = useAppStore()

const todayDate = formatDate(new Date(), 'YYYY年MM月DD日')

const plantList = computed(() => store.plants)
const totalPlants = computed(() => store.totalPlants)
const healthyPlants = computed(() => store.healthyPlants)
const needsCarePlants = computed(() => store.needsCarePlants)
const totalRecords = computed(() => store.totalRecords)
const pendingReminders = computed(() => store.todayRemindersCount)

const todayReminders = computed(() => {
  const today = new Date().toDateString()
  return store.reminders
    .filter(r => !r.completed && new Date(r.scheduledDate).toDateString() <= today)
    .slice(0, 5)
})

const recentRecords = computed(() => {
  return [...store.careRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
})

const getPlantName = (plantId: string) => {
  const plant = store.plants.find(p => p.id === plantId)
  return plant?.name || '未知植物'
}

const goToPlant = (id: string) => {
  router.push(`/plant/${id}`)
}

const completeReminder = (id: string) => {
  store.completeReminder(id)
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.dashboard {
  .welcome-section {
    background: linear-gradient(135deg, #6B8E5A 0%, #8FA978 50%, #A9C094 100%);
    border-radius: 20px;
    padding: 28px 32px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: nowrap;

    .welcome-text {
      position: relative;
      z-index: 1;
      flex: 1;
      min-width: 0;
      h2 {
        color: #F5F0E6;
        font-size: 22px;
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
      }
      p {
        color: rgba(245, 240, 230, 0.85);
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        strong {
          color: #F4D03F;
          font-size: 16px;
        }
      }
    }

    .welcome-decoration {
      width: 160px;
      height: 100px;
      flex-shrink: 0;
      position: relative;
      z-index: 0;
      svg {
        width: 100%;
        height: 100%;
      }
    }
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .section-card {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      h3 {
        font-size: 16px;
        color: $brown-dark;
      }
    }
  }

  .plant-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .reminder-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: $cream;
    border-radius: 10px;
    margin-bottom: 8px;

    .reminder-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .reminder-content {
      flex: 1;
      .reminder-title {
        font-weight: 500;
        color: $brown-dark;
        font-size: 14px;
      }
      .reminder-time {
        font-size: 12px;
        color: $brown-light;
        margin-top: 2px;
      }
    }
  }

  .empty-hint {
    text-align: center;
    padding: 24px;
    color: $brown-light;
    font-size: 14px;
  }
}
</style>
