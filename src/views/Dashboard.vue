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

    <div class="smart-section" v-if="(store.activeSuggestionsCount > 0 || store.activeWarningsCount > 0) && store.settings.smartSuggestionsEnabled">
      <div class="section-header">
        <h3>💡 智能提醒</h3>
        <el-button text type="primary" @click="$router.push('/suggestions')">查看全部</el-button>
      </div>
      <div class="smart-cards">
        <div v-if="store.activeSuggestions.length > 0" class="smart-card suggestions-card">
          <div class="smart-card-header">
            <el-icon><MagicStick /></el-icon>
            <span>养护建议</span>
            <el-tag size="small" type="primary" effect="dark" round>{{ store.activeSuggestionsCount }}</el-tag>
          </div>
          <div class="smart-card-content">
            <div
              v-for="suggestion in store.activeSuggestions.slice(0, 2)"
              :key="suggestion.id"
              class="smart-item"
            >
              <div class="smart-item-icon" :style="{ background: getPriorityBg(suggestion.priority) }">
                {{ getSuggestionTypeIcon(suggestion.type) }}
              </div>
              <div class="smart-item-content">
                <div class="smart-item-title">{{ suggestion.title }}</div>
                <div class="smart-item-desc">{{ suggestion.content }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="store.activeWarnings.length > 0" class="smart-card warnings-card">
          <div class="smart-card-header">
            <el-icon><Warning /></el-icon>
            <span>智能预警</span>
            <el-tag size="small" type="danger" effect="dark" round>{{ store.activeWarningsCount }}</el-tag>
          </div>
          <div class="smart-card-content">
            <div
              v-for="warning in store.activeWarnings.slice(0, 2)"
              :key="warning.id"
              class="smart-item"
            >
              <div class="smart-item-icon" :style="{ background: getRiskBg(warning.riskLevel) }">
                {{ getWarningTypeIcon(warning.type) }}
              </div>
              <div class="smart-item-content">
                <div class="smart-item-title">{{ warning.title }}</div>
                <div class="smart-item-desc">{{ warning.plantName }} · {{ warning.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="achievement-preview">
      <div class="section-header">
        <h3>🏆 我的成就</h3>
        <el-button text type="primary" @click="$router.push('/achievements')">查看全部</el-button>
      </div>
      <div class="achievement-stats">
        <div class="achievement-stat">
          <div class="stat-icon" style="background: linear-gradient(135deg, #F39C12, #E67E22);">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.unlockedAchievementsCount }} / {{ store.totalAchievementsCount }}</div>
            <div class="stat-label">已解锁成就</div>
          </div>
        </div>
        <div v-if="store.careScore" class="achievement-stat">
          <div class="stat-icon" :style="{ background: getLevelGradient(store.careScore.level) }">
            {{ getLevelIcon(store.careScore.level) }}
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careScore.totalScore }} 分</div>
            <div class="stat-label" :style="{ color: getLevelColor(store.careScore.level) }">
              {{ getLevelName(store.careScore.level) }}
            </div>
          </div>
        </div>
        <div v-if="store.careStats" class="achievement-stat">
          <div class="stat-icon" style="background: linear-gradient(135deg, #6B8E5A, #8FA978);">
            🔥
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careStats.currentStreak }} 天</div>
            <div class="stat-label">连续养护</div>
          </div>
        </div>
        <div v-if="store.careStats" class="achievement-stat">
          <div class="stat-icon" style="background: linear-gradient(135deg, #9B59B6, #BB8FCE);">
            📝
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careStats.totalRecords }} 次</div>
            <div class="stat-label">养护记录</div>
          </div>
        </div>
      </div>
      <div class="achievement-preview-list">
        <div
          v-for="achievement in latestAchievements"
          :key="achievement.id"
          class="achievement-preview-item"
          :class="{ unlocked: achievement.unlocked }"
        >
          <span class="achievement-icon">{{ achievement.icon }}</span>
          <div class="achievement-info">
            <div class="achievement-name">{{ achievement.name }}</div>
            <el-progress
              :percentage="Math.round(achievement.progress / achievement.target * 100)"
              :color="achievement.unlocked ? getRarityColor(achievement.rarity) : '#95A5A6'"
              :stroke-width="4"
            />
          </div>
        </div>
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
                <div class="reminder-time">
                  {{ formatDate(rem.scheduledDate, 'MM-DD') }}
                  <span v-if="rem.scheduledTime">{{ rem.scheduledTime }}</span>
                </div>
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
import { Trophy, MagicStick, Warning } from '@element-plus/icons-vue'
import {
  getPriorityColor,
  getPriorityName,
  getSuggestionTypeIcon,
  getWarningTypeIcon,
  getRarityColor,
  getRarityName,
  getLevelName
} from '@/utils/careAI'

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

