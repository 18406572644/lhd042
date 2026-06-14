<template>
  <div class="page-container gallery-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Picture /></el-icon>
        生长相册
      </div>
      <div class="page-actions">
        <el-select v-model="filterPlant" placeholder="选择植物" clearable style="width: 160px">
          <el-option v-for="p in store.plants" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon> 上传照片
        </el-button>
      </div>
    </div>

    <div class="gallery-grid" v-if="filteredPhotos.length > 0">
      <div class="gallery-item" v-for="photo in filteredPhotos" :key="photo.id" @click="previewPhoto(photo.image)">
        <img :src="photo.image" :alt="photo.note || ''" />
        <div class="gallery-overlay">
          <div class="overlay-info">
            <span class="overlay-plant">{{ getPlantName(photo.plantId) }}</span>
            <span class="overlay-date">{{ formatDate(photo.date, 'YYYY-MM-DD') }}</span>
            <span class="overlay-note" v-if="photo.note">{{ photo.note }}</span>
          </div>
          <div class="overlay-data" v-if="photo.height || photo.leafCount">
            <span v-if="photo.height">📏 {{ photo.height }}cm</span>
            <span v-if="photo.leafCount">🍃 {{ photo.leafCount }}片</span>
          </div>
        </div>
        <el-button class="delete-btn" size="small" circle type="danger" @click.stop="store.deletePhoto(photo.id)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">📷</div>
      <div class="empty-text">暂无照片，快去上传植物生长照片吧！</div>
    </div>

    <el-dialog v-model="showUploadDialog" title="上传生长照片" width="520px" destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-form-item label="选择植物" required>
          <el-select v-model="form.plantId" placeholder="选择植物" style="width: 100%">
            <el-option v-for="p in store.plants" :key="p.id" :label="p.name + ' (' + p.species + ')'" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择照片" required>
          <el-upload :auto-upload="false" :on-change="handleFileChange" accept="image/*" list-type="picture-card" :limit="5" :file-list="fileList">
            <el-icon :size="28"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="form.date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" placeholder="记录这天的生长状况" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="高度(cm)">
              <el-input-number v-model="form.height" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="叶片数">
              <el-input-number v-model="form.leafCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="uploadPhotos">上传</el-button>
      </template>
    </el-dialog>

    <el-image-viewer v-if="showViewer" :url-list="viewerUrls" :initial-index="viewerIndex" @close="showViewer = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useAppStore } from '@/stores/app'
import { formatDate, compressImage } from '@/utils'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const filterPlant = ref('')
const showUploadDialog = ref(false)
const showViewer = ref(false)
const viewerUrls = ref<string[]>([])
const viewerIndex = ref(0)
const fileList = ref<any[]>([])
const imageBuffers = ref<string[]>([])

const form = reactive({
  plantId: '',
  date: new Date().toISOString().split('T')[0],
  note: '',
  height: undefined as number | undefined,
  leafCount: undefined as number | undefined
})

const filteredPhotos = computed(() => {
  let list = [...store.photos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  if (filterPlant.value) list = list.filter(p => p.plantId === filterPlant.value)
  return list
})

const getPlantName = (plantId: string) => {
  return store.plants.find(p => p.id === plantId)?.name || '未知植物'
}

const previewPhoto = (url: string) => {
  viewerUrls.value = filteredPhotos.value.map(p => p.image)
  viewerIndex.value = filteredPhotos.value.findIndex(p => p.image === url)
  showViewer.value = true
}

const handleFileChange = async (file: any) => {
  if (file?.raw) {
    const compressed = await compressImage(file.raw)
    imageBuffers.value.push(compressed)
  }
}

const uploadPhotos = () => {
  if (!form.plantId) { ElMessage.warning('请选择植物'); return }
  if (imageBuffers.value.length === 0) { ElMessage.warning('请选择照片'); return }
  
  imageBuffers.value.forEach(img => {
    store.addPhoto({
      plantId: form.plantId,
      image: img,
      date: form.date || new Date().toISOString().split('T')[0],
      note: form.note || undefined,
      height: form.height,
      leafCount: form.leafCount
    })
  })
  
  ElMessage.success(`已上传 ${imageBuffers.value.length} 张照片`)
  showUploadDialog.value = false
  imageBuffers.value = []
  fileList.value = []
  Object.assign(form, { plantId: '', date: new Date().toISOString().split('T')[0], note: '', height: undefined, leafCount: undefined })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.gallery-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    .page-title {
      font-size: 24px; font-weight: 600; color: $brown-dark;
      display: flex; align-items: center; gap: 12px;
      .title-icon { color: $forest-green; font-size: 28px; }
    }
    .page-actions { display: flex; gap: 12px; align-items: center; }
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }

  .gallery-item {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    aspect-ratio: 4/3;
    background: $cream-dark;
    border: 2px solid $cream-dark;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(107,142,90,0.15);
      border-color: $forest-green-light;

      .gallery-overlay { opacity: 1; }
      .delete-btn { opacity: 1; }
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .gallery-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 16px;
      background: linear-gradient(transparent, rgba(74,107,61,0.85));
      color: #fff;
      opacity: 0;
      transition: opacity 0.3s;

      .overlay-info {
        .overlay-plant { font-weight: 600; font-size: 15px; display: block; }
        .overlay-date { font-size: 12px; opacity: 0.8; }
        .overlay-note { font-size: 13px; margin-top: 4px; opacity: 0.9; }
      }
      .overlay-data {
        margin-top: 4px;
        display: flex;
        gap: 12px;
        font-size: 12px;
        opacity: 0.85;
      }
    }

    .delete-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }
  }
}
</style>
