<template>
  <div class="app-layout" @click="updateActivity" @mousemove="updateActivity" @keydown="updateActivity">
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <div class="logo-area" v-if="!isCollapsed">
          <svg class="logo-leaf" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4C12 10 8 20 20 36C32 20 28 10 20 4Z" fill="#6B8E5A"/>
            <path d="M20 12L20 32" stroke="#8B7355" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M14 18C16 16 18 17 20 18" stroke="#8FA978" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M26 22C24 20 22 21 20 22" stroke="#8FA978" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="app-name">绿意盎然</span>
        </div>
        <div class="logo-area collapsed-logo" v-else>
          <svg class="logo-leaf" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4C12 10 8 20 20 36C32 20 28 10 20 4Z" fill="#6B8E5A"/>
          </svg>
        </div>
      </div>
      <el-menu
        :default-active="currentRoute"
        @select="handleSelect"
        :collapse="isCollapsed"
        :collapse-transition="false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页概览</template>
        </el-menu-item>
        <el-menu-item index="/plants">
          <el-icon><Grape /></el-icon>
          <template #title>植物档案</template>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><Notebook /></el-icon>
          <template #title>养护记录</template>
        </el-menu-item>
        <el-menu-item index="/gallery">
          <el-icon><Picture /></el-icon>
          <template #title>生长相册</template>
        </el-menu-item>
        <el-menu-item index="/diary">
          <el-icon><EditPen /></el-icon>
          <template #title>生长日记</template>
        </el-menu-item>
        <el-menu-item index="/reminders">
          <el-icon><AlarmClock /></el-icon>
          <template #title>提醒事项</template>
          <el-badge v-if="pendingCount > 0" :value="pendingCount" :max="9" class="nav-badge" />
        </el-menu-item>
        <el-menu-item index="/knowledge">
          <el-icon><Reading /></el-icon>
          <template #title>养护知识</template>
        </el-menu-item>
        <el-menu-item index="/suggestions">
          <el-icon><MagicStick /></el-icon>
          <template #title>智能建议</template>
          <el-badge v-if="smartCount > 0" :value="smartCount" :max="9" class="nav-badge" />
        </el-menu-item>
        <el-menu-item index="/achievements">
          <el-icon><Trophy /></el-icon>
          <template #title>成就中心</template>
        </el-menu-item>
        <el-menu-item index="/statistics">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据统计</template>
        </el-menu-item>
        <el-menu-item index="/logs" v-if="appStore.hasMasterPassword">
          <el-icon><Document /></el-icon>
          <template #title>操作日志</template>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>设置</template>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <div class="lock-btn" v-if="appStore.hasMasterPassword && !isCollapsed" @click="appStore.lockApp()">
          <el-icon :size="16"><Lock /></el-icon>
          <span class="lock-text">锁定</span>
        </div>
        <div class="collapse-btn" @click="isCollapsed = !isCollapsed">
          <el-icon :size="18">
            <DArrowLeft v-if="!isCollapsed" />
            <DArrowRight v-else />
          </el-icon>
        </div>
      </div>
      <div class="sidebar-decoration">
        <svg viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 350 Q50 300 30 250 Q10 200 40 150 Q70 100 50 50" stroke="#8FA978" stroke-width="1.5" fill="none" opacity="0.3"/>
          <path d="M30 250 Q60 230 50 200 Q40 170 60 140" stroke="#8FA978" stroke-width="1" fill="none" opacity="0.2"/>
          <circle cx="30" cy="250" r="3" fill="#8FA978" opacity="0.3"/>
          <circle cx="50" cy="50" r="4" fill="#E8B4B8" opacity="0.3"/>
          <circle cx="40" cy="150" r="3" fill="#8FA978" opacity="0.2"/>
          <path d="M170 380 Q180 340 160 300 Q140 260 170 220 Q200 180 180 140" stroke="#8FA978" stroke-width="1.5" fill="none" opacity="0.2"/>
          <circle cx="160" cy="300" r="3" fill="#E8B4B8" opacity="0.25"/>
          <circle cx="180" cy="140" r="3" fill="#8FA978" opacity="0.2"/>
        </svg>
      </div>
    </div>
    <div class="main-area">
      <div class="top-bar">
        <div class="top-bar-left">
          <span class="page-title">{{ currentPageTitle }}</span>
          <span class="page-subtitle" v-if="currentDate">{{ currentDate }}</span>
        </div>
        <div class="top-bar-right">
          <div class="privacy-badge" v-if="appStore.isPrivacyModeEnabled" title="隐私模式已开启">
            <el-icon><Hide /></el-icon>
          </div>
          <div class="lock-indicator" v-if="appStore.hasMasterPassword" @click="appStore.lockApp()" title="点击锁定应用">
            <el-icon><Lock /></el-icon>
          </div>
          <el-badge :value="pendingCount" :max="9" :hidden="pendingCount === 0">
            <el-button circle size="small" @click="$router.push('/reminders')">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-button circle size="small" @click="handleAddPlant">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
    <LockScreen v-model="appStore.isLocked" @unlocked="onUnlocked" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { formatDate } from '@/utils'