const latestAchievements = computed(() => {
  return [...store.achievements]
    .sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1
      if (!a.unlocked && b.unlocked) return 1
      return b.progress / b.target - a.progress / a.target
    })
    .slice(0, 3)
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

const getPriorityBg = (priority: string): string => {
  const color = getPriorityColor(priority)
  return color + '22'
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

const getLevelColor = (level: string): string => {
  const map: Record<string, string> = {
    beginner: '#95A5A6',
    apprentice: '#3498DB',
    gardener: '#27AE60',
    expert: '#9B59B6',
    master: '#F39C12'
  }
  return map[level] || '#95A5A6'
}

const getLevelGradient = (level: string): string => {
  const map: Record<string, string> = {
    beginner: 'linear-gradient(135deg, #BDC3C7, #95A5A6)',
    apprentice: 'linear-gradient(135deg, #5DADE2, #3498DB)',
    gardener: 'linear-gradient(135deg, #58D68D, #27AE60)',
    expert: 'linear-gradient(135deg, #BB8FCE, #9B59B6)',
    master: 'linear-gradient(135deg, #F5B041, #F39C12)'
  }
  return map[level] || 'linear-gradient(135deg, #BDC3C7, #95A5A6)'
}

const getLevelIcon = (level: string): string => {
  const map: Record<string, string> = {
    beginner: '🌱',
    apprentice: '🌿',
    gardener: '🌳',
    expert: '🏆',
    master: '👑'
  }
  return map[level] || '🌱'
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

  .smart-section {
    margin-bottom: 24px;

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

    .smart-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .smart-card {
      background: $cream-light;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      &.suggestions-card {
        border-left: 4px solid $forest-green;
      }

      &.warnings-card {
        border-left: 4px solid #E74C3C;
      }

      .smart-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-weight: 600;
        color: $brown-dark;

        .el-icon {
          font-size: 18px;
          color: $forest-green;
        }
      }

      .smart-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: $cream-light;
        border-radius: 10px;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .smart-item-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .smart-item-content {
          flex: 1;
          min-width: 0;

          .smart-item-title {
            font-weight: 500;
            color: $brown-dark;
            font-size: 14px;
            margin-bottom: 2px;
          }

          .smart-item-desc {
            font-size: 12px;
            color: $brown-light;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }

  .achievement-preview {
    margin-bottom: 24px;

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

    .achievement-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .achievement-stat {
      background: $cream-light;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 22px;
        flex-shrink: 0;

        .el-icon {
          font-size: 22px;
        }
      }

      .stat-info {
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: $brown-dark;
        }

        .stat-label {
          font-size: 12px;
          color: $brown-light;
        }
      }
    }

    .achievement-preview-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .achievement-preview-item {
      background: $cream-light;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      opacity: 0.6;
      transition: all 0.2s;

      &.unlocked {
        opacity: 1;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .achievement-icon {
        font-size: 28px;
        flex-shrink: 0;
      }

      .achievement-info {
        flex: 1;
        min-width: 0;

        .achievement-name {
          font-size: 13px;
          font-weight: 500;
          color: $brown-dark;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
