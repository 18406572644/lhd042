<template>
  <div class="page-container statistics-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><DataAnalysis /></el-icon>
        数据统计
      </div>
    </div>

    <div class="stats-overview">
      <div class="overview-card">
        <div class="overview-icon" style="background: linear-gradient(135deg, #6B8E5A, #8FA978);">
          <span>🌱</span>
        </div>
        <div class="overview-info">
          <div class="overview-value">{{ totalPlants }}</div>
          <div class="overview-label">植物总数</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon" style="background: linear-gradient(135deg, #5B9BD5, #7EC8E3);">
          <span>💧</span>
        </div>
        <div class="overview-info">
          <div class="overview-value">{{ waterRecords }}</div>
          <div class="overview-label">浇水次数</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon" style="background: linear-gradient(135deg, #8FA978, #7CB342);">
          <span>🧪</span>
        </div>
        <div class="overview-info">
          <div class="overview-value">{{ fertilizeRecords }}</div>
          <div class="overview-label">施肥次数</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon" style="background: linear-gradient(135deg, #E8B4B8, #F4D03F);">
          <span>📷</span>
        </div>
        <div class="overview-info">
          <div class="overview-value">{{ totalPhotos }}</div>
          <div class="overview-label">照片数量</div>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="section-card">
          <h3 class="chart-title">养护记录分布</h3>
          <div class="chart-container">
            <v-chart :option="careTypeOption" autoresize style="height: 300px" />
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="section-card">
          <h3 class="chart-title">植物状态分布</h3>
          <div class="chart-container">
            <v-chart :option="statusOption" autoresize style="height: 300px" />
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <div class="section-card">
          <h3 class="chart-title">近30天养护趋势</h3>
          <div class="chart-container">
            <v-chart :option="trendOption" autoresize style="height: 300px" />
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="section-card">
          <h3 class="chart-title">各植物养护频次</h3>
          <div class="chart-container">
            <v-chart :option="plantCareOption" autoresize style="height: 300px" />
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="section-card" style="margin-top: 20px;" v-if="heightData.length > 0">
      <h3 class="chart-title">生长高度追踪</h3>
      <div class="chart-container">
        <v-chart :option="heightOption" autoresize style="height: 300px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, PieChart, BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const store = useAppStore()

const totalPlants = computed(() => store.plants.length)
const waterRecords = computed(() => store.careRecords.filter(r => r.type === 'water').length)
const fertilizeRecords = computed(() => store.careRecords.filter(r => r.type === 'fertilize').length)
const totalPhotos = computed(() => store.photos.length)

const careTypeOption = computed(() => {
  const types = [
    { name: '浇水', value: store.careRecords.filter(r => r.type === 'water').length },
    { name: '施肥', value: store.careRecords.filter(r => r.type === 'fertilize').length },
    { name: '修剪', value: store.careRecords.filter(r => r.type === 'prune').length },
    { name: '换盆', value: store.careRecords.filter(r => r.type === 'repot').length },
    { name: '其他', value: store.careRecords.filter(r => r.type === 'other').length }
  ]
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', textStyle: { color: '#8B7355' } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: { borderRadius: 8, borderColor: '#FAF8F3', borderWidth: 3 },
      label: { color: '#6B5344' },
      data: types,
      color: ['#5B9BD5', '#8FA978', '#E8B4B8', '#8B7355', '#A89070']
    }]
  }
})

const statusOption = computed(() => {
  const statuses = [
    { name: '茁壮成长', value: store.plants.filter(p => p.status === 'healthy').length },
    { name: '需要照料', value: store.plants.filter(p => p.status === 'needsCare').length },
    { name: '状态不佳', value: store.plants.filter(p => p.status === 'sick').length },
    { name: '休眠期', value: store.plants.filter(p => p.status === 'dormant').length }
  ].filter(s => s.value > 0)
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', textStyle: { color: '#8B7355' } },
    series: [{
      type: 'pie',
      radius: '65%',
      roseType: 'area',
      itemStyle: { borderRadius: 8 },
      label: { color: '#6B5344' },
      data: statuses,
      color: ['#6B8E5A', '#F4D03F', '#E74C3C', '#95A5A6']
    }]
  }
})

