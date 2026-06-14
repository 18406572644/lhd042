import type {
  Plant,
  CareRecord,
  Reminder,
  PhotoRecord,
  DiaryEntry,
  Achievement,
  AchievementType,
  CareSuggestion,
  WarningAlert,
  CareScore,
  WateringAnalysis,
  CareStats,
  StatusChangeRecord,
  StatusChangeReason,
  PlantHealthScore,
  UpcomingCareItem
} from '@/types'
import { generateId, daysBetween, daysAgo } from '@/utils'

const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, Omit<Achievement, 'id' | 'unlocked' | 'unlockedAt' | 'progress'>> = {
  first_plant: {
    type: 'first_plant',
    name: '初识绿意',
    description: '添加第一棵植物，开启你的植物养护之旅',
    icon: '🌱',
    target: 1,
    rarity: 'common'
  },
  week_streak: {
    type: 'week_streak',
    name: '一周达人',
    description: '连续7天都有养护记录',
    icon: '🔥',
    target: 7,
    rarity: 'rare'
  },
  hundred_days: {
    type: 'hundred_days',
    name: '百日守护',
    description: '养护任意一棵植物满100天',
    icon: '💯',
    target: 100,
    rarity: 'epic'
  },
  plant_collector: {
    type: 'plant_collector',
    name: '植物大户',
    description: '同时养护超过10棵植物',
    icon: '🏡',
    target: 10,
    rarity: 'epic'
  },
  care_master: {
    type: 'care_master',
    name: '养护大师',
    description: '累计完成100次养护记录',
    icon: '👨‍🌾',
    target: 100,
    rarity: 'epic'
  },
  photo_enthusiast: {
    type: 'photo_enthusiast',
    name: '摄影爱好者',
    description: '累计上传50张植物照片',
    icon: '📷',
    target: 50,
    rarity: 'rare'
  },
  diary_writer: {
    type: 'diary_writer',
    name: '日记达人',
    description: '累计撰写30篇生长日记',
    icon: '📖',
    target: 30,
    rarity: 'rare'
  },
  reminder_master: {
    type: 'reminder_master',
    name: '准时达人',
    description: '连续完成50个提醒任务且不延迟',
    icon: '⏰',
    target: 50,
    rarity: 'legendary'
  }
}

export const initAchievements = (): Achievement[] => {
  return (Object.keys(ACHIEVEMENT_DEFINITIONS) as AchievementType[]).map((type) => ({
    id: generateId(),
    ...ACHIEVEMENT_DEFINITIONS[type],
    unlocked: false,
    progress: 0
  }))
}

