import { defineStore } from 'pinia'
import type { Plant, CareRecord, PhotoRecord, Reminder, KnowledgeArticle, AppSettings, CompletionFeedback, DiaryEntry, DiaryPassword, DiarySearchParams, DiaryMood } from '@/types'
import { generateId } from '@/utils'
import {
  plants as plantsRef,
  careRecords as careRecordsRef,
  photos as photosRef,
  reminders as remindersRef,
  knowledgeArticles as knowledgeRef,
  settings as settingsRef,
  diaryEntries as diaryRef,
  diaryPassword as diaryPasswordRef,
  savePlants,
  saveCareRecords,
  savePhotos,
  saveReminders,
  saveKnowledge,
  saveSettings,
  saveDiary,
  saveDiaryPassword,
  initDefaultData,
  getFromStorage
} from '@/utils/storage'

const PLANTS_KEY = 'plant_tracker_plants'
const CARE_KEY = 'plant_tracker_care_records'
const PHOTOS_KEY = 'plant_tracker_photos'
const REMINDERS_KEY = 'plant_tracker_reminders'
const KNOWLEDGE_KEY = 'plant_tracker_knowledge'
const SETTINGS_KEY = 'plant_tracker_settings'
const DIARY_KEY = 'plant_tracker_diary'
const DIARY_PASSWORD_KEY = 'plant_tracker_diary_password'

