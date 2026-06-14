<template>
  <div class="page-container logs-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Document /></el-icon>
        操作日志
      </div>
      <div class="page-actions">
        <el-select v-model="filterType" placeholder="操作类型" clearable style="width: 180px">
          <el-option
            v-for="type in operationTypes"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>
        <el-date-picker
          v-model="filterDate"
          type="date"
          placeholder="选择日期"
          clearable
          style="width: 160px"
          value-format="YYYY-MM-DD"
        />
        <el-button @click="refreshLogs">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
        <el-button @click="exportLogs">
          <el-icon><Download /></el-icon> 导出
        </el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total"><el-icon :size="28"><DataLine /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ filteredLogs.length }}</div>
          <div class="stat-label">总操作数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon add"><el-icon :size="28"><Plus /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ addCount }}</div>
          <div class="stat-label">添加操作</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon delete"><el-icon :size="28"><Delete /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ deleteCount }}</div>
          <div class="stat-label">删除操作</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon security"><el-icon :size="28"><Lock /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ securityCount }}</div>
          <div class="stat-label">安全操作</div>
        </div>
      </div>
    </div>

    <div class="logs-table-container">
      <el-table
        :data="paginatedLogs"
        style="width: 100%"
        v-loading="loading"
        :row-class-name="rowClassName"
      >
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="{ row }">
            <span class="timestamp">{{ formatDate(row.timestamp, 'YYYY-MM-DD HH:mm:ss') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small" round>
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" min-width="200">
          <template #default="{ row }">
            <span class="description">{{ row.description }}</span>
          </template>
        </el-table-column>
        <el-table-column label="详情" width="100" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.details"
              size="small"
              text
              type="primary"
              @click="showDetails(row)"
            >
              查看
            </el-button>
            <span v-else class="no-details">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="filteredLogs.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <el-dialog v-model="showDetailsDialog" title="操作详情" width="520px">
      <div class="details-content" v-if="currentLog">
        <div class="detail-row">
          <span class="detail-label">操作时间：</span>
          <span class="detail-value">{{ formatDate(currentLog.timestamp, 'YYYY-MM-DD HH:mm:ss') }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作类型：</span>
          <el-tag :type="getTypeTagType(currentLog.type)" size="small" round>
            {{ getTypeLabel(currentLog.type) }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作描述：</span>
          <span class="detail-value">{{ currentLog.description }}</span>
        </div>
        <div class="detail-row" v-if="currentLog.userAgent">
          <span class="detail-label">用户代理：</span>
          <span class="detail-value user-agent">{{ currentLog.userAgent }}</span>
        </div>
        <div class="detail-section" v-if="currentLog.details">
          <span class="detail-label">详细数据：</span>
          <pre class="detail-json">{{ JSON.stringify(currentLog.details, null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Refresh,
  Download,
  DataLine,
  Plus,
  Delete,
  Lock
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { formatDate } from '@/utils'
import type { OperationLog, OperationType } from '@/types'

const store = useAppStore()

const loading = ref(false)
const filterType = ref<OperationType | ''>('')
const filterDate = ref('')
const currentPage = ref(1)
const pageSize = ref(50)
const showDetailsDialog = ref(false)
const currentLog = ref<OperationLog | null>(null)

const operationTypes = [
  { label: '全部', value: '' },
  { label: '植物 - 添加', value: 'plant.add' },
  { label: '植物 - 更新', value: 'plant.update' },
  { label: '植物 - 删除', value: 'plant.delete' },
  { label: '记录 - 添加', value: 'record.add' },
  { label: '记录 - 删除', value: 'record.delete' },
  { label: '照片 - 添加', value: 'photo.add' },
  { label: '照片 - 删除', value: 'photo.delete' },
  { label: '提醒 - 添加', value: 'reminder.add' },
  { label: '提醒 - 删除', value: 'reminder.delete' },
  { label: '日记 - 添加', value: 'diary.add' },
  { label: '日记 - 删除', value: 'diary.delete' },
  { label: '安全 - 密码设置', value: 'security.password_set' },
  { label: '安全 - 密码修改', value: 'security.password_change' },
  { label: '安全 - 加密启用', value: 'security.encryption_enable' },
  { label: '安全 - 加密禁用', value: 'security.encryption_disable' },
  { label: '数据 - 导出', value: 'data.export' },
  { label: '数据 - 导入', value: 'data.import' },
  { label: '数据 - 清空', value: 'data.clear' },
  { label: '数据 - 完整性检查', value: 'data.integrity_check' }
]

const filteredLogs = computed(() => {
  let logs = store.operationLogs

  if (filterType.value) {
    logs = logs.filter(log => log.type === filterType.value)
  }

  if (filterDate.value) {
    logs = logs.filter(log => {
      const logDate = log.timestamp.split('T')[0]
      return logDate === filterDate.value
    })
  }

  return logs
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLogs.value.slice(start, end)
})

const addCount = computed(() => {
  return store.operationLogs.filter(l => l.type.endsWith('.add')).length
})

const deleteCount = computed(() => {
  return store.operationLogs.filter(l => l.type.endsWith('.delete')).length
})

const securityCount = computed(() => {
  return store.operationLogs.filter(l => l.type.startsWith('security.')).length
})

const getTypeLabel = (type: OperationType): string => {
  const found = operationTypes.find(t => t.value === type)
  return found?.label || type
}

const getTypeTagType = (type: OperationType): string => {
  if (type.endsWith('.delete') || type.startsWith('security.encryption_disable') || type === 'data.clear') {
    return 'danger'
  }
  if (type.endsWith('.add')) {
    return 'success'
  }
  if (type.endsWith('.update')) {
    return 'warning'
  }
  if (type.startsWith('security.')) {
    return 'primary'
  }
  return 'info'
}

const rowClassName = ({ row }: { row: OperationLog }): string => {
  if (row.type.endsWith('.delete')) return 'row-delete'
  if (row.type === 'data.clear') return 'row-danger'
  return ''
}

const showDetails = (log: OperationLog) => {
  currentLog.value = log
  showDetailsDialog.value = true
}

const refreshLogs = () => {
  loading.value = true
  setTimeout(() => {
    store.loadOperationLogs()
    loading.value = false
    ElMessage.success('已刷新')
  }, 300)
}

const exportLogs = () => {
  const data = {
    logs: filteredLogs.value,
    exportDate: new Date().toISOString(),
    totalCount: filteredLogs.value.length
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `operation-logs-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('日志已导出')
}

onMounted(() => {
  store.loadOperationLogs()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.logs-page {
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

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: $cream-light;
      border-radius: 12px;
      border: 1px solid $cream-dark;

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.total {
          background: rgba(107, 142, 90, 0.15);
          color: $forest-green;
        }
        &.add {
          background: rgba(103, 194, 58, 0.15);
          color: #67c23a;
        }
        &.delete {
          background: rgba(245, 108, 108, 0.15);
          color: #f56c6c;
        }
        &.security {
          background: rgba(64, 158, 255, 0.15);
          color: #409eff;
        }
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: $brown-dark;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 13px;
          color: $brown-light;
        }
      }
    }
  }

  .logs-table-container {
    background: $cream-light;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid $cream-dark;

    :deep(.el-table) {
      background: transparent;

      &::before {
        display: none;
      }

      .el-table__header {
        th {
          background: $cream;
          color: $brown-dark;
          font-weight: 600;
          border-bottom: 2px solid $cream-dark;
        }
      }

      .el-table__row {
        &:hover {
          background: $cream !important;
        }

        &.row-delete {
          background: rgba(245, 108, 108, 0.05);
        }

        &.row-danger {
          background: rgba(245, 108, 108, 0.1);
        }
      }

      .el-table__cell {
        border-bottom: 1px solid $cream;
      }
    }

    .timestamp {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: $brown;
    }

    .description {
      color: $brown-dark;
    }

    .no-details {
      color: $brown-light;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
  }

  .details-content {
    .detail-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 8px;

      .detail-label {
        font-weight: 600;
        color: $brown-dark;
        min-width: 90px;
        flex-shrink: 0;
      }

      .detail-value {
        color: $brown;
        flex: 1;
        line-height: 1.6;

        &.user-agent {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          word-break: break-all;
        }
      }
    }

    .detail-section {
      margin-top: 20px;

      .detail-label {
        display: block;
        margin-bottom: 8px;
      }

      .detail-json {
        background: $cream;
        padding: 16px;
        border-radius: 8px;
        font-size: 12px;
        line-height: 1.6;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid $cream-dark;
      }
    }
  }
}
</style>