export const getCurrentSeason = (): 'spring' | 'summer' | 'autumn' | 'winter' => {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export const getSeasonName = (season: string): string => {
  const map: Record<string, string> = {
    spring: '春季',
    summer: '夏季',
    autumn: '秋季',
    winter: '冬季'
  }
  return map[season] || season
}

export const analyzeWateringPattern = (
  plant: Plant,
  careRecords: CareRecord[],
  reminders: Reminder[]
): WateringAnalysis => {
  const waterRecords = careRecords
    .filter(r => r.plantId === plant.id && r.type === 'water')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const intervals: number[] = []
  for (let i = 1; i < waterRecords.length; i++) {
    const diff = daysBetween(waterRecords[i - 1].date, waterRecords[i].date)
    intervals.push(diff)
  }

  const averageInterval = intervals.length > 0
    ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
    : plant.wateringInterval

  const variance = intervals.length > 1
    ? Math.sqrt(intervals.reduce((a, b) => a + Math.pow(b - averageInterval, 2), 0) / intervals.length)
    : 0
  const consistency = intervals.length > 1
    ? Math.max(0, Math.min(100, 100 - variance * 10))
    : 50

  const lastWatered = waterRecords.length > 0
    ? waterRecords[waterRecords.length - 1].date
    : plant.acquiredDate

  const missedReminders = reminders.filter(r =>
    r.plantId === plant.id &&
    r.type === 'water' &&
    r.completed === false &&
    new Date(r.scheduledDate) < new Date()
  ).length

  const daysSinceLastWater = daysAgo(lastWatered)
  let pattern: WateringAnalysis['pattern'] = 'regular'
  if (averageInterval < plant.wateringInterval * 0.6 && intervals.length >= 3) {
    pattern = 'overwatering'
  } else if (daysSinceLastWater > plant.wateringInterval * 1.5 && waterRecords.length > 0) {
    pattern = 'underwatering'
  } else if (consistency < 50 && intervals.length >= 3) {
    pattern = 'irregular'
  }

  const nextDate = new Date(lastWatered)
  nextDate.setDate(nextDate.getDate() + plant.wateringInterval)

  return {
    plantId: plant.id,
    plantName: plant.name,
    averageInterval,
    recommendedInterval: plant.wateringInterval,
    consistency,
    missedCount: missedReminders,
    lastWatered,
    nextScheduled: nextDate.toISOString().split('T')[0],
    pattern
  }
}

export const calculateCareStats = (
  plants: Plant[],
  careRecords: CareRecord[],
  reminders: Reminder[],
  photos: PhotoRecord[],
  diaryEntries: DiaryEntry[]
): CareStats => {
  const careDates = new Set(careRecords.map(r => new Date(r.date).toDateString()))
  const sortedDates = Array.from(careDates).sort()

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  if (sortedDates.length > 0) {
    const today = new Date().toDateString()
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const diff = daysBetween(sortedDates[i], i === sortedDates.length - 1 ? today : sortedDates[i + 1])
      if (diff <= 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        if (i === sortedDates.length - 1) {
          currentStreak = 0
        }
        tempStreak = 1
      }
    }
    currentStreak = tempStreak

    const lastCareDate = sortedDates[sortedDates.length - 1]
    if (daysBetween(lastCareDate, today) > 1) {
      currentStreak = 0
    }
  }

  const completedReminders = reminders.filter(r => r.completed)
  const missedReminders = reminders.filter(r =>
    !r.completed && new Date(r.scheduledDate) < new Date()
  )

  const responseTimes = completedReminders
    .filter(r => r.completedAt)
    .map(r => {
      const scheduled = new Date(r.scheduledDate + (r.scheduledTime ? 'T' + r.scheduledTime : ''))
      const completed = new Date(r.completedAt!)
      return (completed.getTime() - scheduled.getTime()) / (1000 * 60 * 60)
    })

  const totalCareDays = plants.length > 0
    ? Math.max(...plants.map(p => daysAgo(p.acquiredDate)))
    : 0

  return {
    totalCareDays,
    currentStreak,
    longestStreak,
    totalRecords: careRecords.length,
    waterCount: careRecords.filter(r => r.type === 'water').length,
    fertilizeCount: careRecords.filter(r => r.type === 'fertilize').length,
    pruneCount: careRecords.filter(r => r.type === 'prune').length,
    repotCount: careRecords.filter(r => r.type === 'repot').length,
    completedReminders: completedReminders.length,
    missedReminders: missedReminders.length,
    averageResponseTime: responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length * 10) / 10
      : 0
  }
}

export const calculateCareScore = (
  stats: CareStats,
  plants: Plant[],
  careRecords: CareRecord[]
): CareScore => {
  const healthyRatio = plants.length > 0
    ? plants.filter(p => p.status === 'healthy').length / plants.length
    : 0

  const consistencyScore = stats.totalRecords > 10
    ? Math.min(100, stats.longestStreak * 10 + stats.currentStreak * 5)
    : stats.totalRecords * 10

  const timelinessScore = stats.completedReminders + stats.missedReminders > 0
    ? Math.round((stats.completedReminders / (stats.completedReminders + stats.missedReminders)) * 100)
    : 70

  const plantHealthScore = Math.round(healthyRatio * 100)

  const knowledgeScore = careRecords.length > 0
    ? Math.min(100, careRecords.filter(r => r.note).length * 5)
    : 0

  const totalScore = Math.round(
    consistencyScore * 0.3 +
    timelinessScore * 0.25 +
    plantHealthScore * 0.3 +
    knowledgeScore * 0.15
  )

  let level: CareScore['level'] = 'beginner'
  if (totalScore >= 90) level = 'master'
  else if (totalScore >= 75) level = 'expert'
  else if (totalScore >= 55) level = 'gardener'
  else if (totalScore >= 30) level = 'apprentice'

  return {
    totalScore,
    level,
    consistencyScore,
    timelinessScore,
    plantHealthScore,
    knowledgeScore,
    lastCalculated: new Date().toISOString()
  }
}

