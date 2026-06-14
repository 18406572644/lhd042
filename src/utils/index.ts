export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD HH:mm'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export const daysBetween = (date1: string | Date, date2: string | Date = new Date()): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const daysAgo = (date: string | Date): number => {
  const d = typeof date === 'string' ? new Date(date) : date
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export const addDays = (date: string | Date, days: number): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export const todayStr = (): string => {
  return new Date().toISOString().split('T')[0]
}

export const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    healthy: '茁壮成长',
    needsCare: '需要照料',
    sick: '状态不佳',
    dormant: '休眠期'
  }
  return map[status] || status
}

export const sunlightLabel = (level: string): string => {
  const map: Record<string, string> = {
    low: '弱光',
    medium: '散射光',
    high: '强光'
  }
  return map[level] || level
}

export const difficultyLabel = (level: string): string => {
  const map: Record<string, string> = {
    easy: '新手友好',
    medium: '一般难度',
    hard: '需要经验'
  }
  return map[level] || level
}

export const careTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    water: '浇水',
    fertilize: '施肥',
    prune: '修剪',
    repot: '换盆',
    other: '其他'
  }
  return map[type] || type
}

export const getCareTypeColor = (type: string): string => {
  const map: Record<string, string> = {
    water: '#5B9BD5',
    fertilize: '#8FA978',
    prune: '#E8B4B8',
    repot: '#8B7355',
    custom: '#A89070'
  }
  return map[type] || '#8B7355'
}

export const completionFeedbackLabel = (feedback: string): string => {
  const map: Record<string, string> = {
    completed: '✅ 已完成',
    healthy: '🌿 植物状态良好',
    pest: '🐛 发现病虫害',
    sick: '🥀 植物状态不佳',
    other: '📝 其他'
  }
  return map[feedback] || feedback
}

export const completionFeedbackColor = (feedback: string): string => {
  const map: Record<string, string> = {
    completed: '#6B8E5A',
    healthy: '#7CB342',
    pest: '#E74C3C',
    sick: '#F39C12',
    other: '#95A5A6'
  }
  return map[feedback] || '#95A5A6'
}

export const addHours = (date: string | Date, hours: number): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  d.setHours(d.getHours() + hours)
  return d.toISOString()
}

export const combineDateAndTime = (dateStr: string, timeStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  const d = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0)
  return d.toISOString()
}

export const getOverdueInfo = (scheduledDate: string, scheduledTime?: string) => {
  const dateStr = scheduledTime ? combineDateAndTime(scheduledDate, scheduledTime) : scheduledDate
  const scheduled = new Date(dateStr)
  const now = new Date()
  const isOverdue = scheduled < now
  let overdueDays = 0
  let overdueHours = 0
  let overdueMinutes = 0
  if (isOverdue) {
    const diffMs = now.getTime() - scheduled.getTime()
    overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    overdueHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    overdueMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  }
  return { isOverdue, overdueDays, overdueHours, overdueMinutes }
}

export const formatOverdueText = (days: number, hours: number, minutes: number): string => {
  if (days > 0) return `逾期 ${days} 天`
  if (hours > 0) return `逾期 ${hours} 小时`
  if (minutes > 0) return `逾期 ${minutes} 分钟`
  return '即将到期'
}

export const getDefaultTime = (): string => {
  return '08:00'
}

export const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

export const isTomorrow = (dateStr: string): boolean => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return dateStr === tomorrow.toISOString().split('T')[0]
}

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    healthy: '#6B8E5A',
    needsCare: '#F4D03F',
    sick: '#E74C3C',
    dormant: '#95A5A6'
  }
  return map[status] || '#8B7355'
}

