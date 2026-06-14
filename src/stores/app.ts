import { defineStore } from 'pinia'
import type {
  Plant,
  CareRecord,
  PhotoRecord,
  Reminder,
  KnowledgeArticle,
  AppSettings,
  CompletionFeedback,
  DiaryEntry,
  DiaryPassword,
  DiarySearchParams,
  DiaryMood,
  SecuritySettings,
  OperationLog,
  OperationType,
  DataIntegrityInfo,
  Achievement,
  CareSuggestion,
  WarningAlert,
  CareScore,
  WateringAnalysis,
  CareStats
} from '@/types'
import { generateId } from '@/utils'
import {
  getFromStorage,
  setToStorage,
  getEncryptedFromStorage,
  setEncryptedToStorage,
  getSecuritySettings,
  setSecuritySettings,
  removeSecuritySettings,
  getOperationLogs,
  addOperationLog as storageAddOperationLog,
  verifyDataChecksum,
  verifyAllDataChecksums,
  updateDataChecksum,
  encryptAllData,
  decryptAllData,
  isDataEncrypted,
  PLANTS_KEY,
  CARE_KEY,
  PHOTOS_KEY,
  REMINDERS_KEY,
  KNOWLEDGE_KEY,
  SETTINGS_KEY,
  DIARY_KEY,
  DIARY_PASSWORD_KEY,
  ACHIEVEMENTS_KEY,
  SUGGESTIONS_KEY,
  WARNINGS_KEY,
  CARE_SCORE_KEY
} from '@/utils/storage'
import {
  initAchievements,
  analyzeWateringPattern,
  calculateCareStats,
  calculateCareScore,
  updateAchievements,
  generateSuggestions,
  generateWarnings
} from '@/utils/careAI'
import { hashPassword, verifyPassword } from '@/utils/encryption'