export const updateAchievements = (
  achievements: Achievement[],
  plants: Plant[],
  careRecords: CareRecord[],
  photos: PhotoRecord[],
  diaryEntries: DiaryEntry[],
  reminders: Reminder[],
  stats: CareStats
): Achievement[] => {
  const now = new Date().toISOString()
  return achievements.map(ach => {
    let progress = 0
    switch (ach.type) {
      case 'first_plant':
        progress = plants.length >= 1 ? 1 : 0
        break
      case 'week_streak':
        progress = Math.min(ach.target, stats.currentStreak)
        break
      case 'hundred_days':
        const maxDays = plants.length > 0 ? Math.max(...plants.map(p => daysAgo(p.acquiredDate))) : 0
        progress = Math.min(ach.target, maxDays)
        break
      case 'plant_collector':
        progress = Math.min(ach.target, plants.length)
        break
      case 'care_master':
        progress = Math.min(ach.target, careRecords.length)
        break
      case 'photo_enthusiast':
        progress = Math.min(ach.target, photos.length)
        break
      case 'diary_writer':
        progress = Math.min(ach.target, diaryEntries.length)
        break
      case 'reminder_master':
        const completedOnTime = reminders.filter(r =>
          r.completed && r.completedAt &&
          new Date(r.completedAt) <= new Date(r.scheduledDate)
        ).length
        progress = Math.min(ach.target, completedOnTime)
        break
    }

    const shouldUnlock = progress >= ach.target && !ach.unlocked
    return {
      ...ach,
      progress,
      unlocked: shouldUnlock ? true : ach.unlocked,
      unlockedAt: shouldUnlock ? now : ach.unlockedAt
    }
  })
}

export const generateSuggestions = (
  plants: Plant[],
  careRecords: CareRecord[],
  reminders: Reminder[],
  wateringAnalyses: WateringAnalysis[],
  stats: CareStats
): CareSuggestion[] => {
  const suggestions: CareSuggestion[] = []
  const now = new Date()
  const season = getCurrentSeason()

  wateringAnalyses.forEach(analysis => {
    if (analysis.pattern === 'irregular' && analysis.missedCount >= 2) {
      suggestions.push({
        id: generateId(),
        type: 'watering',
        priority: 'high',
        title: '浇水习惯有待改进',
        content: `过去30天你有 ${analysis.missedCount} 次忘记给 ${analysis.plantName} 浇水，需要设置更频繁的提醒吗？`,
        plantId: analysis.plantId,
        plantName: analysis.plantName,
        actionable: true,
        actionLabel: '设置提醒',
        actionType: 'add_reminder',
        dismissed: false,
        createdAt: now.toISOString()
      })
    }

    if (analysis.averageInterval !== analysis.recommendedInterval && analysis.consistency >= 60) {
      suggestions.push({
        id: generateId(),
        type: 'watering',
        priority: 'medium',
        title: '个性化浇水建议',
        content: `根据你的浇水习惯，建议将 ${analysis.plantName} 的浇水间隔调整为 ${analysis.averageInterval} 天，更符合你的养护节奏。`,
        plantId: analysis.plantId,
        plantName: analysis.plantName,
        actionable: true,
        actionLabel: '调整间隔',
        actionType: 'adjust_watering',
        dismissed: false,
        createdAt: now.toISOString()
      })
    }

    if (analysis.pattern === 'overwatering') {
      suggestions.push({
        id: generateId(),
        type: 'watering',
        priority: 'high',
        title: '⚠️ 可能浇水过多',
        content: `${analysis.plantName} 的浇水频率（约${analysis.averageInterval}天一次）高于推荐值（${analysis.recommendedInterval}天），请注意观察是否有烂根风险。`,
        plantId: analysis.plantId,
        plantName: analysis.plantName,
        actionable: true,
        actionLabel: '查看详情',
        actionType: 'check_plant',
        dismissed: false,
        createdAt: now.toISOString()
      })
    }

    if (analysis.pattern === 'underwatering') {
      suggestions.push({
        id: generateId(),
        type: 'watering',
        priority: 'high',
        title: '⚠️ 可能浇水不足',
        content: `${analysis.plantName} 已经超过推荐浇水间隔时间了，请及时检查土壤湿度并补充水分。`,
        plantId: analysis.plantId,
        plantName: analysis.plantName,
        actionable: true,
        actionLabel: '立即浇水',
        actionType: 'check_plant',
        dismissed: false,
        createdAt: now.toISOString()
      })
    }
  })

  if (season === 'summer') {
    const balconyPlants = plants.filter(p =>
      p.location.includes('阳台') &&
      (p.species.includes('多肉') || p.sunlightNeed === 'high')
    )
    balconyPlants.forEach(plant => {
      suggestions.push({
        id: generateId(),
        type: 'seasonal',
        priority: 'medium',
        title: '夏季养护提醒',
        content: `现在是夏季，你阳台上的${plant.name}建议增加遮阴措施，避免正午强光直射。`,
        plantId: plant.id,
        plantName: plant.name,
        actionable: true,
        actionLabel: '了解更多',
        actionType: 'learn_more',
        dismissed: false,
        createdAt: now.toISOString()
      })
    })
  }

  if (season === 'winter') {
    const tropicalPlants = plants.filter(p =>
      p.difficulty === 'hard' || p.sunlightNeed === 'high'
    )
    tropicalPlants.forEach(plant => {
      suggestions.push({
        id: generateId(),
        type: 'seasonal',
        priority: 'medium',
        title: '冬季养护提醒',
        content: `现在是冬季，${plant.name}可能对低温敏感，建议移至温暖处并减少浇水。`,
        plantId: plant.id,
        plantName: plant.name,
        actionable: true,
        actionLabel: '了解更多',
        actionType: 'learn_more',
        dismissed: false,
        createdAt: now.toISOString()
      })
    })
  }

  if (stats.missedReminders >= 3) {
    suggestions.push({
      id: generateId(),
      type: 'reminder',
      priority: 'medium',
      title: '优化提醒设置',
      content: `你有 ${stats.missedReminders} 个待办提醒已逾期，建议开启桌面通知或调整提醒时间。`,
      actionable: true,
      actionLabel: '查看提醒',
      actionType: 'add_reminder',
      dismissed: false,
      createdAt: now.toISOString()
    })
  }

  return suggestions
}