export const getPlantEmoji = (species: string): string => {
  const lower = species.toLowerCase()
  if (lower.includes('多肉') || lower.includes('仙人掌') || lower.includes('succulent') || lower.includes('cactus')) return '🌵'
  if (lower.includes('花') || lower.includes('flower')) return '🌸'
  if (lower.includes('树') || lower.includes('tree')) return '🌳'
  if (lower.includes('竹') || lower.includes('bamboo')) return '🎋'
  if (lower.includes('草') || lower.includes('grass')) return '🌿'
  if (lower.includes('兰') || lower.includes('orchid')) return '🪴'
  if (lower.includes('玫瑰') || lower.includes('rose')) return '🌹'
  if (lower.includes('向日葵') || lower.includes('sunflower')) return '🌻'
  if (lower.includes('郁金香') || lower.includes('tulip')) return '🌷'
  return '🌱'
}

export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const moodEmoji = (mood: string): string => {
  const map: Record<string, string> = {
    happy: '😊',
    calm: '😌',
    worried: '😟',
    surprised: '😲',
    sad: '😢',
    excited: '🤩',
    grateful: '🙏',
    tired: '😴'
  }
  return map[mood] || '📝'
}

export const moodLabel = (mood: string): string => {
  const map: Record<string, string> = {
    happy: '开心',
    calm: '平静',
    worried: '担心',
    surprised: '惊喜',
    sad: '难过',
    excited: '兴奋',
    grateful: '感恩',
    tired: '疲惫'
  }
  return map[mood] || mood
}

export const moodColor = (mood: string): string => {
  const map: Record<string, string> = {
    happy: '#F4D03F',
    calm: '#7CB342',
    worried: '#F39C12',
    surprised: '#E74C3C',
    sad: '#5B9BD5',
    excited: '#E91E63',
    grateful: '#9C27B0',
    tired: '#95A5A6'
  }
  return map[mood] || '#8B7355'
}

export const weatherEmoji = (weather: string): string => {
  const map: Record<string, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
    windy: '💨',
    foggy: '🌫️',
    hot: '🔥',
    cold: '🥶'
  }
  return map[weather] || '🌤️'
}

export const weatherLabel = (weather: string): string => {
  const map: Record<string, string> = {
    sunny: '晴天',
    cloudy: '多云',
    rainy: '雨天',
    snowy: '雪天',
    windy: '大风',
    foggy: '雾天',
    hot: '酷热',
    cold: '寒冷'
  }
  return map[weather] || weather
}

export const getWeekDay = (dateStr: string): string => {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const d = new Date(dateStr)
  return '周' + days[d.getDay()]
}

export const getMonthDays = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate()
}

export const getFirstDayOfWeek = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay()
}

export const getSeason = (date: string | Date): 'spring' | 'summer' | 'autumn' | 'winter' => {
  const d = typeof date === 'string' ? new Date(date) : date
  const month = d.getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

export const getSeasonLabel = (season: string): string => {
  const map: Record<string, string> = {
    spring: '春季',
    summer: '夏季',
    autumn: '秋季',
    winter: '冬季'
  }
  return map[season] || season
}

export const getSeasonEmoji = (season: string): string => {
  const map: Record<string, string> = {
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️'
  }
  return map[season] || '🌱'
}

export const getSeasonColor = (season: string): string => {
  const map: Record<string, string> = {
    spring: '#F06292',
    summer: '#FF9800',
    autumn: '#8D6E63',
    winter: '#64B5F6'
  }
  return map[season] || '#6B8E5A'
}

export const calculateAverageInterval = (dates: string[]): number => {
  if (dates.length < 2) return 0
  const sorted = [...dates].sort()
  let totalDays = 0
  for (let i = 1; i < sorted.length; i++) {
    totalDays += daysBetween(sorted[i - 1], sorted[i])
  }
  return Math.round(totalDays / (sorted.length - 1))
}

export const calculateRollingInterval = (dates: string[], windowSize: number = 7): number[] => {
  const sorted = [...dates].sort()
  const intervals: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(daysBetween(sorted[i - 1], sorted[i]))
  }
  const result: number[] = []
  for (let i = 0; i < intervals.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const window = intervals.slice(start, i + 1)
    const avg = window.reduce((a, b) => a + b, 0) / window.length
    result.push(Math.round(avg * 10) / 10)
  }
  return result
}

