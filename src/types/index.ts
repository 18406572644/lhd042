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

export interface Reminder {
  id: string
  plantId: string
  type: 'water' | 'fertilize' | 'prune' | 'repot' | 'custom'
  title: string
  scheduledDate: string
  repeatInterval?: number
  repeatUnit?: 'day' | 'week' | 'month'
  completed: boolean
  completedAt?: string
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
