<template>
  <div class="page-container plants-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Grape /></el-icon>
        植物档案
      </div>
      <div class="page-actions">
        <el-input
          v-model="searchText"
          placeholder="搜索植物名称..."
          prefix-icon="Search"
          clearable
          style="width: 240px"
        />
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px">
          <el-option label="茁壮成长" value="healthy" />
          <el-option label="需要照料" value="needsCare" />
          <el-option label="状态不佳" value="sick" />
          <el-option label="休眠期" value="dormant" />
        </el-select>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 添加植物
        </el-button>
      </div>
    </div>

    <div class="plant-grid" v-if="filteredPlants.length > 0">
      <div class="plant-card" v-for="plant in filteredPlants" :key="plant.id" @click="goToDetail(plant.id)">
        <div class="plant-image">
          {{ getPlantEmoji(plant.species) }}
        </div>
        <div class="plant-info">
          <div class="plant-name">
            {{ plant.name }}
            <el-tag size="small" :color="getStatusColor(plant.status)" effect="dark" round>
              {{ statusLabel(plant.status) }}
            </el-tag>
          </div>
          <div class="plant-species">{{ plant.species }} · {{ plant.nickname || '' }}</div>
          <div class="plant-meta">
            <span>📍 {{ plant.location }}</span>
            <span>💧 {{ plant.wateringInterval }}天/次</span>
            <span>☀️ {{ sunlightLabel(plant.sunlightNeed) }}</span>
          </div>
          <div class="plant-tags">
            <el-tag v-for="tag in plant.tags" :key="tag" size="small" type="info" round>{{ tag }}</el-tag>
          </div>
        </div>
        <div class="plant-actions" @click.stop>
          <el-button size="small" circle @click="editPlant(plant)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button size="small" circle type="danger" @click="handleDeletePlant(plant)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">🌱</div>
      <div class="empty-text">{{ searchText || filterStatus ? '没有找到匹配的植物' : '还没有植物，点击上方按钮添加吧！' }}</div>
    </div>

    <el-dialog v-model="showAddDialog" :title="editingPlant ? '编辑植物' : '添加植物'" width="560px" destroy-on-close>
      <el-form :model="plantForm" label-width="90px" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="植物名称" required>
              <el-input v-model="plantForm.name" placeholder="给你的植物起个名字" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品种" required>
              <el-input v-model="plantForm.species" placeholder="如：绿萝、多肉等" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="昵称">
              <el-input v-model="plantForm.nickname" placeholder="给TA一个可爱的昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="获取日期">
              <el-date-picker v-model="plantForm.acquiredDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="放置位置">
          <el-input v-model="plantForm.location" placeholder="如：客厅窗边、阳台等" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="plantForm.description" type="textarea" :rows="3" placeholder="描述一下你的植物" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="浇水频率(天)">
              <el-input-number v-model="plantForm.wateringInterval" :min="1" :max="60" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="施肥频率(天)">
              <el-input-number v-model="plantForm.fertilizingInterval" :min="1" :max="180" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="光照需求">
              <el-select v-model="plantForm.sunlightNeed" style="width: 100%">
                <el-option label="弱光" value="low" />
                <el-option label="散射光" value="medium" />
                <el-option label="强光" value="high" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="养护难度">
              <el-select v-model="plantForm.difficulty" style="width: 100%">
                <el-option label="新手友好" value="easy" />
                <el-option label="一般难度" value="medium" />
                <el-option label="需要经验" value="hard" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前状态">
              <el-select v-model="plantForm.status" style="width: 100%">
                <el-option label="茁壮成长" value="healthy" />
                <el-option label="需要照料" value="needsCare" />
                <el-option label="状态不佳" value="sick" />
                <el-option label="休眠期" value="dormant" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="标签">
          <el-select v-model="plantForm.tags" multiple filterable allow-create default-first-option placeholder="添加标签" style="width: 100%">
            <el-option v-for="tag in commonTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="植物照片">
          <el-upload
            :auto-upload="false"
            :show-file-list="true"
            accept="image/*"
            :on-change="handleImageChange"
            list-type="picture"
            :limit="1"
          >
            <el-button size="small">选择照片</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelForm">取消</el-button>
        <el-button type="primary" @click="submitPlant">{{ editingPlant ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <PasswordConfirmDialog
      v-model="showDeleteConfirm"
      title="确认删除植物"
      description="此操作将永久删除该植物及其所有相关数据，且无法恢复。"
      confirm-text="确认删除"
      :show-warning="true"
      @confirm="confirmDeletePlant"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { getPlantEmoji, statusLabel, getStatusColor, sunlightLabel, compressImage } from '@/utils'
import type { Plant } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import PasswordConfirmDialog from '@/components/PasswordConfirmDialog.vue'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const searchText = ref('')
const filterStatus = ref('')
const showAddDialog = ref(false)
const editingPlant = ref<Plant | null>(null)
const showDeleteConfirm = ref(false)
const deletingPlantId = ref('')

const commonTags = ['室内', '阳台', '净化空气', '多肉', '观花', '观叶', '香草', '食用', '耐旱', '喜水', '新手友好']

const defaultForm = () => ({
  name: '',
  species: '',
  nickname: '',
  acquiredDate: new Date().toISOString().split('T')[0],
  location: '',
  description: '',
  tags: [] as string[],
  wateringInterval: 7,
  fertilizingInterval: 30,
  sunlightNeed: 'medium' as 'low' | 'medium' | 'high',
  difficulty: 'easy' as 'easy' | 'medium' | 'hard',
  status: 'healthy' as 'healthy' | 'needsCare' | 'sick' | 'dormant',
  image: ''
})

const plantForm = reactive(defaultForm())
const imageFile = ref<File | null>(null)

const filteredPlants = computed(() => {
  let list = store.plants
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.species.toLowerCase().includes(q) || (p.nickname || '').toLowerCase().includes(q))
  }
  if (filterStatus.value) {
    list = list.filter(p => p.status === filterStatus.value)
  }
  return list
})