export const generateWarnings = (
  plants: Plant[],
  careRecords: CareRecord[],
  wateringAnalyses: WateringAnalysis[],
  reminders: Reminder[]
): WarningAlert[] => {
  const warnings: WarningAlert[] = []
  const now = new Date()

  plants.forEach(plant => {
    const analysis = wateringAnalyses.find(a => a.plantId === plant.id)
    const plantRecords = careRecords.filter(r => r.plantId === plant.id)
    const recentRecords = plantRecords.filter(r => daysAgo(r.date) <= 30)

    if (analysis && analysis.pattern === 'overwatering' && recentRecords.filter(r => r.type === 'water').length >= 4) {
      warnings.push({
        id: generateId(),
        type: 'overwatering',
        plantId: plant.id,
        plantName: plant.name,
        title: '⚠️ 烂根风险预警',
        description: `${plant.name} 最近浇水过于频繁，土壤可能长期处于潮湿状态。`,
        riskLevel: 'high',
        evidence: [
          `近30天浇水 ${recentRecords.filter(r => r.type === 'water').length} 次`,
          `平均浇水间隔 ${analysis.averageInterval} 天，推荐间隔 ${analysis.recommendedInterval} 天`,
          '土壤透气性差可能导致根部缺氧'
        ],
        suggestions: [
          '立即停止浇水，让土壤完全干透',
          '检查盆底排水孔是否通畅',
          '观察叶片是否有发黄、萎蔫现象',
          '必要时更换疏松透气的土壤'
        ],
        dismissed: false,
        createdAt: now.toISOString()
      })
    }

    if (analysis && analysis.pattern === 'underwatering' && plant.status !== 'dormant') {
      const daysSinceWater = daysAgo(analysis.lastWatered)
      warnings.push({
        id: generateId(),
        type: 'underwatering',
        plantId: plant.id,
        plantName: plant.name,
        title: '⚠️ 脱水风险预警',
        description: `${plant.name} 已 ${daysSinceWater} 天未浇水，超出推荐间隔 ${analysis.recommendedInterval} 天。`,
        riskLevel: 'high',
        evidence: [
          `上次浇水：${analysis.lastWatered.split('T')[0]}`,
          `已 ${daysSinceWater} 天未浇水`,
          `推荐浇水间隔：${analysis.recommendedInterval} 天`
        ],
        suggestions: [
          '立即检查土壤湿度',
          '若土壤干燥请及时浇透水',
          '观察叶片状态，如有萎蔫可适当喷水',
          '考虑设置更频繁的浇水提醒'
        ],
        dismissed: false,
        createdAt: now.toISOString()
      })
    }

    if (plant.status === 'sick' || plant.status === 'needsCare') {
      const pestReports = recentRecords.filter(r => r.note?.includes('虫') || r.note?.includes('病'))
      warnings.push({
        id: generateId(),
        type: 'pest_risk',
        plantId: plant.id,
        plantName: plant.name,
        title: '⚠️ 病虫害风险预警',
        description: `${plant.name} 目前状态${plant.status === 'sick' ? '不佳' : '需要照料'}，请仔细检查是否有病虫害迹象。`,
        riskLevel: 'medium',
        evidence: [
          `当前状态：${plant.status === 'sick' ? '状态不佳' : '需要照料'}`,
          pestReports.length > 0 ? `已记录 ${pestReports.length} 次异常情况` : '暂无相关记录，建议仔细检查'
        ],
        suggestions: [
          '检查叶片背面是否有蚜虫、红蜘蛛等',
          '观察是否有斑点、霉斑、黄叶等异常',
          '检查土壤中是否有虫卵或幼虫',
          '如有虫害迹象，及时隔离并喷洒驱虫剂'
        ],
        dismissed: false,
        createdAt: now.toISOString()
      })
    }

    const fertilizeRecords = recentRecords.filter(r => r.type === 'fertilize')
    if (fertilizeRecords.length === 0 && daysAgo(plant.acquiredDate) >= 60) {
      warnings.push({
        id: generateId(),
        type: 'nutrient_deficiency',
        plantId: plant.id,
        plantName: plant.name,
        title: '⚠️ 营养缺乏预警',
        description: `${plant.name} 已超过60天未施肥，可能存在营养缺乏。`,
        riskLevel: 'low',
        evidence: [
          `已养护 ${daysAgo(plant.acquiredDate)} 天`,
          `近30天无施肥记录`,
          `推荐施肥间隔：${plant.fertilizingInterval} 天`
        ],
        suggestions: [
          '观察叶片是否有发黄、变薄、生长缓慢等现象',
          '在生长季节适量施用缓释肥或液肥',
          '施肥时注意浓度，避免烧根'
        ],
        dismissed: false,
        createdAt: now.toISOString()
      })
    }

    if (getCurrentSeason() === 'summer' && plant.sunlightNeed === 'low' && plant.location.includes('阳台')) {
      warnings.push({
        id: generateId(),
        type: 'sunburn_risk',
        plantId: plant.id,
        plantName: plant.name,
        title: '⚠️ 晒伤风险预警',
        description: `${plant.name} 喜阴但放置在阳台，夏季强光可能导致叶片灼伤。`,
        riskLevel: 'medium',
        evidence: [
          `光照需求：${plant.sunlightNeed === 'low' ? '弱光' : plant.sunlightNeed === 'medium' ? '散射光' : '强光'}`,
          `放置位置：${plant.location}`,
          '当前季节：夏季，日照强烈'
        ],
        suggestions: [
          '移至散射光处或使用遮阳网',
          '避免正午12点至2点的直射阳光',
          '保持环境通风，降低温度',
          '多向周围喷雾增加空气湿度'
        ],
        dismissed: false,
        createdAt: now.toISOString()
      })
    }
  })

  const fertilizeRecords = careRecords.filter(r => r.type === 'fertilize')
  fertilizeRecords.forEach(record => {
    if (record.note?.includes('浓') || (record.amount && Number(record.amount?.replace(/[^0-9.]/g, '')) > 1000)) {
      const plant = plants.find(p => p.id === record.plantId)
      if (plant && !warnings.find(w => w.plantId === plant.id && w.type === 'care_mistake')) {
        warnings.push({
          id: generateId(),
          type: 'care_mistake',
          plantId: plant.id,
          plantName: plant.name,
          title: '💡 养护误区提醒',
          description: '检测到可能的施肥不当，肥料浓度过高容易造成烧根。',
          riskLevel: 'low',
          evidence: [
            `施肥记录：${record.date.split('T')[0]}`,
            '建议：薄肥勤施，按说明书稀释后使用'
          ],
          suggestions: [
            '施肥前仔细阅读产品说明',
            '按照推荐比例稀释，宁淡勿浓',
            '生长旺季每2-4周施肥一次',
            '休眠期停止施肥'
          ],
          dismissed: false,
          createdAt: now.toISOString()
        })
      }
    }
  })

  return warnings
}

