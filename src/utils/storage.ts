import { ref } from 'vue'
import type { Plant, CareRecord, PhotoRecord, Reminder, KnowledgeArticle, AppSettings, DiaryEntry, DiaryPassword } from '@/types'
import { generateId } from '@/utils'

const PLANTS_KEY = 'plant_tracker_plants'
const CARE_KEY = 'plant_tracker_care_records'
const PHOTOS_KEY = 'plant_tracker_photos'
const REMINDERS_KEY = 'plant_tracker_reminders'
const KNOWLEDGE_KEY = 'plant_tracker_knowledge'
const SETTINGS_KEY = 'plant_tracker_settings'
const DIARY_KEY = 'plant_tracker_diary'
const DIARY_PASSWORD_KEY = 'plant_tracker_diary_password'

export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

export const setToStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const plants = ref<Plant[]>(getFromStorage<Plant[]>(PLANTS_KEY, []))
export const careRecords = ref<CareRecord[]>(getFromStorage<CareRecord[]>(CARE_KEY, []))
export const photos = ref<PhotoRecord[]>(getFromStorage<PhotoRecord[]>(PHOTOS_KEY, []))
export const reminders = ref<Reminder[]>(getFromStorage<Reminder[]>(REMINDERS_KEY, []))
export const knowledgeArticles = ref<KnowledgeArticle[]>(getFromStorage<KnowledgeArticle[]>(KNOWLEDGE_KEY, []))
export const settings = ref<AppSettings>(getFromStorage<AppSettings>(SETTINGS_KEY, {
  autoStart: false,
  reminderEnabled: true,
  theme: 'forest',
  dataDir: ''
}))
export const diaryEntries = ref<DiaryEntry[]>(getFromStorage<DiaryEntry[]>(DIARY_KEY, []))
export const diaryPassword = ref<DiaryPassword | null>(getFromStorage<DiaryPassword | null>(DIARY_PASSWORD_KEY, null))

export const savePlants = () => setToStorage(PLANTS_KEY, plants.value)
export const saveCareRecords = () => setToStorage(CARE_KEY, careRecords.value)
export const savePhotos = () => setToStorage(PHOTOS_KEY, photos.value)
export const saveReminders = () => setToStorage(REMINDERS_KEY, reminders.value)
export const saveKnowledge = () => setToStorage(KNOWLEDGE_KEY, knowledgeArticles.value)
export const saveSettings = () => setToStorage(SETTINGS_KEY, settings.value)
export const saveDiary = () => setToStorage(DIARY_KEY, diaryEntries.value)
export const saveDiaryPassword = () => setToStorage(DIARY_PASSWORD_KEY, diaryPassword.value)