export const calculateStandardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map(value => Math.pow(value - mean, 2))
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length
  return Math.sqrt(avgSquareDiff)
}

export const calculateConsistencyScore = (intervals: number[], targetInterval: number): number => {
  if (intervals.length === 0) return 0
  const deviations = intervals.map(i => Math.abs(i - targetInterval))
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length
  const maxDeviation = targetInterval * 0.5
  const score = Math.max(0, 100 - (avgDeviation / maxDeviation) * 100)
  return Math.round(Math.min(100, score))
}

export const exportChartAsImage = (chart: any, filename: string = 'chart', pixelRatio: number = 2): void => {
  const url = chart.getDataURL({
    type: 'png',
    pixelRatio,
    backgroundColor: '#FAF8F3'
  })
  const link = document.createElement('a')
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`
  link.href = url
  link.click()
}

export const getDefaultReportMetrics = () => [
  { key: 'totalPlants', label: '植物总数', enabled: true, description: '当前养护的植物数量' },
  { key: 'totalRecords', label: '养护记录总数', enabled: true, description: '所有养护记录的数量' },
  { key: 'waterFrequency', label: '浇水频率分析', enabled: true, description: '每棵植物的浇水频率趋势' },
  { key: 'fertilizeFrequency', label: '施肥频率分析', enabled: true, description: '每棵植物的施肥频率趋势' },
  { key: 'growthTrend', label: '生长趋势', enabled: true, description: '株高和叶片数量的生长曲线' },
  { key: 'healthScore', label: '健康度分析', enabled: true, description: '植物多维度健康度雷达图' },
  { key: 'seasonalAnalysis', label: '季节性分析', enabled: true, description: '不同季节的养护特点' },
  { key: 'careStats', label: '养护统计', enabled: true, description: '养护次数、连续打卡等统计' },
  { key: 'diaryStats', label: '日记统计', enabled: false, description: '日记数量和心情分布' }
]

export const generateSeasonalSuggestions = (season: string, stats: any): string[] => {
  const suggestions: string[] = []
  const { waterCount, fertilizeCount, plantHealthCount } = stats

  switch (season) {
    case 'spring':
      suggestions.push('春季是植物生长旺季，建议适当增加浇水和施肥频率')
      if (waterCount < 10) suggestions.push('注意保持土壤湿润，春季植物需水量增加')
      suggestions.push('可以进行换盆和繁殖，成功率较高')
      suggestions.push('注意防治蚜虫、红蜘蛛等春季常见病虫害')
      break
    case 'summer':
      suggestions.push('夏季高温时避免正午浇水，建议早晚浇水')
      suggestions.push('注意遮阴，防止叶片被强光灼伤')
      suggestions.push('增加空气湿度，可经常向叶面喷水')
      if (fertilizeCount > 5) suggestions.push('夏季部分植物进入休眠，建议减少施肥')
      suggestions.push('保持通风，防止闷热潮湿引发病害')
      break
    case 'autumn':
      suggestions.push('秋季逐渐减少浇水，让植物准备越冬')
      suggestions.push('可以施一些磷钾肥，增强植物抗寒能力')
      suggestions.push('注意秋季昼夜温差大，防止植物受冻')
      suggestions.push('秋季适合修剪整形，促进来年生长')
      break
    case 'winter':
      suggestions.push('冬季减少浇水，保持土壤偏干')
      suggestions.push('注意保暖，将怕冷的植物移到室内')
      suggestions.push('增加光照，让植物充分接受阳光')
      if (plantHealthCount?.dormant > 0) suggestions.push('部分植物进入休眠期，属正常现象')
      suggestions.push('冬季基本停止施肥，避免烧根')
      break
  }

  return suggestions
}
