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
  smartSuggestionsEnabled: boolean
  warningAlertsEnabled: boolean
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
  | 'reminder.batch_delete'
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
  | 'security.auth_failed'
  | 'data.import'
  | 'data.export'
  | 'data.clear'
  | 'data.integrity_check'
  | 'achievement.unlock'

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

export type AchievementType = 'week_streak' | 'hundred_days' | 'plant_collector' | 'first_plant' | 'care_master' | 'photo_enthusiast' | 'diary_writer' | 'reminder_master'

export interface Achievement {
  id: string
  type: AchievementType
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress: number
  target: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export type SuggestionType = 'watering' | 'fertilizing' | 'sunlight' | 'seasonal' | 'pest_prevention' | 'care_habit' | 'reminder'

export type SuggestionPriority = 'low' | 'medium' | 'high' | 'critical'

export interface CareSuggestion {
  id: string
  type: SuggestionType
  priority: SuggestionPriority
  title: string
  content: string
  plantId?: string
  plantName?: string
  actionable: boolean
  actionLabel?: string
  actionType?: 'adjust_watering' | 'add_reminder' | 'check_plant' | 'learn_more' | 'adjust_sunlight'
  dismissed: boolean
  createdAt: string
  expiresAt?: string
}

export type WarningType = 'pest_risk' | 'overwatering' | 'underwatering' | 'nutrient_deficiency' | 'sunburn_risk' | 'cold_damage' | 'care_mistake'

export interface WarningAlert {
  id: string
  type: WarningType
  plantId: string
  plantName: string
  title: string
  description: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  evidence: string[]
  suggestions: string[]
  dismissed: boolean
  createdAt: string
}

export interface CareScore {
  totalScore: number
  level: 'beginner' | 'apprentice' | 'gardener' | 'expert' | 'master'
  consistencyScore: number
  timelinessScore: number
  plantHealthScore: number
  knowledgeScore: number
  lastCalculated: string
}

export interface WateringAnalysis {
  plantId: string
  plantName: string
  averageInterval: number
  recommendedInterval: number
  consistency: number
  missedCount: number
  lastWatered: string
  nextScheduled: string
  pattern: 'regular' | 'irregular' | 'overwatering' | 'underwatering'
}

export interface CareStats {
  totalCareDays: number
  currentStreak: number
  longestStreak: number
  totalRecords: number
  waterCount: number
  fertilizeCount: number
  pruneCount: number
  repotCount: number
  completedReminders: number
  missedReminders: number
  averageResponseTime: number
}
