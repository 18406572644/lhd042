<template>
  <div class="page-container achievements-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Trophy /></el-icon>
        成就中心
      </div>
      <el-button type="primary" plain @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <div v-if="store.careScore" class="score-card">
      <div class="score-header">
        <div class="score-info">
          <div class="score-label">养护评分</div>
          <div class="score-value">{{ store.careScore.totalScore }}</div>
          <div class="score-level" :style="{ color: getLevelColor(store.careScore.level) }">
            {{ getLevelName(store.careScore.level) }}
          </div>
        </div>
        <div class="score-badge" :style="{ background: getLevelGradient(store.careScore.level) }">
          {{ getLevelIcon(store.careScore.level) }}
        </div>
      </div>
      <div class="score-details">
        <div class="score-item">
          <div class="score-item-header">
            <span class="score-item-label">养护连贯性</span>
            <span class="score-item-value">{{ store.careScore.consistencyScore }}%</span>
          </div>
          <el-progress :percentage="store.careScore.consistencyScore" color="#6B8E5A" :stroke-width="8" />
        </div>
        <div class="score-item">
          <div class="score-item-header">
            <span class="score-item-label">及时性</span>
            <span class="score-item-value">{{ store.careScore.timelinessScore }}%</span>
          </div>
          <el-progress :percentage="store.careScore.timelinessScore" color="#3498DB" :stroke-width="8" />
        </div>
        <div class="score-item">
          <div class="score-item-header">
            <span class="score-item-label">植物健康</span>
            <span class="score-item-value">{{ store.careScore.plantHealthScore }}%</span>
          </div>
          <el-progress :percentage="store.careScore.plantHealthScore" color="#7CB342" :stroke-width="8" />
        </div>
        <div class="score-item">
          <div class="score-item-header">
            <span class="score-item-label">养护知识</span>
            <span class="score-item-value">{{ store.careScore.knowledgeScore }}%</span>
          </div>
          <el-progress :percentage="store.careScore.knowledgeScore" color="#9B59B6" :stroke-width="8" />
        </div>
      </div>
    </div>

    <div v-if="store.careStats" class="stats-card">
      <h3 class="section-title">📊 养护统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon" style="background: linear-gradient(135deg, #6B8E5A, #8FA978);">
            🔥
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careStats.currentStreak }}</div>
            <div class="stat-label">连续养护天数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: linear-gradient(135deg, #F39C12, #E67E22);">
            🏆
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careStats.longestStreak }}</div>
            <div class="stat-label">最长连续天数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3498DB, #5DADE2);">
            📅
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careStats.totalCareDays }}</div>
            <div class="stat-label">总养护天数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: linear-gradient(135deg, #9B59B6, #BB8FCE);">
            📝
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careStats.totalRecords }}</div>
            <div class="stat-label">总养护记录</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: linear-gradient(135deg, #5B9BD5, #8FA978);">
            💧
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careStats.waterCount }}</div>
            <div class="stat-label">浇水次数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: linear-gradient(135deg, #8FA978, #7CB342);">
            🧪
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careStats.fertilizeCount }}</div>
            <div class="stat-label">施肥次数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: linear-gradient(135deg, #E8B4B8, #F0B0B5);">
            ✂️
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careStats.pruneCount }}</div>
            <div class="stat-label">修剪次数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: linear-gradient(135deg, #8B7355, #A89070);">
            🪴
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.careStats.repotCount }}</div>
            <div class="stat-label">换盆次数</div>
          </div>
        </div>
      </div>
    </div>

    <div class="achievements-section">
      <div class="section-header">
        <h3 class="section-title">🏅 成就徽章</h3>
        <div class="achievements-progress">
          <span class="progress-text">
            已解锁 {{ store.unlockedAchievementsCount }} / {{ store.totalAchievementsCount }}
          </span>
          <el-progress
            :percentage="Math.round(store.unlockedAchievementsCount / store.totalAchievementsCount * 100)"
            color="#6B8E5A"
            :stroke-width="6"
            style="width: 150px; margin-left: 12px;"
          />
        </div>
      </div>
    </div>

    <div class="achievements-grid">
      <div
        class="achievement-card"
        v-for="achievement in sortedAchievements"
        :key="achievement.id"
        :class="{ locked: !achievement.unlocked }"
      >
        <div class="achievement-icon" :style="{ borderColor: getRarityColor(achievement.rarity) }">
          <span class="icon">{{ achievement.icon }}</span>
          <div class="rarity-badge" :style="{ background: getRarityColor(achievement.rarity) }">
            {{ getRarityName(achievement.rarity) }}
          </div>
        </div>
        <div class="achievement-info">
          <div class="achievement-name">{{ achievement.name }}</div>
          <div class="achievement-desc">{{ achievement.description }}</div>
          <div class="achievement-progress">
            <el-progress
              :percentage="Math.round(achievement.progress / achievement.target * 100)"
              :color="achievement.unlocked ? getRarityColor(achievement.rarity) : '#95A5A6'"
              :stroke-width="6"
            />
            <span class="progress-label">
              {{ achievement.progress }} / {{ achievement.target }}
            </span>
          </div>
          <div v-if="achievement.unlocked && achievement.unlockedAt" class="unlock-time">
            🎉 于 {{ formatDate(achievement.unlockedAt, 'YYYY-MM-DD') }} 解锁
          </div>
          <div v-if="!achievement.unlocked" class="locked-hint">
            继续努力，还差 {{ achievement.target - achievement.progress }} 步即可解锁
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Trophy, Refresh } from '@element-plus/icons-vue'
import { formatDate } from '@/utils'
import { getRarityColor, getRarityName, getLevelName } from '@/utils/careAI'