export const getLevelName = (level: string): string => {
  const map: Record<string, string> = {
    beginner: '养护新手',
    apprentice: '入门学徒',
    gardener: '园艺师',
    expert: '资深专家',
    master: '养护大师'
  }
  return map[level] || level
}

export const getRarityColor = (rarity: string): string => {
  const map: Record<string, string> = {
    common: '#95A5A6',
    rare: '#3498DB',
    epic: '#9B59B6',
    legendary: '#F39C12'
  }
  return map[rarity] || '#95A5A6'
}

export const getRarityName = (rarity: string): string => {
  const map: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return map[rarity] || rarity
}

export const getPriorityColor = (priority: string): string => {
  const map: Record<string, string> = {
    low: '#95A5A6',
    medium: '#3498DB',
    high: '#F39C12',
    critical: '#E74C3C'
  }
  return map[priority] || '#95A5A6'
}

export const getPriorityName = (priority: string): string => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '紧急'
  }
  return map[priority] || priority
}

export const getSuggestionTypeIcon = (type: string): string => {
  const map: Record<string, string> = {
    watering: '💧',
    fertilizing: '🧪',
    sunlight: '☀️',
    seasonal: '🍃',
    pest_prevention: '🐛',
    care_habit: '📊',
    reminder: '🔔'
  }
  return map[type] || '💡'
}