export const useAppStore = defineStore('app', {
  state: () => ({
    plants: [] as Plant[],
    careRecords: [] as CareRecord[],
    photos: [] as PhotoRecord[],
    reminders: [] as Reminder[],
    knowledgeArticles: [] as KnowledgeArticle[],
    settings: {
      autoStart: false,
      reminderEnabled: true,
      theme: 'forest' as const,
      dataDir: '',
      smartSuggestionsEnabled: true,
      warningAlertsEnabled: true
    } as AppSettings,
    diaryEntries: [] as DiaryEntry[],
    diaryPassword: null as DiaryPassword | null,
    diaryUnlocked: false,
    isReady: false,
    securitySettings: null as SecuritySettings | null,
    operationLogs: [] as OperationLog[],
    isLocked: false,
    masterPasswordHash: '',
    masterPasswordSalt: '',
    dataIntegrityInfo: [] as DataIntegrityInfo[],
    lastActivityTime: Date.now(),
    autoLockTimer: null as number | null,
    achievements: [] as Achievement[],
    suggestions: [] as CareSuggestion[],
    warnings: [] as WarningAlert[],
    careScore: null as CareScore | null,
    careStats: null as CareStats | null,
    wateringAnalyses: [] as WateringAnalysis[]
  }),

  getters: {
    getPlantById: (state) => (id: string) => {
      return state.plants.find(p => p.id === id)
    },
    getRecordsByPlantId: (state) => (plantId: string) => {
      return state.careRecords
        .filter(r => r.plantId === plantId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    getPhotosByPlantId: (state) => (plantId: string) => {
      return state.photos
        .filter(p => p.plantId === plantId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    getRemindersByPlantId: (state) => (plantId: string) => {
      return state.reminders
        .filter(r => r.plantId === plantId)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    },
    getPendingReminders: (state) => {
      return state.reminders
        .filter(r => !r.completed)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    },
    todayRemindersCount: (state) => {
      const today = new Date().toDateString()
      return state.reminders.filter(r => {
        if (r.completed) return false
        return new Date(r.scheduledDate).toDateString() <= today
      }).length
    },
    totalPlants: (state) => state.plants.length,
    healthyPlants: (state) => state.plants.filter(p => p.status === 'healthy').length,
    needsCarePlants: (state) => state.plants.filter(p => p.status === 'needsCare').length,
    totalRecords: (state) => state.careRecords.length,
    totalPhotos: (state) => state.photos.length,

    publicDiaryEntries: (state) => {
      return state.diaryEntries.filter(d => !d.isPrivate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },

    allDiaryEntries: (state) => {
      return [...state.diaryEntries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },

    getDiaryById: (state) => (id: string) => {
      return state.diaryEntries.find(d => d.id === id)
    },

    getDiaryByDate: (state) => (date: string) => {
      return state.diaryEntries.filter(d => d.date === date)
    },

    diaryDatesWithEntries: (state) => {
      return [...new Set(state.diaryEntries.map(d => d.date))]
    },

    hasDiaryPassword: (state) => {
      return state.diaryPassword !== null
    },

    canViewPrivateDiary: (state) => {
      return !state.diaryPassword || state.diaryUnlocked
    },

    hasMasterPassword: (state) => {
      return !!state.masterPasswordHash
    },

    isEncryptionEnabled: (state) => {
      return state.securitySettings?.encryptionEnabled ?? false
    },

    isPrivacyModeEnabled: (state) => {
      return state.securitySettings?.privacyMode ?? false
    },

    isAutoLockEnabled: (state) => {
      return state.securitySettings?.autoLockEnabled ?? false
    },

    autoLockMinutes: (state) => {
      return state.securitySettings?.autoLockMinutes ?? 5
    },

    recentOperationLogs: (state) => (limit: number = 50) => {
      return state.operationLogs.slice(0, limit)
    },

    getOperationLogsByType: (state) => (type: OperationType) => {
      return state.operationLogs.filter(log => log.type === type)
    },

    getDiaryMoodStats: (state) => (month?: number, year?: number) => {
      let entries = state.diaryEntries
      if (month !== undefined && year !== undefined) {
        entries = entries.filter(d => {
          const date = new Date(d.date)
          return date.getMonth() === month && date.getFullYear() === year
        })
      }
      const stats: Record<string, number> = {}
      entries.forEach(d => {
        stats[d.mood] = (stats[d.mood] || 0) + 1
      })
      return stats
    },

    getDiaryMonthlyStats: (state) => (year: number) => {
      const months: number[] = []
      for (let i = 0; i < 12; i++) {
        const count = state.diaryEntries.filter(d => {
          const date = new Date(d.date)
          return date.getFullYear() === year && date.getMonth() === i
        }).length
        months.push(count)
      }
      return months
    },

    getDiaryStreak: (state) => {
      const dates = [...new Set(state.diaryEntries.map(d => d.date))].sort()
      if (dates.length === 0) return 0
      
      let streak = 1
      let maxStreak = 1
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1])
        const curr = new Date(dates[i])
        const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          streak++
          maxStreak = Math.max(maxStreak, streak)
        } else if (diffDays > 1) {
          streak = 1
        }
      }
      return maxStreak
    },

    unlockedAchievements: (state) => state.achievements.filter(a => a.unlocked),
    lockedAchievements: (state) => state.achievements.filter(a => !a.unlocked),
    unlockedAchievementsCount: (state) => state.achievements.filter(a => a.unlocked).length,
    totalAchievementsCount: (state) => state.achievements.length,

    activeSuggestions: (state) => {
      if (!state.settings.smartSuggestionsEnabled) return []
      return state.suggestions.filter(s => !s.dismissed)
        .sort((a, b) => {
          const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
    },
    activeSuggestionsCount: (state) => {
      if (!state.settings.smartSuggestionsEnabled) return 0
      return state.suggestions.filter(s => !s.dismissed).length
    },

    activeWarnings: (state) => {
      if (!state.settings.warningAlertsEnabled) return []
      return state.warnings.filter(w => !w.dismissed)
        .sort((a, b) => {
          const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
        })
    },
    activeWarningsCount: (state) => {
      if (!state.settings.warningAlertsEnabled) return 0
      return state.warnings.filter(w => !w.dismissed).length
    },

    getWateringAnalysisByPlantId: (state) => (plantId: string) => {
      return state.wateringAnalyses.find(w => w.plantId === plantId)
    }
  },

  actions: {
    initApp() {
      this.loadSecuritySettings()
      this.loadOperationLogs()
      this.loadAllData()
      this.isReady = true
      this.updateActivity()
      this.startAutoLockTimer()
      this.runIntegrityCheck()
      this.analyzeSmartCare()
    },

    loadAllData() {
      const password = this.masterPasswordHash ? this.getMasterPasswordForDecryption() : ''
      const loadFn = password && this.isEncryptionEnabled
        ? (key: string, defaultValue: any) => getEncryptedFromStorage(key, password, defaultValue)
        : getFromStorage

      this.plants = loadFn(PLANTS_KEY, [])
      this.careRecords = loadFn(CARE_KEY, [])
      this.photos = loadFn(PHOTOS_KEY, [])
      this.reminders = loadFn(REMINDERS_KEY, [])
      this.knowledgeArticles = loadFn(KNOWLEDGE_KEY, [])
      this.settings = loadFn(SETTINGS_KEY, { autoStart: false, reminderEnabled: true, theme: 'forest' as const, dataDir: '', smartSuggestionsEnabled: true, warningAlertsEnabled: true })
      this.diaryEntries = loadFn(DIARY_KEY, [])
      this.diaryPassword = loadFn(DIARY_PASSWORD_KEY, null)
      this.achievements = loadFn(ACHIEVEMENTS_KEY, initAchievements())
      this.suggestions = loadFn(SUGGESTIONS_KEY, [])
      this.warnings = loadFn(WARNINGS_KEY, [])
      this.careScore = loadFn(CARE_SCORE_KEY, null)
    },

    saveData(key: string, data: any) {
      if (this.isEncryptionEnabled && this.masterPasswordHash) {
        const password = this.getMasterPasswordForDecryption()
        setEncryptedToStorage(key, data, password)
      } else {
        setToStorage(key, data)
      }
      updateDataChecksum(key)
    },

    addOperationLog(type: OperationType, description: string, details?: Record<string, any>) {
      const log = { type, description, details }
      storageAddOperationLog(log)
      this.operationLogs = getOperationLogs()
    },

    loadSecuritySettings() {
      this.securitySettings = getSecuritySettings()
      if (this.securitySettings) {
        this.masterPasswordHash = this.securitySettings.passwordHash
        this.masterPasswordSalt = this.securitySettings.passwordHash.split(':')[1] || ''
      }
    },

    loadOperationLogs() {
      this.operationLogs = getOperationLogs()
    },

    setMasterPassword(password: string, hint?: string): boolean {
      const { hash, salt } = hashPassword(password)
      const combinedHash = `${hash}:${salt}`

      this.masterPasswordHash = combinedHash
      this.masterPasswordSalt = salt

      const settings: SecuritySettings = {
        encryptionEnabled: this.securitySettings?.encryptionEnabled ?? false,
        privacyMode: this.securitySettings?.privacyMode ?? false,
        autoLockEnabled: this.securitySettings?.autoLockEnabled ?? false,
        autoLockMinutes: this.securitySettings?.autoLockMinutes ?? 5,
        passwordHash: combinedHash,
        passwordHint: hint,
        createdAt: new Date().toISOString()
      }

      this.securitySettings = settings
      setSecuritySettings(settings)
      this.addOperationLog('security.password_set', '设置了主密码')
      return true
    },

    verifyMasterPassword(password: string): boolean {
      if (!this.masterPasswordHash) {
        return false
      }

      const [storedHash, storedSalt] = this.masterPasswordHash.split(':')
      if (!storedHash || !storedSalt) {
        return false
      }

      const isValid = verifyPassword(password, storedHash, storedSalt)
      if (isValid) {
        this.isLocked = false
        this.updateActivity()
      }
      return isValid
    },

    requireMasterPassword(password: string): boolean {
      if (!this.hasMasterPassword) {
        return true
      }
      return this.verifyMasterPassword(password)
    },

    changeMasterPassword(oldPassword: string, newPassword: string, hint?: string): boolean {
      if (!this.verifyMasterPassword(oldPassword)) return false

      if (this.isEncryptionEnabled) {
        const decryptSuccess = decryptAllData(oldPassword)
        if (!decryptSuccess) return false
        this.setMasterPassword(newPassword, hint)
        encryptAllData(newPassword)
      } else {
        this.setMasterPassword(newPassword, hint)
      }

      this.addOperationLog('security.password_change', '修改了主密码')
      return true
    },

    removeMasterPassword(password: string): boolean {
      if (!this.verifyMasterPassword(password)) return false

      if (this.isEncryptionEnabled) {
        const decryptSuccess = decryptAllData(password)
        if (!decryptSuccess) return false
      }

      this.masterPasswordHash = ''
      this.masterPasswordSalt = ''
      this.securitySettings = null
      removeSecuritySettings()
      this.isLocked = false
      this.stopAutoLockTimer()
      this.addOperationLog('security.password_remove', '移除了主密码')
      return true
    },

    getMasterPasswordForDecryption(): string {
      return this.masterPasswordHash.split(':')[0] || this.masterPasswordHash
    },

    enableEncryption(password: string): boolean {
      if (!this.verifyMasterPassword(password)) return false
      if (this.isEncryptionEnabled) return true

      encryptAllData(password)
      
      if (this.securitySettings) {
        this.securitySettings.encryptionEnabled = true
        setSecuritySettings(this.securitySettings)
      }

      this.loadAllData()
      this.addOperationLog('security.encryption_enable', '启用了数据加密')
      return true
    },

    disableEncryption(password: string): boolean {
      if (!this.verifyMasterPassword(password)) return false
      if (!this.isEncryptionEnabled) return true

      const success = decryptAllData(password)
      if (!success) return false

      if (this.securitySettings) {
        this.securitySettings.encryptionEnabled = false
        setSecuritySettings(this.securitySettings)
      }

      this.loadAllData()
      this.addOperationLog('security.encryption_disable', '禁用了数据加密')
      return true
    },

    setPrivacyMode(enabled: boolean) {
      if (this.securitySettings) {
        this.securitySettings.privacyMode = enabled
        setSecuritySettings(this.securitySettings)
      }
    },

    setAutoLock(enabled: boolean, minutes?: number) {
      if (this.securitySettings) {
        this.securitySettings.autoLockEnabled = enabled
        if (minutes !== undefined) {
          this.securitySettings.autoLockMinutes = minutes
        }
        setSecuritySettings(this.securitySettings)

        if (enabled) {
          this.startAutoLockTimer()
        } else {
          this.stopAutoLockTimer()
        }
      }
    },

    updateActivity() {
      this.lastActivityTime = Date.now()
    },

    startAutoLockTimer() {
      this.stopAutoLockTimer()
      if (!this.isAutoLockEnabled || !this.hasMasterPassword) return

      const checkLock = () => {
        const idleTime = (Date.now() - this.lastActivityTime) / 1000 / 60
        if (idleTime >= this.autoLockMinutes) {
          this.lockApp()
        }
      }

      this.autoLockTimer = window.setInterval(checkLock, 60000) as unknown as number
    },

    stopAutoLockTimer() {
      if (this.autoLockTimer) {
        clearInterval(this.autoLockTimer)
        this.autoLockTimer = null
      }
    },

    lockApp() {
      this.isLocked = true
      this.diaryUnlocked = false
    },

    unlockApp(password: string): boolean {
      const valid = this.verifyMasterPassword(password)
      if (valid) {
        this.isLocked = false
        this.updateActivity()
      }
      return valid
    },

    runIntegrityCheck(): DataIntegrityInfo[] {
      this.dataIntegrityInfo = verifyAllDataChecksums()
      const corruptedCount = this.dataIntegrityInfo.filter(i => i.status === 'corrupted').length
      this.addOperationLog('data.integrity_check', `执行数据完整性校验，发现 ${corruptedCount} 个损坏项`, {
        results: this.dataIntegrityInfo
      })
      return this.dataIntegrityInfo
    },

    verifyDataKeyIntegrity(key: string): DataIntegrityInfo {
      const result = verifyDataChecksum(key)
      return result
    },

    addPlant(plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString()
      const newPlant: Plant = { ...plant, id: generateId(), createdAt: now, updatedAt: now }
      this.plants.push(newPlant)
      this.saveData(PLANTS_KEY, this.plants)
      this.addOperationLog('plant.add', `添加了植物：${plant.name}`, { plantId: newPlant.id })
      this.analyzeSmartCare()
      return newPlant
    },

    updatePlant(id: string, data: Partial<Plant>) {
      const index = this.plants.findIndex(p => p.id === id)
      if (index !== -1) {
        const oldName = this.plants[index].name
        this.plants[index] = { ...this.plants[index], ...data, updatedAt: new Date().toISOString() }
        this.saveData(PLANTS_KEY, this.plants)
        this.addOperationLog('plant.update', `更新了植物信息：${oldName}`, { plantId: id, changes: data })
        this.analyzeSmartCare()
      }
    },

    deletePlant(id: string, password?: string) {
      if (this.hasMasterPassword) {
        if (!password || !this.verifyMasterPassword(password)) {
          this.addOperationLog('security.auth_failed', '删除植物时密码验证失败', { plantId: id })
          return false
        }
      }

      const plant = this.plants.find(p => p.id === id)
      const plantName = plant?.name || '未知植物'
      this.plants = this.plants.filter(p => p.id !== id)
      this.careRecords = this.careRecords.filter(r => r.plantId !== id)
      this.photos = this.photos.filter(p => p.plantId !== id)
      this.reminders = this.reminders.filter(r => r.plantId !== id)
      this.saveData(PLANTS_KEY, this.plants)
      this.saveData(CARE_KEY, this.careRecords)
      this.saveData(PHOTOS_KEY, this.photos)
      this.saveData(REMINDERS_KEY, this.reminders)
      this.addOperationLog('plant.delete', `删除了植物：${plantName}`, { plantId: id, plantName })
      this.analyzeSmartCare()
      return true
    },

    addRecord(record: Omit<CareRecord, 'id' | 'createdAt'>) {
      const newRecord: CareRecord = { ...record, id: generateId(), createdAt: new Date().toISOString() }
      this.careRecords.push(newRecord)
      this.saveData(CARE_KEY, this.careRecords)
      const plant = this.getPlantById(record.plantId)
      this.addOperationLog('record.add', `为 ${plant?.name || '植物'} 添加了养护记录`, { recordId: newRecord.id, type: record.type })
      this.analyzeSmartCare()
      return newRecord
    },

    updateRecord(id: string, data: Partial<CareRecord>) {
      const index = this.careRecords.findIndex(r => r.id === id)
      if (index !== -1) {
        this.careRecords[index] = { ...this.careRecords[index], ...data }
        this.saveData(CARE_KEY, this.careRecords)
        this.addOperationLog('record.update', `更新了养护记录`, { recordId: id, changes: data })
      }
    },

    deleteRecord(id: string, password?: string) {
      if (this.hasMasterPassword) {
        if (!password || !this.verifyMasterPassword(password)) {
          this.addOperationLog('security.auth_failed', '删除养护记录时密码验证失败', { recordId: id })
          return false
        }
      }

      this.careRecords = this.careRecords.filter(r => r.id !== id)
      this.saveData(CARE_KEY, this.careRecords)
      this.addOperationLog('record.delete', `删除了养护记录`, { recordId: id })
      return true
    },

    addPhoto(photo: Omit<PhotoRecord, 'id' | 'createdAt'>) {
      const newPhoto: PhotoRecord = { ...photo, id: generateId(), createdAt: new Date().toISOString() }
      this.photos.push(newPhoto)
      this.saveData(PHOTOS_KEY, this.photos)
      const plant = this.getPlantById(photo.plantId)
      this.addOperationLog('photo.add', `为 ${plant?.name || '植物'} 添加了照片`, { photoId: newPhoto.id })
      this.analyzeSmartCare()
      return newPhoto
    },

    deletePhoto(id: string, password?: string) {
      if (this.hasMasterPassword) {
        if (!password || !this.verifyMasterPassword(password)) {
          this.addOperationLog('security.auth_failed', '删除照片时密码验证失败', { photoId: id })
          return false
        }
      }

      this.photos = this.photos.filter(p => p.id !== id)
      this.saveData(PHOTOS_KEY, this.photos)
      this.addOperationLog('photo.delete', `删除了照片`, { photoId: id })
      return true
    },

    addReminder(reminder: Omit<Reminder, 'id' | 'completed' | 'createdAt'>) {
      const newReminder: Reminder = { ...reminder, id: generateId(), completed: false, createdAt: new Date().toISOString() }
      this.reminders.push(newReminder)
      this.saveData(REMINDERS_KEY, this.reminders)
      const plant = this.getPlantById(reminder.plantId)
      this.addOperationLog('reminder.add', `为 ${plant?.name || '植物'} 添加了提醒`, { reminderId: newReminder.id, type: reminder.type })
      return newReminder
    },

    updateReminder(id: string, data: Partial<Reminder>) {
      const index = this.reminders.findIndex(r => r.id === id)
      if (index !== -1) {
        this.reminders[index] = { ...this.reminders[index], ...data }
        this.saveData(REMINDERS_KEY, this.reminders)
        this.addOperationLog('reminder.update', `更新了提醒`, { reminderId: id, changes: data })
      }
    },

    completeReminder(id: string, feedback?: CompletionFeedback, note?: string) {
      const index = this.reminders.findIndex(r => r.id === id)
      if (index === -1) return
      const reminder = this.reminders[index]
      const updated: Reminder = {
        ...reminder,
        completed: true,
        completedAt: new Date().toISOString(),
      }
      if (feedback) updated.completionFeedback = feedback
      if (note) updated.completionNote = note
      if (reminder.repeatInterval && reminder.repeatUnit) {
        const multiplier = reminder.repeatUnit === 'day' ? 1 : reminder.repeatUnit === 'week' ? 7 : 30
        const datePart = reminder.scheduledDate.split('T')[0]
        const [year, month, day] = datePart.split('-').map(Number)
        const nextDate = new Date(year, month - 1, day)
        nextDate.setDate(nextDate.getDate() + reminder.repeatInterval * multiplier)
        const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`
        this.addReminder({
          plantId: reminder.plantId,
          type: reminder.type,
          title: reminder.title,
          scheduledDate: nextDateStr,
          scheduledTime: reminder.scheduledTime,
          repeatInterval: reminder.repeatInterval,
          repeatUnit: reminder.repeatUnit
        })
      }
      this.reminders[index] = updated
      this.saveData(REMINDERS_KEY, this.reminders)
      this.addOperationLog('reminder.complete', `完成了提醒：${reminder.title}`, { reminderId: id })
      this.analyzeSmartCare()
    },

    postponeReminder(id: string, hours?: number, days?: number, customDate?: string, customTime?: string) {
      const index = this.reminders.findIndex(r => r.id === id)
      if (index === -1) return
      const reminder = this.reminders[index]
      const datePart = reminder.scheduledDate.split('T')[0]
      const timePart = reminder.scheduledTime || '00:00'
      const [year, month, day] = datePart.split('-').map(Number)
      const [h, m] = timePart.split(':').map(Number)
      const combined = new Date(year, month - 1, day, h || 0, m || 0, 0, 0)
      if (hours && hours > 0) {
        combined.setHours(combined.getHours() + hours)
      }
      if (days && days > 0) {
        combined.setDate(combined.getDate() + days)
      }
      if (customDate) {
        const [cy, cmo, cd] = customDate.split('T')[0].split('-').map(Number)
        combined.setFullYear(cy, cmo - 1, cd)
      }
      if (customTime) {
        const [ch, cm] = customTime.split(':').map(Number)
        combined.setHours(ch || 0, cm || 0, 0, 0)
      }
      const newDateStr = `${combined.getFullYear()}-${String(combined.getMonth() + 1).padStart(2, '0')}-${String(combined.getDate()).padStart(2, '0')}`
      const newTimeStr = `${String(combined.getHours()).padStart(2, '0')}:${String(combined.getMinutes()).padStart(2, '0')}`
      this.reminders[index] = {
        ...this.reminders[index],
        scheduledDate: newDateStr,
        scheduledTime: newTimeStr,
        postponedCount: (this.reminders[index].postponedCount || 0) + 1
      }
      this.saveData(REMINDERS_KEY, this.reminders)
    },

    batchCompleteReminders(ids: string[], feedback?: CompletionFeedback) {
      const idsCopy = [...ids]
      idsCopy.forEach(id => this.completeReminder(id, feedback))
    },

    batchDeleteReminders(ids: string[], password?: string) {
      if (this.hasMasterPassword) {
        if (!password || !this.verifyMasterPassword(password)) {
          this.addOperationLog('security.auth_failed', '批量删除提醒时密码验证失败', { count: ids.length })
          return false
        }
      }

      this.reminders = this.reminders.filter(r => !ids.includes(r.id))
      this.saveData(REMINDERS_KEY, this.reminders)
      this.addOperationLog('reminder.batch_delete', `批量删除了 ${ids.length} 条提醒`, { count: ids.length })
      return true
    },

    batchPostponeReminders(ids: string[], hours?: number, days?: number) {
      const idsCopy = [...ids]
      idsCopy.forEach(id => this.postponeReminder(id, hours, days))
    },

    deleteReminder(id: string, password?: string) {
      if (this.hasMasterPassword) {
        if (!password || !this.verifyMasterPassword(password)) {
          this.addOperationLog('security.auth_failed', '删除提醒时密码验证失败', { reminderId: id })
          return false
        }
      }

      const reminder = this.reminders.find(r => r.id === id)
      this.reminders = this.reminders.filter(r => r.id !== id)
      this.saveData(REMINDERS_KEY, this.reminders)
      this.addOperationLog('reminder.delete', `删除了提醒：${reminder?.title || '未命名'}`, { reminderId: id })
      return true
    },

    addKnowledge(article: Omit<KnowledgeArticle, 'id' | 'createdAt'>) {
      const newArticle: KnowledgeArticle = { ...article, id: generateId(), createdAt: new Date().toISOString() }
      this.knowledgeArticles.push(newArticle)
      this.saveData(KNOWLEDGE_KEY, this.knowledgeArticles)
      this.addOperationLog('knowledge.add', `添加了养护知识：${article.title}`, { articleId: newArticle.id })
      return newArticle
    },

    deleteKnowledge(id: string) {
      const article = this.knowledgeArticles.find(a => a.id === id)
      this.knowledgeArticles = this.knowledgeArticles.filter(a => a.id !== id)
      this.saveData(KNOWLEDGE_KEY, this.knowledgeArticles)
      this.addOperationLog('knowledge.delete', `删除了养护知识：${article?.title || '未知'}`, { articleId: id })
    },

    updateSettings(newSettings: Partial<AppSettings>) {
      this.settings = { ...this.settings, ...newSettings }
      this.saveData(SETTINGS_KEY, this.settings)
      this.addOperationLog('settings.update', '更新了应用设置', { changes: newSettings })
    },

    addDiaryEntry(entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString()
      const newEntry: DiaryEntry = { ...entry, id: generateId(), createdAt: now, updatedAt: now }
      this.diaryEntries.push(newEntry)
      this.saveData(DIARY_KEY, this.diaryEntries)
      this.addOperationLog('diary.add', `添加了日记：${entry.date}`, { diaryId: newEntry.id })
      this.analyzeSmartCare()
      return newEntry
    },

    updateDiaryEntry(id: string, data: Partial<DiaryEntry>) {
      const index = this.diaryEntries.findIndex(d => d.id === id)
      if (index !== -1) {
        this.diaryEntries[index] = { ...this.diaryEntries[index], ...data, updatedAt: new Date().toISOString() }
        this.saveData(DIARY_KEY, this.diaryEntries)
        this.addOperationLog('diary.update', `更新了日记`, { diaryId: id, changes: data })
      }
    },

    deleteDiaryEntry(id: string) {
      this.diaryEntries = this.diaryEntries.filter(d => d.id !== id)
      this.saveData(DIARY_KEY, this.diaryEntries)
      this.addOperationLog('diary.delete', `删除了日记`, { diaryId: id })
    },

    searchDiaryEntries(params: DiarySearchParams): DiaryEntry[] {
      let list = [...this.diaryEntries]
      
      if (!params.includePrivate && !this.canViewPrivateDiary) {
        list = list.filter(d => !d.isPrivate)
      }
      
      if (params.dateFrom) {
        list = list.filter(d => d.date >= params.dateFrom!)
      }
      if (params.dateTo) {
        list = list.filter(d => d.date <= params.dateTo!)
      }
      if (params.mood) {
        list = list.filter(d => d.mood === params.mood)
      }
      if (params.plantId) {
        list = list.filter(d => d.plantIds.includes(params.plantId!))
      }
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase()
        list = list.filter(d => 
          d.content.toLowerCase().includes(keyword)
        )
      }
      
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },

    setDiaryPassword(password: string, hint?: string) {
      const { hash, salt } = hashPassword(password)
      const passwordData: DiaryPassword = {
        passwordHash: `${hash}:${salt}`,
        passwordHint: hint,
        createdAt: new Date().toISOString()
      }
      this.diaryPassword = passwordData
      this.diaryUnlocked = true
      setToStorage(DIARY_PASSWORD_KEY, passwordData)
    },

    verifyDiaryPassword(password: string): boolean {
      if (!this.diaryPassword) return true
      const [storedHash, storedSalt] = this.diaryPassword.passwordHash.split(':')
      const valid = verifyPassword(password, storedHash, storedSalt)
      if (valid) {
        this.diaryUnlocked = true
      }
      return valid
    },

    lockDiary() {
      this.diaryUnlocked = false
    },

    removeDiaryPassword() {
      this.diaryPassword = null
      this.diaryUnlocked = true
      localStorage.removeItem(DIARY_PASSWORD_KEY)
    },

    clearAllData(password?: string) {
      if (this.hasMasterPassword) {
        if (!password || !this.verifyMasterPassword(password)) {
          this.addOperationLog('security.auth_failed', '清除所有数据时密码验证失败')
          return false
        }
      }

      const keys = [PLANTS_KEY, CARE_KEY, PHOTOS_KEY, REMINDERS_KEY, KNOWLEDGE_KEY, DIARY_KEY, ACHIEVEMENTS_KEY, SUGGESTIONS_KEY, WARNINGS_KEY, CARE_SCORE_KEY]
      keys.forEach(key => localStorage.removeItem(key))
      this.plants = []
      this.careRecords = []
      this.photos = []
      this.reminders = []
      this.knowledgeArticles = []
      this.diaryEntries = []
      this.achievements = initAchievements()
      this.suggestions = []
      this.warnings = []
      this.careScore = null
      this.careStats = null
      this.wateringAnalyses = []
      this.addOperationLog('data.clear', '清除了所有数据')
      return true
    },

    exportData() {
      this.addOperationLog('data.export', '导出了所有数据')
    },

    importData() {
      this.addOperationLog('data.import', '导入了数据')
    },

    analyzeSmartCare() {
      if (this.plants.length === 0) return

      this.wateringAnalyses = this.plants.map(plant =>
        analyzeWateringPattern(plant, this.careRecords, this.reminders)
      )

      this.careStats = calculateCareStats(
        this.plants,
        this.careRecords,
        this.reminders,
        this.photos,
        this.diaryEntries
      )

      this.careScore = calculateCareScore(this.careStats, this.plants, this.careRecords)
      this.saveData(CARE_SCORE_KEY, this.careScore)

      const oldAchievements = [...this.achievements]
      this.achievements = updateAchievements(
        this.achievements,
        this.plants,
        this.careRecords,
        this.photos,
        this.diaryEntries,
        this.reminders,
        this.careStats
      )
      this.saveData(ACHIEVEMENTS_KEY, this.achievements)

      const newlyUnlocked = this.achievements.filter((a, i) =>
        a.unlocked && !oldAchievements[i]?.unlocked
      )
      newlyUnlocked.forEach(ach => {
        this.addOperationLog('achievement.unlock', `解锁成就：${ach.name}`, { achievementId: ach.id })
      })

      if (this.settings.smartSuggestionsEnabled) {
        this.suggestions = generateSuggestions(
          this.plants,
          this.careRecords,
          this.reminders,
          this.wateringAnalyses,
          this.careStats
        )
        this.saveData(SUGGESTIONS_KEY, this.suggestions)
      }

      if (this.settings.warningAlertsEnabled) {
        this.warnings = generateWarnings(
          this.plants,
          this.careRecords,
          this.wateringAnalyses,
          this.reminders
        )
        this.saveData(WARNINGS_KEY, this.warnings)
      }
    },

    dismissSuggestion(id: string) {
      const index = this.suggestions.findIndex(s => s.id === id)
      if (index !== -1) {
        this.suggestions[index].dismissed = true
        this.saveData(SUGGESTIONS_KEY, this.suggestions)
      }
    },

    dismissWarning(id: string) {
      const index = this.warnings.findIndex(w => w.id === id)
      if (index !== -1) {
        this.warnings[index].dismissed = true
        this.saveData(WARNINGS_KEY, this.warnings)
      }
    },

    dismissAllSuggestions() {
      this.suggestions.forEach(s => s.dismissed = true)
      this.saveData(SUGGESTIONS_KEY, this.suggestions)
    },

    dismissAllWarnings() {
      this.warnings.forEach(w => w.dismissed = true)
      this.saveData(WARNINGS_KEY, this.warnings)
    },

    executeSuggestionAction(id: string, actionType: string, payload?: any) {
      const suggestion = this.suggestions.find(s => s.id === id)
      if (!suggestion) return

      switch (actionType) {
        case 'adjust_watering':
          if (suggestion.plantId && payload?.interval) {
            this.updatePlant(suggestion.plantId, { wateringInterval: payload.interval })
          }
          break
      }
      this.dismissSuggestion(id)
    },

    refreshSuggestions() {
      if (!this.settings.smartSuggestionsEnabled) return

      this.suggestions = generateSuggestions(
        this.plants,
        this.careRecords,
        this.reminders,
        this.wateringAnalyses,
        this.careStats || calculateCareStats(this.plants, this.careRecords, this.reminders, this.photos, this.diaryEntries)
      )
      this.saveData(SUGGESTIONS_KEY, this.suggestions)
    },

    refreshWarnings() {
      if (!this.settings.warningAlertsEnabled) return

      this.warnings = generateWarnings(
        this.plants,
        this.careRecords,
        this.wateringAnalyses,
        this.reminders
      )
      this.saveData(WARNINGS_KEY, this.warnings)
    },

    setSmartSuggestionsEnabled(enabled: boolean) {
      this.updateSettings({ smartSuggestionsEnabled: enabled })
      if (!enabled) {
        this.suggestions = []
        localStorage.removeItem(SUGGESTIONS_KEY)
      } else {
        this.analyzeSmartCare()
      }
    },

    setWarningAlertsEnabled(enabled: boolean) {
      this.updateSettings({ warningAlertsEnabled: enabled })
      if (!enabled) {
        this.warnings = []
        localStorage.removeItem(WARNINGS_KEY)
      } else {
        this.analyzeSmartCare()
      }
    }
  }
})