export const initDefaultData = () => {
  if (plants.value.length === 0) {
    const now = new Date()
    const p1: Plant = {
      id: generateId(),
      name: '小绿',
      species: '绿萝',
      nickname: '客厅守护者',
      acquiredDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      location: '客厅窗边',
      description: '生命力顽强的绿萝，已经陪伴我两个多月了，叶子越来越茂盛。',
      tags: ['室内', '净化空气', '新手友好'],
      wateringInterval: 5,
      fertilizingInterval: 30,
      sunlightNeed: 'low',
      difficulty: 'easy',
      status: 'healthy',
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
    const p2: Plant = {
      id: generateId(),
      name: '圆圆',
      species: '多肉·桃蛋',
      nickname: '粉嘟嘟',
      acquiredDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      location: '阳台',
      description: '肉肉的桃蛋，出状态时粉嫩粉嫩的，超可爱！',
      tags: ['多肉', '阳台', '耐旱'],
      wateringInterval: 10,
      fertilizingInterval: 60,
      sunlightNeed: 'high',
      difficulty: 'medium',
      status: 'healthy',
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
    const p3: Plant = {
      id: generateId(),
      name: '香香',
      species: '薄荷',
      acquiredDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      location: '厨房窗台',
      description: '可以泡茶喝的薄荷，香气怡人。',
      tags: ['香草', '食用', '喜水'],
      wateringInterval: 2,
      fertilizingInterval: 20,
      sunlightNeed: 'medium',
      difficulty: 'easy',
      status: 'needsCare',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
    plants.value = [p1, p2, p3]
    savePlants()

    const defaultCare: CareRecord[] = [
      {
        id: generateId(),
        plantId: p1.id,
        type: 'water',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        note: '浇透了，土壤湿润度刚好',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        plantId: p1.id,
        type: 'fertilize',
        date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        note: '稀释了通用营养液',
        amount: '500ml',
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        plantId: p2.id,
        type: 'water',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        note: '浸盆浇水',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        plantId: p3.id,
        type: 'water',
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        note: '土壤有点干了',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        plantId: p3.id,
        type: 'prune',
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        note: '剪了一些老叶子',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
    careRecords.value = defaultCare
    saveCareRecords()

    const defaultKnowledge: KnowledgeArticle[] = [
      {
        id: generateId(),
        title: '多肉植物养护指南',
        category: '多肉',
        tags: ['养护', '入门'],
        content: `## 光照
多肉植物大多喜欢充足的阳光，但夏季要避免暴晒。

## 浇水
"干透浇透"是基本原则。用手指插入土壤2-3厘米，感到干燥时再浇水。
- 春秋生长季：约7-10天一次
- 夏季高温休眠：约15-20天一次
- 冬季低温：约20-30天一次

## 土壤
使用疏松透气的颗粒土，可添加珍珠岩、火山石等颗粒。

## 温度
适宜温度15-28℃，夏季超过35℃要遮阴通风，冬季低于5℃要防冻。`,
        image: '',
        createdAt: new Date().toISOString()
      },
      {
        id: generateId(),
        title: '绿萝养护小窍门',
        category: '观叶',
        tags: ['室内', '净化空气'],
        content: `## 光照
绿萝喜散射光，避免阳光直射。放在明亮的客厅或窗边最佳。

## 浇水
保持土壤微湿但不积水，约5-7天浇一次水。
可以观察叶片：叶子略微发蔫下垂时就是浇水信号。

## 施肥
生长季（春夏）每月施一次稀释的液肥。

## 繁殖
绿萝非常容易扦插：
1. 剪取带气根的健壮枝条（约10-15cm）
2. 插入水中或湿润的土壤中
3. 约1-2周即可生根

## 黄叶原因
- 浇水过多：根部腐烂，减少浇水
- 光照过强：叶片灼伤，移至散射光处
- 缺水：叶片干枯下垂，及时补水`,
        image: '',
        createdAt: new Date().toISOString()
      },
      {
        id: generateId(),
        title: '如何正确给植物浇水',
        category: '基础',
        tags: ['浇水', '技巧'],
        content: `## 判断浇水时机
1. **指测法**：将手指插入土壤2-3cm，感觉干燥则需要浇水
2. **称重法**：浇透水后记住花盆重量，变轻时浇水
3. **观察法**：植物叶片稍微萎蔫下垂时浇水（但不要等到严重萎蔫）

## 浇水方法
1. **缓慢浇灌**：将水沿盆边缓缓浇入，让水分慢慢渗透
2. **浇透为止**：直到水从排水孔流出才算浇透
3. **沥干积水**：托盘中的积水30分钟后倒掉，防止烂根

## 注意事项
- 水温最好接近室温，避免冷水刺激根系
- 夏季早晚浇水，冬季中午浇水
- 水质方面，雨水>放置24小时的自来水>直接自来水
- 叶面上有绒毛的植物（如多肉、大岩桐）避免当头浇水`,
        image: '',
        createdAt: new Date().toISOString()
      },
      {
        id: generateId(),
        title: '薄荷种植与食用',
        category: '香草',
        tags: ['食用', '香草'],
        content: `## 生长习性
薄荷喜欢温暖湿润、阳光充足的环境，生长迅速，很适合新手。

## 养护要点
- **光照**：每天4-6小时阳光
- **浇水**：保持土壤湿润，约2-3天一次
- **修剪**：经常打顶可以促进分枝，让植株更茂盛
- **施肥**：每月一次稀薄液肥即可

## 繁殖
薄荷极易扦插，剪取10cm左右枝条，插入水中一周即可生根。

## 食用方法
1. **薄荷茶**：新鲜薄荷叶用开水冲泡，可加蜂蜜
2. **莫吉托**：薄荷叶+青柠+糖+苏打水+朗姆酒
3. **装饰**：点缀甜点、饮品、沙拉
4. **烹饪**：薄荷牛肉、薄荷豆腐等

## 药用功效
- 清凉解暑，提神醒脑
- 缓解头痛、感冒
- 助消化，舒缓肠胃`,
        image: '',
        createdAt: new Date().toISOString()
      }
    ]
    knowledgeArticles.value = defaultKnowledge
    saveKnowledge()

    const defaultReminders: Reminder[] = [
      {
        id: generateId(),
        plantId: p1.id,
        type: 'water',
        title: '给绿萝浇水',
        scheduledDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: '08:00',
        repeatInterval: 5,
        repeatUnit: 'day',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: generateId(),
        plantId: p3.id,
        type: 'water',
        title: '给薄荷浇水',
        scheduledDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: '09:00',
        repeatInterval: 2,
        repeatUnit: 'day',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ]
    reminders.value = defaultReminders
    saveReminders()

    const defaultDiary: DiaryEntry[] = [
      {
        id: generateId(),
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        content: '今天阳光特别好，把小绿和圆圆都搬到阳台晒太阳了。小绿新长了两片嫩叶，翠绿色的特别好看。圆圆看起来也很精神，叶片越来越饱满了。薄荷剪了一些叶子泡了茶，香气真的很治愈～',
        mood: 'happy',
        plantIds: [p1.id, p2.id, p3.id],
        photos: [],
        weather: 'sunny',
        temperature: 26,
        isPrivate: false,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        content: '今天下了一整天的雨，空气湿度很高。发现圆圆叶片上有一些小黑点，有点担心是不是生虫了，仔细检查了一下好像是灰尘，虚惊一场。薄荷有点蔫了，赶紧浇了水，希望明天能恢复精神。',
        mood: 'worried',
        plantIds: [p2.id, p3.id],
        photos: [],
        weather: 'rainy',
        temperature: 20,
        isPrivate: false,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        content: '惊喜！小绿居然抽出了一条新的藤蔓，上面有好几个嫩芽！没想到它生长得这么快。今天给所有植物都松了松土，顺便把黄叶子都修剪掉了。看着这些小家伙一天天长大，真的很有成就感。',
        mood: 'surprised',
        plantIds: [p1.id, p2.id, p3.id],
        photos: [],
        weather: 'cloudy',
        temperature: 23,
        isPrivate: false,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        content: '今天的天气特别舒服，微风不燥。给圆圆和薄荷都浇了水，土壤湿度刚好。小绿的新藤蔓又长了一点，准备过几天给它搭个爬架。养植物真的是一件很治愈的事情，每天看着它们就觉得很平静。',
        mood: 'calm',
        plantIds: [p1.id],
        photos: [],
        weather: 'sunny',
        temperature: 24,
        isPrivate: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    diaryEntries.value = defaultDiary
    saveDiary()
  }
}
