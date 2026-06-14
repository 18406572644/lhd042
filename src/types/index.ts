export interface Plant {
  id: string
  name: string
  species: string
  nickname?: string
  image?: string
  acquiredDate: string
  location: string
  description?: string
  tags: string[]
  wateringInterval: number
  fertilizingInterval: number
  sunlightNeed: 'low' | 'medium' | 'high'
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'healthy' | 'needsCare' | 'sick' | 'dormant'
  createdAt: string
  updatedAt: string
}

export interface CareRecord {
  id: string
  plantId: string
  type: 'water' | 'fertilize' | 'prune' | 'repot' | 'other'
  date: string
  note?: string
  amount?: string
  createdAt: string
}

export interface PhotoRecord {
  id: string
  plantId: string
  image: string
  date: string
  note?: string
  height?: number
  leafCount?: number
  createdAt: string
}

export type CompletionFeedback = 'completed' | 'healthy' | 'pest' | 'sick' | 'other'

export interface Reminder {
  id: string
  plantId: string
  type: 'water' | 'fertilize' | 'prune' | 'repot' | 'custom'
  title: string
  scheduledDate: string
  scheduledTime?: string
  repeatInterval?: number
  repeatUnit?: 'day' | 'week' | 'month'
  completed: boolean
  completedAt?: string
  completionFeedback?: CompletionFeedback
  completionNote?: string
  postponedCount?: number
  createdAt: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  category: string
  tags: string[]
  content: string
  image?: string
  createdAt: string
}

export interface AppSettings {
  autoStart: boolean
  reminderEnabled: boolean
  theme: 'forest' | 'light'
  dataDir: string
}

export interface SecuritySettings {
  encryptionEnabled: boolean
  privacyMode: boolean
  autoLockEnabled: boolean
  autoLockMinutes: number
  passwordHash: string
  passwordHint?: string
  createdAt: string
}

export type OperationType =
  | 'plant.add'
  | 'plant.update'
  | 'plant.delete'
  | 'record.add'
  | 'record.update'
  | 'record.delete'
  | 'photo.add'
  | 'photo.delete'
  | 'reminder.add'
  | 'reminder.update'
  | 'reminder.delete'
  | 'reminder.complete'
  | 'knowledge.add'
  | 'knowledge.delete'
  | 'diary.add'
  | 'diary.update'
  | 'diary.delete'
  | 'settings.update'
  | 'security.password_set'
  | 'security.password_change'
  | 'security.password_remove'
  | 'security.encryption_enable'
  | 'security.encryption_disable'
  | 'data.import'
  | 'data.export'
  | 'data.clear'
  | 'data.integrity_check'

export interface OperationLog {
  id: string
  type: OperationType
  description: string
  details?: Record<string, any>
  timestamp: string
  ip?: string
  userAgent?: string
}

export interface DataIntegrityInfo {
  key: string
  checksum: string
  lastChecked: string
  status: 'valid' | 'corrupted' | 'unknown'
  recordCount: number
}

export interface EncryptedData {
  iv: string
  ciphertext: string
  salt: string
  version: string
  algorithm: string
}

export type DiaryMood = 'happy' | 'calm' | 'worried' | 'surprised' | 'sad' | 'excited' | 'grateful' | 'tired'

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'foggy' | 'hot' | 'cold'

export interface DiaryEntry {
  id: string
  date: string
  content: string
  mood: DiaryMood
  plantIds: string[]
  photos: string[]
  weather: WeatherCondition
  temperature?: number
  isPrivate: boolean
  createdAt: string
  updatedAt: string
}

export interface DiaryPassword {
  passwordHash: string
  passwordHint?: string
  createdAt: string
}

export interface DiarySearchParams {
  dateFrom?: string
  dateTo?: string
  mood?: DiaryMood
  plantId?: string
  keyword?: string
  includePrivate?: boolean
}