export const getWarningTypeIcon = (type: string): string => {
  const map: Record<string, string> = {
    pest_risk: '🐛',
    overwatering: '💧',
    underwatering: '🏜️',
    nutrient_deficiency: '🌱',
    sunburn_risk: '☀️',
    cold_damage: '❄️',
    care_mistake: '💡'
  }
  return map[type] || '⚠️'
}

export interface StatusEvaluationResult {
  plantId: string
  plantName: string
  currentStatus: Plant['status']
  suggestedStatus: Plant['status']
  reason: StatusChangeReason
  reasonText: string
}

export const evaluatePlantStatus = (
  plant: Plant,
  careRecords: CareRecord[]
): StatusEvaluationResult | null => {
  const plantRecords = careRecords
    .filter(r => r.plantId === plant.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const waterRecords = plantRecords
    .filter(r => r.type === 'water')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (waterRecords.length > 0) {
    const lastWaterDate = new Date(waterRecords[0].date)
    const daysSinceLastWater = Math.floor((Date.now() - lastWaterDate.getTime()) / (1000 * 60 * 60 * 24))
    const overdueThreshold = plant.wateringInterval + 3

    if (daysSinceLastWater > overdueThreshold && plant.status !== 'needsCare' && plant.status !== 'sick') {
      return {
        plantId: plant.id,
        plantName: plant.name,
        currentStatus: plant.status,
        suggestedStatus: 'needsCare',
        reason: 'overdue_watering',
        reasonText: `已超过浇水间隔${plant.wateringInterval}天+3天未浇水（已${daysSinceLastWater}天），建议标记为"需要照料"`
      }
    }
  }

  const recentRecords = plantRecords.slice(0, 2)
  if (recentRecords.length >= 2) {
    const bothHealthy = recentRecords.every(
      r => r.note && r.note.includes('生长良好')
    )
    if (bothHealthy && plant.status !== 'healthy') {
      return {
        plantId: plant.id,
        plantName: plant.name,
        currentStatus: plant.status,
        suggestedStatus: 'healthy',
        reason: 'consecutive_healthy',
        reasonText: '连续两次养护记录备注"生长良好"，建议标记为"健康"'
      }
    }
  }

  const pestRecord = plantRecords.find(
    r => r.note && (r.note.includes('病虫害') || r.note.includes('虫害') || r.note.includes('病害'))
  )
  if (pestRecord && plant.status !== 'sick') {
    const daysSincePestReport = daysAgo(pestRecord.date)
    if (daysSincePestReport <= 30) {
      return {
        plantId: plant.id,
        plantName: plant.name,
        currentStatus: plant.status,
        suggestedStatus: 'sick',
        reason: 'pest_detected',
        reasonText: `养护记录中标记了"病虫害"（${pestRecord.date.split('T')[0]}），建议标记为"状态不佳"`
      }
    }
  }

  return null
}

export const evaluateAllPlantsStatus = (
  plants: Plant[],
  careRecords: CareRecord[]
): StatusEvaluationResult[] => {
  return plants
    .map(plant => evaluatePlantStatus(plant, careRecords))
    .filter((r): r is StatusEvaluationResult => r !== null)
}

export const calculatePlantHealthScore = (
  plant: Plant,
  careRecords: CareRecord[],
  statusHistory: StatusChangeRecord[],
  wateringAnalysis?: WateringAnalysis
): PlantHealthScore => {
  const plantRecords = careRecords.filter(r => r.plantId === plant.id)
  const waterRecords = plantRecords
    .filter(r => r.type === 'water')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const waterDates = waterRecords.map(r => r.date)
  const waterIntervals: number[] = []
  for (let i = 1; i < waterDates.length; i++) {
    waterIntervals.push(daysBetween(waterDates[i - 1], waterDates[i]))
  }

  const lastWaterDate = waterRecords.length > 0 ? waterRecords[waterRecords.length - 1].date : plant.acquiredDate
  const daysSinceLastWater = daysAgo(lastWaterDate)
  let careFrequencyScore = 0
  if (plant.wateringInterval > 0) {
    const expectedWaterings = Math.floor(daysAgo(plant.acquiredDate) / plant.wateringInterval)
    if (expectedWaterings > 0) {
      careFrequencyScore = Math.min(100, Math.round((waterRecords.length / expectedWaterings) * 100))
    } else {
      careFrequencyScore = 50
    }
  } else {
    careFrequencyScore = 50
  }

  const plantStatusChanges = statusHistory.filter(h => h.plantId === plant.id)
  const sickChanges = plantStatusChanges.filter(h => h.newStatus === 'sick').length
  const needsCareChanges = plantStatusChanges.filter(h => h.newStatus === 'needsCare').length
  const totalChanges = plantStatusChanges.length
  let statusStabilityScore = 100
  if (totalChanges > 0) {
    const penalty = sickChanges * 20 + needsCareChanges * 10
    statusStabilityScore = Math.max(0, 100 - penalty)
  }
  const statusScores: Record<string, number> = { healthy: 100, needsCare: 60, sick: 30, dormant: 50 }
  statusStabilityScore = Math.round((statusStabilityScore + (statusScores[plant.status] || 50)) / 2)

  let wateringConsistencyScore = 0
  if (wateringAnalysis) {
    wateringConsistencyScore = wateringAnalysis.consistency
  } else if (waterIntervals.length > 0 && plant.wateringInterval > 0) {
    const deviations = waterIntervals.map(i => Math.abs(i - plant.wateringInterval))
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length
    wateringConsistencyScore = Math.max(0, Math.min(100, Math.round(100 - (avgDeviation / (plant.wateringInterval * 0.5)) * 100)))
  } else {
    wateringConsistencyScore = daysSinceLastWater <= plant.wateringInterval ? 80 : 40
  }

  const fertilizeRecords = plantRecords
    .filter(r => r.type === 'fertilize')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const fertilizeDates = fertilizeRecords.map(r => r.date)
  const fertilizeIntervals: number[] = []
  for (let i = 1; i < fertilizeDates.length; i++) {
    fertilizeIntervals.push(daysBetween(fertilizeDates[i - 1], fertilizeDates[i]))
  }
  let fertilizingConsistencyScore = 50
  if (fertilizeIntervals.length > 0 && plant.fertilizingInterval > 0) {
    const deviations = fertilizeIntervals.map(i => Math.abs(i - plant.fertilizingInterval))
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length
    fertilizingConsistencyScore = Math.max(0, Math.min(100, Math.round(100 - (avgDeviation / (plant.fertilizingInterval * 0.5)) * 100)))
  } else if (fertilizeRecords.length > 0) {
    const lastFertilizeDate = fertilizeRecords[fertilizeRecords.length - 1].date
    const daysSinceLastFertilize = daysAgo(lastFertilizeDate)
    fertilizingConsistencyScore = daysSinceLastFertilize <= plant.fertilizingInterval ? 70 : 40
  }

  const totalDays = daysAgo(plant.acquiredDate)
  const recordDensity = totalDays > 0 ? (plantRecords.length / totalDays) * 7 : 0
  let careActivityScore = Math.min(100, Math.round(recordDensity * 20))
  if (daysSinceLastWater <= plant.wateringInterval) careActivityScore = Math.min(100, careActivityScore + 10)

  const score = Math.round(
    careFrequencyScore * 0.25 +
    statusStabilityScore * 0.25 +
    wateringConsistencyScore * 0.2 +
    fertilizingConsistencyScore * 0.1 +
    careActivityScore * 0.2
  )

  return {
    plantId: plant.id,
    plantName: plant.name,
    score: Math.max(0, Math.min(100, score)),
    careFrequencyScore,
    statusStabilityScore,
    wateringConsistencyScore,
    fertilizingConsistencyScore,
    careActivityScore,
    lastCalculated: new Date().toISOString()
  }
}

export const calculateAllHealthScores = (
  plants: Plant[],
  careRecords: CareRecord[],
  statusHistory: StatusChangeRecord[],
  wateringAnalyses: WateringAnalysis[]
): PlantHealthScore[] => {
  return plants.map(plant => {
    const analysis = wateringAnalyses.find(a => a.plantId === plant.id)
    return calculatePlantHealthScore(plant, careRecords, statusHistory, analysis)
  })
}

export const getUpcomingCareItems = (
  plants: Plant[],
  careRecords: CareRecord[]
): UpcomingCareItem[] => {
  const items: UpcomingCareItem[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  plants.forEach(plant => {
    const plantRecords = careRecords.filter(r => r.plantId === plant.id)

    const waterRecords = plantRecords
      .filter(r => r.type === 'water')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (waterRecords.length > 0 || plant.wateringInterval > 0) {
      const lastWaterDate = waterRecords.length > 0
        ? new Date(waterRecords[0].date)
        : new Date(plant.acquiredDate)
      const nextWaterDate = new Date(lastWaterDate)
      nextWaterDate.setDate(nextWaterDate.getDate() + plant.wateringInterval)

      const daysUntilDue = Math.ceil((nextWaterDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      let urgency: UpcomingCareItem['urgency'] = 'upcoming'
      if (daysUntilDue < 0) urgency = 'overdue'
      else if (daysUntilDue === 0) urgency = 'today'
      else if (daysUntilDue <= 2) urgency = 'soon'

      if (daysUntilDue <= 3) {
        items.push({
          plantId: plant.id,
          plantName: plant.name,
          plantSpecies: plant.species,
          careType: 'water',
          dueDate: nextWaterDate.toISOString().split('T')[0],
          daysUntilDue,
          urgency
        })
      }
    }

    const fertilizeRecords = plantRecords
      .filter(r => r.type === 'fertilize')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (fertilizeRecords.length > 0 || plant.fertilizingInterval > 0) {
      const lastFertilizeDate = fertilizeRecords.length > 0
        ? new Date(fertilizeRecords[0].date)
        : new Date(plant.acquiredDate)
      const nextFertilizeDate = new Date(lastFertilizeDate)
      nextFertilizeDate.setDate(nextFertilizeDate.getDate() + plant.fertilizingInterval)

      const daysUntilDue = Math.ceil((nextFertilizeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      let urgency: UpcomingCareItem['urgency'] = 'upcoming'
      if (daysUntilDue < 0) urgency = 'overdue'
      else if (daysUntilDue === 0) urgency = 'today'
      else if (daysUntilDue <= 3) urgency = 'soon'

      if (daysUntilDue <= 3) {
        items.push({
          plantId: plant.id,
          plantName: plant.name,
          plantSpecies: plant.species,
          careType: 'fertilize',
          dueDate: nextFertilizeDate.toISOString().split('T')[0],
          daysUntilDue,
          urgency
        })
      }
    }
  })

  return items.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
}

export const getStatusChangeReasonLabel = (reason: StatusChangeReason): string => {
  const map: Record<StatusChangeReason, string> = {
    overdue_watering: '超期未浇水',
    consecutive_healthy: '连续生长良好',
    pest_detected: '检测到病虫害',
    manual: '手动变更'
  }
  return map[reason] || reason
}

export const getStatusChangeReasonIcon = (reason: StatusChangeReason): string => {
  const map: Record<StatusChangeReason, string> = {
    overdue_watering: '💧',
    consecutive_healthy: '🌿',
    pest_detected: '🐛',
    manual: '✏️'
  }
  return map[reason] || '📝'
}

export const getUrgencyColor = (urgency: UpcomingCareItem['urgency']): string => {
  const map: Record<string, string> = {
    overdue: '#E74C3C',
    today: '#F39C12',
    soon: '#3498DB',
    upcoming: '#95A5A6'
  }
  return map[urgency] || '#95A5A6'
}

export const getUrgencyLabel = (urgency: UpcomingCareItem['urgency']): string => {
  const map: Record<string, string> = {
    overdue: '已逾期',
    today: '今天',
    soon: '即将到期',
    upcoming: '计划中'
  }
  return map[urgency] || urgency
}

export const getHealthScoreLevel = (score: number): { label: string; color: string; icon: string } => {
  if (score >= 90) return { label: '非常健康', color: '#27AE60', icon: '🌟' }
  if (score >= 75) return { label: '健康', color: '#6B8E5A', icon: '🌿' }
  if (score >= 60) return { label: '一般', color: '#F39C12', icon: '🌱' }
  if (score >= 40) return { label: '需要关注', color: '#E67E22', icon: '⚠️' }
  return { label: '状态不佳', color: '#E74C3C', icon: '🔴' }
}