export const useAppStore = defineStore('app', {
  state: () => ({
    plants: getFromStorage<Plant[]>(PLANTS_KEY, []),
    careRecords: getFromStorage<CareRecord[]>(CARE_KEY, []),
    photos: getFromStorage<PhotoRecord[]>(PHOTOS_KEY, []),
    reminders: getFromStorage<Reminder[]>(REMINDERS_KEY, []),
    knowledgeArticles: getFromStorage<KnowledgeArticle[]>(KNOWLEDGE_KEY, []),
    settings: getFromStorage<AppSettings>(SETTINGS_KEY, {
      autoStart: false,
      reminderEnabled: true,
      theme: 'forest',
      dataDir: ''
    }),
    diaryEntries: getFromStorage<DiaryEntry[]>(DIARY_KEY, []),
    diaryPassword: getFromStorage<DiaryPassword | null>(DIARY_PASSWORD_KEY, null),
    diaryUnlocked: false,
    isReady: false
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
    }
  },

  actions: {
    initApp() {
      initDefaultData()
      const p = getFromStorage<Plant[]>(PLANTS_KEY, [])
      const c = getFromStorage<CareRecord[]>(CARE_KEY, [])
      const ph = getFromStorage<PhotoRecord[]>(PHOTOS_KEY, [])
      const r = getFromStorage<Reminder[]>(REMINDERS_KEY, [])
      const k = getFromStorage<KnowledgeArticle[]>(KNOWLEDGE_KEY, [])
      const s = getFromStorage<AppSettings>(SETTINGS_KEY, { autoStart: false, reminderEnabled: true, theme: 'forest', dataDir: '' })
      const d = getFromStorage<DiaryEntry[]>(DIARY_KEY, [])
      const dp = getFromStorage<DiaryPassword | null>(DIARY_PASSWORD_KEY, null)
      this.plants = p
      this.careRecords = c
      this.photos = ph
      this.reminders = r
      this.knowledgeArticles = k
      this.settings = s
      this.diaryEntries = d
      this.diaryPassword = dp
      this.isReady = true
    },

    addPlant(plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString()
      const newPlant: Plant = { ...plant, id: generateId(), createdAt: now, updatedAt: now }
      this.plants.push(newPlant)
      localStorage.setItem(PLANTS_KEY, JSON.stringify(this.plants))
      return newPlant
    },

    updatePlant(id: string, data: Partial<Plant>) {
      const index = this.plants.findIndex(p => p.id === id)
      if (index !== -1) {
        this.plants[index] = { ...this.plants[index], ...data, updatedAt: new Date().toISOString() }
        localStorage.setItem(PLANTS_KEY, JSON.stringify(this.plants))
      }
    },

    deletePlant(id: string) {
      this.plants = this.plants.filter(p => p.id !== id)
      this.careRecords = this.careRecords.filter(r => r.plantId !== id)
      this.photos = this.photos.filter(p => p.plantId !== id)
      this.reminders = this.reminders.filter(r => r.plantId !== id)
      localStorage.setItem(PLANTS_KEY, JSON.stringify(this.plants))
      localStorage.setItem(CARE_KEY, JSON.stringify(this.careRecords))
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(this.photos))
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.reminders))
    },

    addRecord(record: Omit<CareRecord, 'id' | 'createdAt'>) {
      const newRecord: CareRecord = { ...record, id: generateId(), createdAt: new Date().toISOString() }
      this.careRecords.push(newRecord)
      localStorage.setItem(CARE_KEY, JSON.stringify(this.careRecords))
      return newRecord
    },

    updateRecord(id: string, data: Partial<CareRecord>) {
      const index = this.careRecords.findIndex(r => r.id === id)
      if (index !== -1) {
        this.careRecords[index] = { ...this.careRecords[index], ...data }
        localStorage.setItem(CARE_KEY, JSON.stringify(this.careRecords))
      }
    },

    deleteRecord(id: string) {
      this.careRecords = this.careRecords.filter(r => r.id !== id)
      localStorage.setItem(CARE_KEY, JSON.stringify(this.careRecords))
    },

    addPhoto(photo: Omit<PhotoRecord, 'id' | 'createdAt'>) {
      const newPhoto: PhotoRecord = { ...photo, id: generateId(), createdAt: new Date().toISOString() }
      this.photos.push(newPhoto)
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(this.photos))
      return newPhoto
    },

    deletePhoto(id: string) {
      this.photos = this.photos.filter(p => p.id !== id)
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(this.photos))
    },

    addReminder(reminder: Omit<Reminder, 'id' | 'completed' | 'createdAt'>) {
      const newReminder: Reminder = { ...reminder, id: generateId(), completed: false, createdAt: new Date().toISOString() }
      this.reminders.push(newReminder)
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.reminders))
      return newReminder
    },

    updateReminder(id: string, data: Partial<Reminder>) {
      const index = this.reminders.findIndex(r => r.id === id)
      if (index !== -1) {
        this.reminders[index] = { ...this.reminders[index], ...data }
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.reminders))
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
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.reminders))
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
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.reminders))
    },

    batchCompleteReminders(ids: string[], feedback?: CompletionFeedback) {
      const idsCopy = [...ids]
      idsCopy.forEach(id => this.completeReminder(id, feedback))
    },

    batchDeleteReminders(ids: string[]) {
      this.reminders = this.reminders.filter(r => !ids.includes(r.id))
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.reminders))
    },

    batchPostponeReminders(ids: string[], hours?: number, days?: number) {
      const idsCopy = [...ids]
      idsCopy.forEach(id => this.postponeReminder(id, hours, days))
    },

    deleteReminder(id: string) {
      this.reminders = this.reminders.filter(r => r.id !== id)
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.reminders))
    },

    addKnowledge(article: Omit<KnowledgeArticle, 'id' | 'createdAt'>) {
      const newArticle: KnowledgeArticle = { ...article, id: generateId(), createdAt: new Date().toISOString() }
      this.knowledgeArticles.push(newArticle)
      localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(this.knowledgeArticles))
      return newArticle
    },

    deleteKnowledge(id: string) {
      this.knowledgeArticles = this.knowledgeArticles.filter(a => a.id !== id)
      localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(this.knowledgeArticles))
    },

    updateSettings(newSettings: Partial<AppSettings>) {
      this.settings = { ...this.settings, ...newSettings }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
    },

    addDiaryEntry(entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString()
      const newEntry: DiaryEntry = { ...entry, id: generateId(), createdAt: now, updatedAt: now }
      this.diaryEntries.push(newEntry)
      localStorage.setItem(DIARY_KEY, JSON.stringify(this.diaryEntries))
      return newEntry
    },

    updateDiaryEntry(id: string, data: Partial<DiaryEntry>) {
      const index = this.diaryEntries.findIndex(d => d.id === id)
      if (index !== -1) {
        this.diaryEntries[index] = { ...this.diaryEntries[index], ...data, updatedAt: new Date().toISOString() }
        localStorage.setItem(DIARY_KEY, JSON.stringify(this.diaryEntries))
      }
    },

    deleteDiaryEntry(id: string) {
      this.diaryEntries = this.diaryEntries.filter(d => d.id !== id)
      localStorage.setItem(DIARY_KEY, JSON.stringify(this.diaryEntries))
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
      const passwordHash = this.hashPassword(password)
      const passwordData: DiaryPassword = {
        passwordHash,
        passwordHint: hint,
        createdAt: new Date().toISOString()
      }
      this.diaryPassword = passwordData
      this.diaryUnlocked = true
      localStorage.setItem(DIARY_PASSWORD_KEY, JSON.stringify(passwordData))
    },

    verifyDiaryPassword(password: string): boolean {
      if (!this.diaryPassword) return true
      const hash = this.hashPassword(password)
      const valid = hash === this.diaryPassword.passwordHash
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

    hashPassword(password: string): string {
      let hash = 0
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return hash.toString(36)
    }
  }
})
