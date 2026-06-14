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
    other: '#A89070'
  }
  return map[type] || '#8B7355'
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