import LockScreen from '@/components/LockScreen.vue'
import { Lock, Hide, Document, MagicStick, Trophy } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const isCollapsed = ref(false)

const currentRoute = computed(() => {
  if (route.path.startsWith('/plant/')) return '/plants'
  if (route.path.startsWith('/diary/')) return '/diary'
  if (route.path.startsWith('/logs')) return '/logs'
  return route.path
})

const currentPageTitle = computed(() => {
  return (route.meta?.title as string) || '绿意盎然'
})

const currentDate = computed(() => {
  return formatDate(new Date(), 'YYYY年MM月DD日')
})

const pendingCount = computed(() => appStore.todayRemindersCount)

const smartCount = computed(() => {
  return (appStore.activeSuggestionsCount || 0) + (appStore.activeWarningsCount || 0)
})

const handleSelect = (index: string) => {
  router.push(index)
}

const handleAddPlant = () => {
  router.push({ path: '/plants', query: { action: 'add' } })
}

const updateActivity = () => {
  appStore.updateActivity()
}

const onUnlocked = () => {
  appStore.updateActivity()
  appStore.startAutoLockTimer()
}

onMounted(() => {
  appStore.initApp()
})

onUnmounted(() => {
  appStore.stopAutoLockTimer()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: $cream;
}

.sidebar {
  width: 220px;
  height: 100vh;
  background: linear-gradient(180deg, #4A6B3D 0%, #3D5C32 40%, #2E4A24 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: width 0.3s ease;
  flex-shrink: 0;
  z-index: 10;

  &.collapsed {
    width: 64px;
  }

  .sidebar-header {
    padding: 20px 16px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo-area {
      display: flex;
      align-items: center;
      gap: 10px;

      .logo-leaf {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
      }

      .app-name {
        font-size: 18px;
        font-weight: 700;
        color: #F5F0E6;
        letter-spacing: 2px;
        white-space: nowrap;
      }
    }
  }

  :deep(.el-menu) {
    background: transparent !important;
    border: none;
    padding: 8px 0;
    flex: 1;
    overflow-y: auto;

    .el-menu-item {
      color: rgba(245, 240, 230, 0.75) !important;
      margin: 2px 8px !important;
      border-radius: 8px !important;
      height: 44px;
      line-height: 44px;
      width: calc(100% - 16px) !important;
      position: relative;

      .el-icon {
        color: rgba(245, 240, 230, 0.6);
        font-size: 18px;
      }

      &:hover {
        background-color: rgba(245, 240, 230, 0.1) !important;
        color: #F5F0E6 !important;

        .el-icon {
          color: rgba(245, 240, 230, 0.9);
        }
      }

      &.is-active {
        background: rgba(245, 240, 230, 0.18) !important;
        color: #F5F0E6 !important;
        font-weight: 600;

        .el-icon {
          color: #F5F0E6;
        }

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: #8FA978;
          border-radius: 0 3px 3px 0;
        }
      }
    }

    .nav-badge {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);

      :deep(.el-badge__content) {
        background-color: #E8B4B8;
        border: none;
      }
    }
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 8px;
    align-items: center;

    .lock-btn {
      flex: 1;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border-radius: 8px;
      cursor: pointer;
      color: rgba(245, 240, 230, 0.6);
      transition: all 0.2s;
      background: rgba(245, 240, 230, 0.05);

      .lock-text {
        font-size: 13px;
      }

      &:hover {
        background: rgba(245, 240, 230, 0.15);
        color: #F5F0E6;
      }
    }

    .collapse-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      cursor: pointer;
      color: rgba(245, 240, 230, 0.6);
      transition: all 0.2s;
      flex-shrink: 0;

      &:hover {
        background: rgba(245, 240, 230, 0.1);
        color: #F5F0E6;
      }
    }
  }

  .sidebar-decoration {
    position: absolute;
    bottom: 60px;
    right: 0;
    width: 100%;
    height: 300px;
    pointer-events: none;
    opacity: 0.4;
  }
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.top-bar {
  height: 56px;
  background: $cream-light;
  border-bottom: 1px solid $cream-dark;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;

  .top-bar-left {
    display: flex;
    align-items: baseline;
    gap: 12px;

    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: $brown-dark;
    }

    .page-subtitle {
      font-size: 13px;
      color: $brown-light;
    }
  }

  .top-bar-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .privacy-badge {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(107, 142, 90, 0.15);
      color: $forest-green;
      cursor: default;
      font-size: 16px;
    }

    .lock-indicator {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(139, 115, 85, 0.1);
      color: $brown;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 16px;

      &:hover {
        background: rgba(139, 115, 85, 0.2);
        color: $brown-dark;
      }
    }

    .el-button {
      background: $cream;
      border-color: $cream-dark;
      color: $brown;

      &:hover {
        background: $forest-green;
        border-color: $forest-green;
        color: #fff;
      }
    }
  }
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: $cream;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
