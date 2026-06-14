<template>
  <el-dialog
    v-model="visible"
    title="植物状态变更提醒"
    width="480px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="status-change-content">
      <div class="change-icon">
        <span>{{ getReasonIcon(change?.reason || 'manual') }}</span>
      </div>
      <div class="change-info">
        <div class="plant-name">{{ change?.plantName }}</div>
        <div class="change-detail">
          <span class="status-badge" :style="{ background: getStatusColor(change?.currentStatus || 'healthy') }">
            {{ statusLabel(change?.currentStatus || 'healthy') }}
          </span>
          <span class="arrow">→</span>
          <span class="status-badge" :style="{ background: getStatusColor(change?.suggestedStatus || 'healthy') }">
            {{ statusLabel(change?.suggestedStatus || 'healthy') }}
          </span>
        </div>
        <div class="change-reason">{{ change?.reasonText }}</div>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleReject">保持原状</el-button>
      <el-button type="primary" @click="handleAccept">接受变更</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { statusLabel, getStatusColor } from '@/utils'
import { getStatusChangeReasonIcon } from '@/utils/careAI'
import type { StatusEvaluationResult } from '@/utils/careAI'

const props = defineProps<{
  modelValue: boolean
  change: StatusEvaluationResult | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'accept', plantId: string): void
  (e: 'reject', plantId: string): void
}>()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const getReasonIcon = (reason: string) => {
  return getStatusChangeReasonIcon(reason as any)
}

const handleClose = () => {
  if (props.change) {
    emit('reject', props.change.plantId)
  }
}

const handleAccept = () => {
  if (props.change) {
    emit('accept', props.change.plantId)
  }
  visible.value = false
}

const handleReject = () => {
  if (props.change) {
    emit('reject', props.change.plantId)
  }
  visible.value = false
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.status-change-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 8px 0;

  .change-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, $forest-green-light, $forest-green);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    flex-shrink: 0;
  }

  .change-info {
    flex: 1;

    .plant-name {
      font-size: 18px;
      font-weight: 600;
      color: $brown-dark;
      margin-bottom: 12px;
    }

    .change-detail {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .arrow {
        color: $brown-light;
        font-size: 18px;
      }

      .status-badge {
        padding: 4px 14px;
        border-radius: 16px;
        color: white;
        font-size: 13px;
        font-weight: 500;
      }
    }

    .change-reason {
      padding: 12px;
      background: $cream;
      border-radius: 10px;
      color: $brown;
      font-size: 14px;
      line-height: 1.6;
    }
  }
}
</style>