const trendOption = computed(() => {
  const days: string[] = []
  const waterData: number[] = []
  const fertilizeData: number[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    days.push(d.getDate() + '日')
    waterData.push(store.careRecords.filter(r => r.type === 'water' && r.date.startsWith(dateStr)).length)
    fertilizeData.push(store.careRecords.filter(r => r.type === 'fertilize' && r.date.startsWith(dateStr)).length)
  }
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['浇水', '施肥'], textStyle: { color: '#8B7355' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: days, axisLabel: { color: '#8B7355', fontSize: 10 }, axisLine: { lineStyle: { color: '#EDE7D9' } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#8B7355' }, splitLine: { lineStyle: { color: '#EDE7D9' } } },
    series: [
      { name: '浇水', type: 'line', smooth: true, data: waterData, lineStyle: { color: '#5B9BD5' }, itemStyle: { color: '#5B9BD5' }, areaStyle: { color: 'rgba(91,155,213,0.15)' } },
      { name: '施肥', type: 'line', smooth: true, data: fertilizeData, lineStyle: { color: '#8FA978' }, itemStyle: { color: '#8FA978' }, areaStyle: { color: 'rgba(143,169,120,0.15)' } }
    ]
  }
})

const plantCareOption = computed(() => {
  const plants = store.plants.slice(0, 8)
  const names = plants.map(p => p.name)
  const counts = plants.map(p => store.careRecords.filter(r => r.plantId === p.id).length)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: names, axisLabel: { color: '#8B7355', rotate: 20 }, axisLine: { lineStyle: { color: '#EDE7D9' } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#8B7355' }, splitLine: { lineStyle: { color: '#EDE7D9' } } },
    series: [{
      type: 'bar',
      data: counts,
      barWidth: '50%',
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#8FA978' }, { offset: 1, color: '#6B8E5A' }]
        }
      }
    }]
  }
})

const heightData = computed(() => {
  return store.photos.filter(p => p.height != null && p.height > 0)
})

const heightOption = computed(() => {
  const plantIds = [...new Set(heightData.value.map(p => p.plantId))]
  const series = plantIds.map(pid => {
    const plant = store.plants.find(p => p.id === pid)
    const data = heightData.value
      .filter(p => p.plantId === pid)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(p => [p.date, p.height!])
    return {
      name: plant?.name || '未知',
      type: 'line' as const,
      smooth: true,
      data
    }
  })
  return {
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: '#8B7355' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', axisLabel: { color: '#8B7355' }, axisLine: { lineStyle: { color: '#EDE7D9' } } },
    yAxis: { type: 'value', name: '高度(cm)', axisLabel: { color: '#8B7355' }, splitLine: { lineStyle: { color: '#EDE7D9' } } },
    series,
    color: ['#6B8E5A', '#5B9BD5', '#E8B4B8', '#F4D03F', '#8B7355', '#A89070', '#7CB342', '#95A5A6']
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.statistics-page {
  .page-header {
    margin-bottom: 24px;
    .page-title {
      font-size: 24px; font-weight: 600; color: $brown-dark;
      display: flex; align-items: center; gap: 12px;
      .title-icon { color: $forest-green; font-size: 28px; }
    }
  }

  .stats-overview {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .overview-card {
    background: $cream-light;
    border: 1px solid $cream-dark;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s;
    &:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(107,142,90,0.12); }
    .overview-icon {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; flex-shrink: 0;
    }
    .overview-info {
      .overview-value { font-size: 28px; font-weight: 700; color: $brown-dark; }
      .overview-label { font-size: 14px; color: $brown-light; }
    }
  }

  .chart-title {
    font-size: 16px; font-weight: 600; color: $brown-dark; margin-bottom: 16px;
  }
}
</style>