const store = useAppStore()

const sortedAchievements = computed(() => {
  return [...store.achievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1
    if (!a.unlocked && b.unlocked) return 1
    const rarityOrder: Record<string, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }
    return rarityOrder[a.rarity] - rarityOrder[b.rarity]
  })
})

const refreshData = () => {
  store.analyzeSmartCare()
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

.achievements-page {
  max-width: 1000px;
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
        color: #F39C12;
        font-size: 28px;
      }
    }
  }

  .score-card {
    background: linear-gradient(135deg, $cream-light, $cream);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid $cream-dark;

    .score-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .score-info {
        .score-label {
          font-size: 14px;
          color: $brown-light;
          margin-bottom: 4px;
        }
        .score-value {
          font-size: 48px;
          font-weight: 700;
          color: $brown-dark;
          line-height: 1;
          margin-bottom: 8px;
        }
        .score-level {
          font-size: 18px;
          font-weight: 600;
        }
      }

      .score-badge {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }
    }

    .score-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;

      .score-item {
        background: $cream;
        padding: 16px;
        border-radius: 12px;

        .score-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;

          .score-item-label {
            font-size: 14px;
            color: $brown-light;
          }

          .score-item-value {
            font-weight: 600;
            color: $brown-dark;
          }
        }
      }
    }
  }

  .stats-card {
    background: $cream-light;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid $cream-dark;

    .section-title {
      font-size: 18px;
      color: $forest-green;
      margin-bottom: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: $cream;
        border-radius: 12px;

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: $brown-dark;
            line-height: 1;
            margin-bottom: 4px;
          }
          .stat-label {
            font-size: 12px;
            color: $brown-light;
          }
        }
      }
    }
  }

  .achievements-section {
    margin-bottom: 20px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .section-title {
        font-size: 18px;
        color: $forest-green;
        margin: 0;
      }

      .achievements-progress {
        display: flex;
        align-items: center;

        .progress-text {
          font-size: 14px;
          color: $brown-light;
          white-space: nowrap;
        }
      }
    }
  }

  .achievements-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .achievement-card {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: $cream-light;
      border-radius: 16px;
      border: 1px solid $cream-dark;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      &.locked {
        opacity: 0.6;

        .achievement-icon {
          filter: grayscale(0.5);
        }
      }

      .achievement-icon {
        position: relative;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 3px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: $cream;

        .icon {
          font-size: 36px;
        }

        .rarity-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          color: white;
          font-weight: 600;
        }
      }

      .achievement-info {
        flex: 1;
        min-width: 0;

        .achievement-name {
          font-size: 16px;
          font-weight: 600;
          color: $brown-dark;
          margin-bottom: 4px;
        }

        .achievement-desc {
          font-size: 13px;
          color: $brown-light;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .achievement-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .progress-label {
            font-size: 12px;
            color: $brown-light;
            white-space: nowrap;
          }
        }

        .unlock-time {
          font-size: 12px;
          color: $forest-green;
        }

        .locked-hint {
          font-size: 12px;
          color: $brown-light;
          font-style: italic;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .achievements-page {
    .score-card .score-details {
      grid-template-columns: 1fr;
    }

    .stats-card .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .achievements-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
