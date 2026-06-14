<template>
  <div class="page-container knowledge-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Reading /></el-icon>
        养护知识
      </div>
      <div class="page-actions">
        <el-input v-model="searchText" placeholder="搜索知识..." prefix-icon="Search" clearable style="width: 220px" />
        <el-select v-model="filterCategory" placeholder="分类" clearable style="width: 140px">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 添加知识
        </el-button>
      </div>
    </div>

    <div class="knowledge-grid" v-if="filteredArticles.length > 0">
      <div class="knowledge-card" v-for="article in filteredArticles" :key="article.id" @click="viewArticle(article)">
        <div class="card-header">
          <span class="card-category">{{ article.category }}</span>
          <el-button size="small" circle @click.stop="deleteArticle(article.id)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <h3 class="card-title">{{ article.title }}</h3>
        <div class="card-tags">
          <el-tag v-for="tag in article.tags" :key="tag" size="small" type="info" round>{{ tag }}</el-tag>
        </div>
        <div class="card-preview">{{ getPreview(article.content) }}</div>
      </div>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">📚</div>
      <div class="empty-text">暂无知识文章</div>
    </div>

    <el-drawer v-model="showArticle" :title="currentArticle?.title" size="50%" direction="rtl">
      <div class="article-content" v-if="currentArticle">
        <div class="article-meta">
          <el-tag>{{ currentArticle.category }}</el-tag>
          <el-tag v-for="tag in currentArticle.tags" :key="tag" size="small" type="info" round>{{ tag }}</el-tag>
        </div>
        <div class="article-body" v-html="renderMarkdown(currentArticle.content)"></div>
      </div>
    </el-drawer>

    <el-dialog v-model="showAddDialog" title="添加知识文章" width="600px" destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="文章标题" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="form.category" filterable allow-create placeholder="选择或输入分类" style="width: 100%">
                <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签">
              <el-select v-model="form.tags" multiple filterable allow-create placeholder="添加标签" style="width: 100%">
                <el-option label="养护" value="养护" />
                <el-option label="入门" value="入门" />
                <el-option label="进阶" value="进阶" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="12" placeholder="支持 Markdown 格式书写，使用 ## 作为标题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addArticle">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useAppStore } from '@/stores/app'
import type { KnowledgeArticle } from '@/types'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const searchText = ref('')
const filterCategory = ref('')
const showAddDialog = ref(false)
const showArticle = ref(false)
const currentArticle = ref<KnowledgeArticle | null>(null)

const form = reactive({
  title: '',
  category: '',
  tags: [] as string[],
  content: ''
})

const categories = computed(() => {
  const cats = new Set(store.knowledgeArticles.map(a => a.category))
  return Array.from(cats)
})

const filteredArticles = computed(() => {
  let list = store.knowledgeArticles
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q))
  }
  if (filterCategory.value) {
    list = list.filter(a => a.category === filterCategory.value)
  }
  return list
})

const getPreview = (content: string) => {
  const text = content.replace(/#{1,6}\s/g, '').replace(/\n/g, ' ')
  return text.length > 80 ? text.slice(0, 80) + '...' : text
}

const renderMarkdown = (content: string) => {
  return content
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

const viewArticle = (article: KnowledgeArticle) => {
  currentArticle.value = article
  showArticle.value = true
}

const deleteArticle = (id: string) => {
  store.deleteKnowledge(id)
}

const addArticle = () => {
  if (!form.title || !form.content) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  store.addKnowledge({
    title: form.title,
    category: form.category || '通用',
    tags: form.tags,
    content: form.content
  })
  ElMessage.success('文章已添加')
  showAddDialog.value = false
  Object.assign(form, { title: '', category: '', tags: [], content: '' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.knowledge-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
    .page-title {
      font-size: 24px; font-weight: 600; color: $brown-dark;
      display: flex; align-items: center; gap: 12px;
      .title-icon { color: $forest-green; font-size: 28px; }
    }
    .page-actions { display: flex; gap: 12px; align-items: center; }
  }

  .knowledge-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .knowledge-card {
    background: $cream-light;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid $cream-dark;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(107,142,90,0.12);
      border-color: $forest-green-light;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      .card-category {
        background: $forest-green;
        color: #fff;
        padding: 2px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }

    .card-title {
      font-size: 17px;
      color: $brown-dark;
      margin-bottom: 10px;
      line-height: 1.5;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .card-preview {
      font-size: 13px;
      color: $brown-light;
      line-height: 1.6;
    }
  }

  .article-content {
    .article-meta {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .article-body {
      font-size: 15px;
      line-height: 2;
      color: $brown-dark;

      :deep(h2) { font-size: 22px; color: $forest-green-dark; margin: 20px 0 12px; }
      :deep(h3) { font-size: 18px; color: $brown-dark; margin: 16px 0 10px; }
      :deep(h4) { font-size: 16px; color: $brown; margin: 12px 0 8px; }
      :deep(ul) { padding-left: 20px; }
      :deep(li) { margin-bottom: 6px; }
      :deep(strong) { color: $forest-green-dark; }
    }
  }
}
</style>
