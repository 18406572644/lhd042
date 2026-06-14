import { defineStore } from 'pinia'
import type { Plant, CareRecord, PhotoRecord, Reminder, KnowledgeArticle, AppSettings, CompletionFeedback } from '@/types'
import { generateId, combineDateAndTime as combineDateTime } from '@/utils'
import {
  plants as plantsRef,
  careRecords as careRecordsRef,
  photos as photosRef,
  reminders as remindersRef,
  knowledgeArticles as knowledgeRef,
  settings as settingsRef,
  savePlants,
  saveCareRecords,
  savePhotos,
  saveReminders,
  saveKnowledge,
  saveSettings,
  initDefaultData,
  getFromStorage
} from '@/utils/storage'

const PLANTS_KEY = 'plant_tracker_plants'
const CARE_KEY = 'plant_tracker_care_records'
const PHOTOS_KEY = 'plant_tracker_photos'
const REMINDERS_KEY = 'plant_tracker_reminders'
const KNOWLEDGE_KEY = 'plant_tracker_knowledge'
const SETTINGS_KEY = 'plant_tracker_settings'

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
    totalPhotos: (state) => state.photos.length
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
      this.plants = p
      this.careRecords = c
      this.photos = ph
      this.reminders = r
      this.knowledgeArticles = k
      this.settings = s
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
      if (index !== -1) {
        this.reminders[index].completed = true
        this.reminders[index].completedAt = new Date().toISOString()
        if (feedback) this.reminders[index].completionFeedback = feedback
        if (note) this.reminders[index].completionNote = note
        const reminder = this.reminders[index]
        if (reminder.repeatInterval && reminder.repeatUnit) {
          const multiplier = reminder.repeatUnit === 'day' ? 1 : reminder.repeatUnit === 'week' ? 7 : 30
          const nextDate = new Date(reminder.scheduledDate)
          nextDate.setDate(nextDate.getDate() + reminder.repeatInterval * multiplier)
          this.addReminder({
            plantId: reminder.plantId,
            type: reminder.type,
            title: reminder.title,
            scheduledDate: nextDate.toISOString().split('T')[0],
            scheduledTime: reminder.scheduledTime,
            repeatInterval: reminder.repeatInterval,
            repeatUnit: reminder.repeatUnit
          })
        }
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.reminders))
      }
    },

    postponeReminder(id: string, hours?: number, days?: number, customDate?: string, customTime?: string) {
      const index = this.reminders.findIndex(r => r.id === id)
      if (index !== -1) {
        const reminder = this.reminders[index]
        let newDate = new Date(reminder.scheduledDate)
        let newTime = reminder.scheduledTime
        if (hours) {
          const combinedIso = combineDateTime(reminder.scheduledDate, reminder.scheduledTime || '00:00')
          const combinedDate = new Date(combinedIso)
          combinedDate.setHours(combinedDate.getHours() + hours)
          newDate = combinedDate
          newTime = `${String(combinedDate.getHours()).padStart(2, '0')}:${String(combinedDate.getMinutes()).padStart(2, '0')}`
        }
        if (days) {
          newDate.setDate(newDate.getDate() + days)
        }
        if (customDate) {
          newDate = new Date(customDate)
        }
        if (customTime) {
          newTime = customTime
        }
        this.reminders[index].scheduledDate = newDate.toISOString().split('T')[0]
        if (newTime) this.reminders[index].scheduledTime = newTime
        this.reminders[index].postponedCount = (this.reminders[index].postponedCount || 0) + 1
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.reminders))
      }
    },

    batchCompleteReminders(ids: string[], feedback?: CompletionFeedback) {
      ids.forEach(id => this.completeReminder(id, feedback))
    },

    batchDeleteReminders(ids: string[]) {
      this.reminders = this.reminders.filter(r => !ids.includes(r.id))
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.reminders))
    },

    batchPostponeReminders(ids: string[], hours?: number, days?: number) {
      ids.forEach(id => this.postponeReminder(id, hours, days))
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
    }
  }
})