const goToDetail = (id: string) => {
  router.push(`/plant/${id}`)
}

const editPlant = (plant: Plant) => {
  editingPlant.value = plant
  Object.assign(plantForm, {
    name: plant.name,
    species: plant.species,
    nickname: plant.nickname || '',
    acquiredDate: plant.acquiredDate ? plant.acquiredDate.split('T')[0] : '',
    location: plant.location,
    description: plant.description || '',
    tags: [...plant.tags],
    wateringInterval: plant.wateringInterval,
    fertilizingInterval: plant.fertilizingInterval,
    sunlightNeed: plant.sunlightNeed,
    difficulty: plant.difficulty,
    status: plant.status,
    image: plant.image || ''
  })
  showAddDialog.value = true
}

const deletePlant = (id: string) => {
  store.deletePlant(id)
  ElMessage.success('已删除')
}

const handleDeletePlant = (plant: Plant) => {
  ElMessageBox.confirm(
    `确定删除植物「${plant.name}」吗？删除后将无法恢复。`,
    '确认删除',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    if (store.hasMasterPassword) {
      deletingPlantId.value = plant.id
      showDeleteConfirm.value = true
    } else {
      deletePlant(plant.id)
    }
  }).catch(() => {})
}

const confirmDeletePlant = () => {
  deletePlant(deletingPlantId.value)
  showDeleteConfirm.value = false
  deletingPlantId.value = ''
}

const cancelForm = () => {
  showAddDialog.value = false
  editingPlant.value = null
  Object.assign(plantForm, defaultForm())
  imageFile.value = null
}

const handleImageChange = async (file: any) => {
  if (file?.raw) {
    imageFile.value = file.raw
    plantForm.image = await compressImage(file.raw)
  }
}

const submitPlant = () => {
  if (!plantForm.name || !plantForm.species) {
    ElMessage.warning('请填写植物名称和品种')
    return
  }

  if (editingPlant.value) {
    store.updatePlant(editingPlant.value.id, {
      name: plantForm.name,
      species: plantForm.species,
      nickname: plantForm.nickname || undefined,
      acquiredDate: plantForm.acquiredDate,
      location: plantForm.location,
      description: plantForm.description || undefined,
      tags: plantForm.tags,
      wateringInterval: plantForm.wateringInterval,
      fertilizingInterval: plantForm.fertilizingInterval,
      sunlightNeed: plantForm.sunlightNeed,
      difficulty: plantForm.difficulty,
      status: plantForm.status,
      image: plantForm.image || undefined
    })
    ElMessage.success('已更新')
  } else {
    store.addPlant({
      name: plantForm.name,
      species: plantForm.species,
      nickname: plantForm.nickname || undefined,
      acquiredDate: plantForm.acquiredDate,
      location: plantForm.location,
      description: plantForm.description || undefined,
      tags: plantForm.tags,
      wateringInterval: plantForm.wateringInterval,
      fertilizingInterval: plantForm.fertilizingInterval,
      sunlightNeed: plantForm.sunlightNeed,
      difficulty: plantForm.difficulty,
      status: plantForm.status,
      image: plantForm.image || undefined
    })
    ElMessage.success('添加成功')
  }
  cancelForm()
}

onMounted(() => {
  if (route.query.action === 'add') {
    showAddDialog.value = true
  } else if (route.query.action === 'edit' && route.query.id) {
    const plant = store.plants.find(p => p.id === route.query.id)
    if (plant) {
      editPlant(plant)
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.plants-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: $brown-dark;
      display: flex;
      align-items: center;
      gap: 12px;
      .title-icon { color: $forest-green; font-size: 28px; }
    }

    .page-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .plant-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .plant-card {
    .plant-image {
      height: 160px;
    }
    .plant-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: $brown-light;
      margin-bottom: 8px;
    }
    .plant-actions {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    &:hover .plant-actions {
      opacity: 1;
    }
  }
}
</style>
