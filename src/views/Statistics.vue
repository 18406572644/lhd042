<template>
  <div class="page-container statistics-page">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><DataAnalysis /></el-icon>
        数据统计
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showReportDialog = true">
          <el-icon><Document /></el-icon>
          生成报表
        </el-button>
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
      <el-col :span="8">
        <div class="overview-card diary-stat-card">
          <div class="overview-icon" style="background: linear-gradient(135deg, #F4D03F, #F39C12);">
            <span>📖</span>
          </div>
          <div class="overview-info">
            <div class="overview-value">{{ totalDiary }}</div>
            <div class="overview-label">日记总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="overview-card diary-stat-card">
          <div class="overview-icon" style="background: linear-gradient(135deg, #7CB342, #6B8E5A);">
            <span>🔥</span>
          </div>
          <div class="overview-info">
            <div class="overview-value">{{ diaryStreak }}</div>
            <div class="overview-label">最长连续打卡</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="overview-card diary-stat-card">
          <div class="overview-icon" style="background: linear-gradient(135deg, #E91E63, #E8B4B8);">
            <span>😊</span>
          </div>
          <div class="overview-info">
            <div class="overview-value">{{ topMoodLabel }}</div>
            <div class="overview-label">最常心情</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="section-tabs">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="生长趋势" name="growth">
          <div v-if="growthData.length > 0">
            <div class="plant-selector">
              <el-select v-model="selectedGrowthPlant" placeholder="选择植物" style="width: 200px;">
                <el-option
                  v-for="p in growthPlants"
                  :key="p.plantId"
                  :label="p.plantName"
                  :value="p.plantId"
                />
              </el-select>
            </div>
            <div class="section-card">
              <div class="chart-header">
                <h3 class="chart-title">生长趋势曲线</h3>
                <el-button size="small" @click="exportChart('growth')">
                  <el-icon><Download /></el-icon>
                  导出图片
                </el-button>
              </div>
              <div class="chart-container">
                <v-chart ref="growthChartRef" :option="growthTrendOption" autoresize style="height: 400px" />
              </div>
            </div>
            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="12">
                <div class="section-card">
                  <h3 class="chart-title">生长速率变化</h3>
                  <div class="chart-container">
                    <v-chart :option="growthRateOption" autoresize style="height: 300px" />
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="section-card">
                  <h3 class="chart-title">叶片数量变化</h3>
                  <div class="chart-container">
                    <v-chart :option="leafCountOption" autoresize style="height: 300px" />
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
          <el-empty v-else description="暂无生长数据，请在照片记录中添加株高和叶片数量" />
        </el-tab-pane>

        <el-tab-pane label="养护频率" name="frequency">
          <div v-if="careFrequencyData.length > 0">
            <div class="plant-selector">
              <el-select v-model="selectedFrequencyPlant" placeholder="选择植物" style="width: 200px;">
                <el-option
                  v-for="p in careFrequencyData"
                  :key="p.plantId"
                  :label="p.plantName"
                  :value="p.plantId"
                />
              </el-select>
            </div>
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="section-card">
                  <div class="chart-header">
                    <h3 class="chart-title">浇水频率趋势</h3>
                    <el-button size="small" @click="exportChart('waterFrequency')">
                      <el-icon><Download /></el-icon>
                      导出图片
                    </el-button>
                  </div>
                  <div class="chart-container">
                    <v-chart ref="waterFrequencyChartRef" :option="waterFrequencyOption" autoresize style="height: 350px" />
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="section-card">
                  <div class="chart-header">
                    <h3 class="chart-title">施肥频率趋势</h3>
                    <el-button size="small" @click="exportChart('fertilizeFrequency')">
                      <el-icon><Download /></el-icon>
                      导出图片
                    </el-button>
                  </div>
                  <div class="chart-container">
                    <v-chart ref="fertilizeFrequencyChartRef" :option="fertilizeFrequencyOption" autoresize style="height: 350px" />
                  </div>
                </div>
              </el-col>
            </el-row>
            <div class="section-card" style="margin-top: 20px;">
              <div class="chart-header">
                <h3 class="chart-title">养护间隔变化趋势</h3>
                <el-button size="small" @click="exportChart('interval')">
                  <el-icon><Download /></el-icon>
                  导出图片
                </el-button>
              </div>
              <div class="chart-container">
                <v-chart ref="intervalChartRef" :option="intervalTrendOption" autoresize style="height: 350px" />
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无养护记录数据" />
        </el-tab-pane>

        <el-tab-pane label="季节性分析" name="seasonal">
          <div v-if="seasonalAnalysis.length > 0">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="section-card">
                  <div class="chart-header">
                    <h3 class="chart-title">四季养护活动分布</h3>
                    <el-button size="small" @click="exportChart('seasonalActivity')">
                      <el-icon><Download /></el-icon>
                      导出图片
                    </el-button>
                  </div>
                  <div class="chart-container">
                    <v-chart ref="seasonalActivityChartRef" :option="seasonalActivityOption" autoresize style="height: 350px" />
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="section-card">
                  <div class="chart-header">
                    <h3 class="chart-title">各季节平均养护间隔</h3>
                    <el-button size="small" @click="exportChart('seasonalInterval')">
                      <el-icon><Download /></el-icon>
                      导出图片
                    </el-button>
                  </div>
                  <div class="chart-container">
                    <v-chart ref="seasonalIntervalChartRef" :option="seasonalIntervalOption" autoresize style="height: 350px" />
                  </div>
                </div>
              </el-col>
            </el-row>
            <div class="section-card" style="margin-top: 20px;">
              <div class="chart-header">
                <h3 class="chart-title">季节性养护建议</h3>
              </div>
              <div class="seasonal-suggestions">
                <el-row :gutter="20">
                  <el-col :span="6" v-for="season in seasonalAnalysis" :key="season.season">
                    <div class="season-card" :style="{ borderTopColor: getSeasonColor(season.season) }">
                      <div class="season-header">
                        <span class="season-emoji">{{ getSeasonEmoji(season.season) }}</span>
                        <span class="season-label">{{ season.seasonLabel }}</span>
                      </div>
                      <div class="season-stats">
                        <div class="stat-item">
                          <span class="stat-value">{{ season.waterCount }}</span>
                          <span class="stat-label">次浇水</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-value">{{ season.fertilizeCount }}</span>
                          <span class="stat-label">次施肥</span>
                        </div>
                      </div>
                      <ul class="suggestion-list">
                        <li v-for="(sug, idx) in season.suggestions.slice(0, 3)" :key="idx">
                          {{ sug }}
                        </li>
                      </ul>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无足够数据进行季节性分析" />
        </el-tab-pane>

        <el-tab-pane label="健康度分析" name="health">
          <div v-if="healthAnalysis.length > 0">
            <div class="plant-selector">
              <el-select v-model="selectedHealthPlant" placeholder="选择植物" style="width: 200px;">
                <el-option
                  v-for="h in healthAnalysis"
                  :key="h.plantId"
                  :label="h.plantName"
                  :value="h.plantId"
                />
              </el-select>
            </div>
            <div v-if="selectedHealthData">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="section-card health-score-card">
                    <div class="health-score-circle">
                      <svg viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#EDE7D9" stroke-width="8" />
                        <circle
                          cx="60" cy="60" r="54" fill="none"
                          :stroke="getHealthScoreColor(selectedHealthData.overallScore)"
                          stroke-width="8"
                          stroke-linecap="round"
                          :stroke-dasharray="`${selectedHealthData.overallScore * 3.39} 339`"
                          transform="rotate(-90 60 60)"
                        />
                      </svg>
                      <div class="health-score-text">
                        <span class="score-value">{{ selectedHealthData.overallScore }}</span>
                        <span class="score-label">综合健康分</span>
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="16">
                  <div class="section-card">
                    <div class="chart-header">
                      <h3 class="chart-title">健康度雷达图</h3>
                      <el-button size="small" @click="exportChart('healthRadar')">
                        <el-icon><Download /></el-icon>
                        导出图片
                      </el-button>
                    </div>
                    <div class="chart-container">
                      <v-chart ref="healthRadarChartRef" :option="healthRadarOption" autoresize style="height: 350px" />
                    </div>
                  </div>
                </el-col>
              </el-row>
              <div class="section-card" style="margin-top: 20px;">
                <h3 class="chart-title">各维度详情</h3>
                <div class="health-dimensions">
                  <div class="dimension-item" v-for="dim in selectedHealthData.dimensions" :key="dim.name">
                    <div class="dimension-header">
                      <span class="dimension-label">{{ dim.label }}</span>
                      <span class="dimension-value" :style="{ color: getHealthScoreColor(dim.value) }">
                        {{ dim.value }}/{{ dim.maxValue }}
                      </span>
                    </div>
                    <div class="dimension-bar">
                      <div
                        class="dimension-bar-fill"
                        :style="{
                          width: `${(dim.value / dim.maxValue) * 100}%`,
                          backgroundColor: getHealthScoreColor(dim.value)
                        }"
                      />
                    </div>
                    <div class="dimension-desc">{{ dim.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无足够数据进行健康度分析" />
        </el-tab-pane>

        <el-tab-pane label="基础统计" name="basic">
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

          <div v-if="totalDiary > 0" style="margin-top: 20px;">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="section-card">
                  <h3 class="chart-title">日记心情分布</h3>
                  <div class="chart-container">
                    <v-chart :option="diaryMoodOption" autoresize style="height: 300px" />
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="section-card">
                  <h3 class="chart-title">月度日记统计</h3>
                  <div class="chart-container">
                    <v-chart :option="diaryMonthlyOption" autoresize style="height: 300px" />
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showReportDialog" title="生成自定义报表" width="600px">
      <el-form :model="reportConfig" label-width="100px">
        <el-form-item label="报表标题">
          <el-input v-model="reportConfig.title" placeholder="请输入报表标题" />
        </el-form-item>
        <el-form-item label="选择植物">
          <el-select
            v-model="reportConfig.plantIds"
            multiple
            placeholder="请选择要分析的植物"
            style="width: 100%;"
          >
            <el-option
              v-for="plant in store.plants"
              :key="plant.id"
              :label="plant.name"
              :value="plant.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="reportDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="选择指标">
          <div class="metric-checkboxes">
            <el-checkbox
              v-for="metric in reportConfig.metrics"
              :key="metric.key"
              v-model="metric.enabled"
              :label="metric.key"
            >
              <div class="metric-info">
                <span class="metric-label">{{ metric.label }}</span>
                <span class="metric-desc">{{ metric.description }}</span>
              </div>
            </el-checkbox>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" @click="generateReport">生成报表</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReportResult" title="报表预览" width="900px">
      <div v-if="generatedReport" class="report-preview">
        <div class="report-header">
          <h2>{{ generatedReport.title }}</h2>
          <p class="report-date">生成时间：{{ formatDate(generatedReport.createdAt) }}</p>
        </div>
        <div class="report-sections">
          <div v-for="(section, idx) in generatedReport.sections" :key="idx" class="report-section">
            <h3>{{ section.title }}</h3>
            <div v-if="section.type === 'text'" class="text-content">
              <div class="stat-grid">
                <div class="stat-item" v-for="(value, key) in section.content" :key="String(key)">
                  <span class="stat-label">{{ getStatLabel(String(key)) }}</span>
                  <span class="stat-value">{{ value }}</span>
                </div>
              </div>
            </div>
            <div v-else-if="section.type === 'table'" class="table-content">
              <el-table :data="[section.content]" border>
                <el-table-column
                  v-for="(value, key) in section.content"
                  :key="String(key)"
                  :label="getStatLabel(String(key))"
                  :prop="String(key)"
                />
              </el-table>
            </div>
            <div v-else-if="section.type === 'chart'" class="chart-content">
              <el-empty description="图表内容请在统计页面查看" />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportReport">导出报表</el-button>
        <el-button type="primary" @click="showReportResult = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  moodLabel, moodColor, moodEmoji,
  exportChartAsImage, getSeasonColor, getSeasonEmoji,
  getDefaultReportMetrics, formatDate
} from '@/utils'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, RadarComponent, DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { ECharts } from 'echarts'
import type { CustomReportConfig, CustomReport } from '@/types'
import { ElMessage } from 'element-plus'

use([
  CanvasRenderer, PieChart, BarChart, LineChart, RadarChart,
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, RadarComponent, DataZoomComponent
])

const store = useAppStore()

const activeTab = ref('growth')
const growthChartRef = ref()
const waterFrequencyChartRef = ref()
const fertilizeFrequencyChartRef = ref()
const intervalChartRef = ref()
const seasonalActivityChartRef = ref()
const seasonalIntervalChartRef = ref()
const healthRadarChartRef = ref()

const selectedGrowthPlant = ref('')
const selectedFrequencyPlant = ref('')
const selectedHealthPlant = ref('')

const showReportDialog = ref(false)
const showReportResult = ref(false)
const generatedReport = ref<CustomReport | null>(null)
const reportDateRange = ref<string[]>([])

const reportConfig = ref<CustomReportConfig>({
  title: '植物养护分析报表',
  plantIds: [],
  metrics: getDefaultReportMetrics(),
  dateRange: {
    start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  includeCharts: true,
  includeRawData: false
})

const totalPlants = computed(() => store.plants.length)
const waterRecords = computed(() => store.careRecords.filter(r => r.type === 'water').length)
const fertilizeRecords = computed(() => store.careRecords.filter(r => r.type === 'fertilize').length)
const totalPhotos = computed(() => store.photos.length)
const totalDiary = computed(() => store.diaryEntries.length)
const diaryStreak = computed(() => store.getDiaryStreak)

const topMoodLabel = computed(() => {
  const stats = store.getDiaryMoodStats()
  const entries = Object.entries(stats)
  if (entries.length === 0) return '-'
  entries.sort((a, b) => b[1] - a[1])
  return moodLabel(entries[0][0])
})

const growthData = computed(() => store.growthData)
const growthPlants = computed(() => store.growthData)

const careFrequencyData = computed(() => store.careFrequencyData)
const seasonalAnalysis = computed(() => store.seasonalAnalyses)
const healthAnalysis = computed(() => store.healthAnalyses)

watch(() => store.plants, () => {
  if (growthPlants.value.length > 0 && !selectedGrowthPlant.value) {
    selectedGrowthPlant.value = growthPlants.value[0].plantId
  }
  if (careFrequencyData.value.length > 0 && !selectedFrequencyPlant.value) {
    selectedFrequencyPlant.value = careFrequencyData.value[0].plantId
  }
  if (healthAnalysis.value.length > 0 && !selectedHealthPlant.value) {
    selectedHealthPlant.value = healthAnalysis.value[0].plantId
  }
  if (store.plants.length > 0 && reportConfig.value.plantIds.length === 0) {
    reportConfig.value.plantIds = store.plants.map(p => p.id)
  }
}, { immediate: true })

const selectedGrowthData = computed(() =>
  growthData.value.find(g => g.plantId === selectedGrowthPlant.value)
)

const selectedFrequencyData = computed(() =>
  careFrequencyData.value.find(c => c.plantId === selectedFrequencyPlant.value)
)

const selectedHealthData = computed(() =>
  healthAnalysis.value.find(h => h.plantId === selectedHealthPlant.value)
)

const growthTrendOption = computed(() => {
  if (!selectedGrowthData.value) return {}
  const data = selectedGrowthData.value.data
  const dates = data.map(d => d.date)
  const heights = data.map(d => d.height)
  const leafCounts = data.map(d => d.leafCount)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['株高(cm)', '叶片数'],
      textStyle: { color: '#8B7355' }
    },
    grid: {
      left: '3%', right: '4%', bottom: '3%', containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#8B7355', rotate: 30 },
      axisLine: { lineStyle: { color: '#EDE7D9' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '株高(cm)',
        position: 'left',
        axisLabel: { color: '#8B7355' },
        splitLine: { lineStyle: { color: '#EDE7D9' } }
      },
      {
        type: 'value',
        name: '叶片数',
        position: 'right',
        axisLabel: { color: '#8B7355' },
        splitLine: { show: false }
      }
    ],
    dataZoom: [
      { type: 'inside', start: 0, end: 100 }
    ],
    series: [
      {
        name: '株高(cm)',
        type: 'line',
        smooth: true,
        data: heights,
        yAxisIndex: 0,
        lineStyle: { color: '#6B8E5A', width: 3 },
        itemStyle: { color: '#6B8E5A' },
        areaStyle: { color: 'rgba(107,142,90,0.15)' }
      },
      {
        name: '叶片数',
        type: 'line',
        smooth: true,
        data: leafCounts,
        yAxisIndex: 1,
        lineStyle: { color: '#5B9BD5', width: 3 },
        itemStyle: { color: '#5B9BD5' },
        areaStyle: { color: 'rgba(91,155,213,0.15)' }
      }
    ]
  }
})

const growthRateOption = computed(() => {
  if (!selectedGrowthData.value) return {}
  const data = selectedGrowthData.value.data.filter(d => d.growthRate != null)
  const dates = data.map(d => d.date)
  const rates = data.map(d => d.growthRate)

  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>生长速率: {c} cm/天'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#8B7355', rotate: 30, fontSize: 10 },
      axisLine: { lineStyle: { color: '#EDE7D9' } }
    },
    yAxis: {
      type: 'value',
      name: 'cm/天',
      axisLabel: { color: '#8B7355' },
      splitLine: { lineStyle: { color: '#EDE7D9' } }
    },
    series: [{
      type: 'bar',
      data: rates,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#8FA978' }, { offset: 1, color: '#6B8E5A' }]
        }
      }
    }]
  }
})

const leafCountOption = computed(() => {
  if (!selectedGrowthData.value) return {}
  const data = selectedGrowthData.value.data.filter(d => d.leafCount != null)
  const dates = data.map(d => d.date)
  const leafCounts = data.map(d => d.leafCount)

  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#8B7355', rotate: 30, fontSize: 10 },
      axisLine: { lineStyle: { color: '#EDE7D9' } }
    },
    yAxis: {
      type: 'value',
      name: '叶片数',
      axisLabel: { color: '#8B7355' },
      splitLine: { lineStyle: { color: '#EDE7D9' } }
    },
    series: [{
      type: 'bar',
      data: leafCounts,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#5B9BD5' }, { offset: 1, color: '#7EC8E3' }]
        }
      }
    }]
  }
})

const waterFrequencyOption = computed(() => {
  if (!selectedFrequencyData.value) return {}
  const data = selectedFrequencyData.value.data
  const dates = data.map(d => d.date.slice(5))
  const counts = data.map(d => d.waterCount)

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['浇水次数'], textStyle: { color: '#8B7355' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#8B7355', rotate: 45, fontSize: 9 },
      axisLine: { lineStyle: { color: '#EDE7D9' } }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#8B7355' },
      splitLine: { lineStyle: { color: '#EDE7D9' } }
    },
    dataZoom: [{ type: 'inside', start: 0, end: 100 }],
    series: [{
      name: '浇水次数',
      type: 'bar',
      data: counts,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#5B9BD5' }, { offset: 1, color: '#7EC8E3' }]
        }
      }
    }]
  }
})

const fertilizeFrequencyOption = computed(() => {
  if (!selectedFrequencyData.value) return {}
  const data = selectedFrequencyData.value.data
  const dates = data.map(d => d.date.slice(5))
  const counts = data.map(d => d.fertilizeCount)

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['施肥次数'], textStyle: { color: '#8B7355' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#8B7355', rotate: 45, fontSize: 9 },
      axisLine: { lineStyle: { color: '#EDE7D9' } }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#8B7355' },
      splitLine: { lineStyle: { color: '#EDE7D9' } }
    },
    dataZoom: [{ type: 'inside', start: 0, end: 100 }],
    series: [{
      name: '施肥次数',
      type: 'bar',
      data: counts,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#8FA978' }, { offset: 1, color: '#6B8E5A' }]
        }
      }
    }]
  }
})

const intervalTrendOption = computed(() => {
  if (!selectedFrequencyData.value) return {}
  const plant = store.plants.find(p => p.id === selectedFrequencyPlant.value)
  const data = selectedFrequencyData.value.data
  const dates = data.map(d => d.date.slice(5))
  const waterIntervals = data.map(d => d.rollingWaterInterval || null)
  const fertilizeIntervals = data.map(d => d.rollingFertilizeInterval || null)

  const series: any[] = []
  if (waterIntervals.some(v => v !== null)) {
    series.push({
      name: '浇水间隔(天)',
      type: 'line',
      smooth: true,
      data: waterIntervals,
      lineStyle: { color: '#5B9BD5', width: 3 },
      itemStyle: { color: '#5B9BD5' },
      markLine: {
        silent: true,
        data: [{ yAxis: plant?.wateringInterval || 7, name: '建议间隔' }],
        lineStyle: { color: '#5B9BD5', type: 'dashed' }
      }
    })
  }
  if (fertilizeIntervals.some(v => v !== null)) {
    series.push({
      name: '施肥间隔(天)',
      type: 'line',
      smooth: true,
      data: fertilizeIntervals,
      lineStyle: { color: '#8FA978', width: 3 },
      itemStyle: { color: '#8FA978' },
      markLine: {
        silent: true,
        data: [{ yAxis: plant?.fertilizingInterval || 30, name: '建议间隔' }],
        lineStyle: { color: '#8FA978', type: 'dashed' }
      }
    })
  }

  return {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['浇水间隔(天)', '施肥间隔(天)'],
      textStyle: { color: '#8B7355' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#8B7355', rotate: 45, fontSize: 9 },
      axisLine: { lineStyle: { color: '#EDE7D9' } }
    },
    yAxis: {
      type: 'value',
      name: '间隔(天)',
      axisLabel: { color: '#8B7355' },
      splitLine: { lineStyle: { color: '#EDE7D9' } }
    },
    dataZoom: [{ type: 'inside', start: 0, end: 100 }],
    series
  }
})

const seasonalActivityOption = computed(() => {
  const seasons = seasonalAnalysis.value.map(s => s.seasonLabel + ' ' + getSeasonEmoji(s.season))
  const waterCounts = seasonalAnalysis.value.map(s => s.waterCount)
  const fertilizeCounts = seasonalAnalysis.value.map(s => s.fertilizeCount)
  const pruneCounts = seasonalAnalysis.value.map(s => s.pruneCount)
  const repotCounts = seasonalAnalysis.value.map(s => s.repotCount)

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['浇水', '施肥', '修剪', '换盆'],
      textStyle: { color: '#8B7355' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: seasons,
      axisLabel: { color: '#8B7355' },
      axisLine: { lineStyle: { color: '#EDE7D9' } }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#8B7355' },
      splitLine: { lineStyle: { color: '#EDE7D9' } }
    },
    series: [
      {
        name: '浇水', type: 'bar', stack: 'total', data: waterCounts,
        itemStyle: { color: '#5B9BD5' }
      },
      {
        name: '施肥', type: 'bar', stack: 'total', data: fertilizeCounts,
        itemStyle: { color: '#8FA978' }
      },
      {
        name: '修剪', type: 'bar', stack: 'total', data: pruneCounts,
        itemStyle: { color: '#E8B4B8' }
      },
      {
        name: '换盆', type: 'bar', stack: 'total', data: repotCounts,
        itemStyle: { color: '#8B7355' }
      }
    ]
  }
})

const seasonalIntervalOption = computed(() => {
  const seasons = seasonalAnalysis.value.map(s => s.seasonLabel + ' ' + getSeasonEmoji(s.season))
  const waterIntervals = seasonalAnalysis.value.map(s => s.averageWaterInterval || 0)
  const fertilizeIntervals = seasonalAnalysis.value.map(s => s.averageFertilizeInterval || 0)

  return {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['平均浇水间隔(天)', '平均施肥间隔(天)'],
      textStyle: { color: '#8B7355' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: seasons,
      axisLabel: { color: '#8B7355' },
      axisLine: { lineStyle: { color: '#EDE7D9' } }
    },
    yAxis: {
      type: 'value',
      name: '间隔(天)',
      axisLabel: { color: '#8B7355' },
      splitLine: { lineStyle: { color: '#EDE7D9' } }
    },
    series: [
      {
        name: '平均浇水间隔(天)',
        type: 'bar',
        data: waterIntervals,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#5B9BD5' }, { offset: 1, color: '#7EC8E3' }]
          }
        }
      },
      {
        name: '平均施肥间隔(天)',
        type: 'bar',
        data: fertilizeIntervals,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#8FA978' }, { offset: 1, color: '#7CB342' }]
          }
        }
      }
    ]
  }
})

const healthRadarOption = computed(() => {
  if (!selectedHealthData.value) return {}
  const dimensions = selectedHealthData.value.dimensions
  const indicators = dimensions.map(d => ({
    name: d.label,
    max: d.maxValue
  }))
  const values = dimensions.map(d => d.value)

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        let result = `${params.name}<br/>`
        dimensions.forEach((d, i) => {
          result += `${d.label}: ${params.value[i]}分<br/>`
        })
        return result
      }
    },
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#8B7355' },
      splitLine: { lineStyle: { color: '#EDE7D9' } },
      splitArea: { areaStyle: { color: ['rgba(107,142,90,0.05)', 'rgba(107,142,90,0.1)'] } },
      axisLine: { lineStyle: { color: '#EDE7D9' } }
    },
    series: [{
      name: '健康度分析',
      type: 'radar',
      data: [{
        value: values,
        name: selectedHealthData.value.plantName,
        areaStyle: { color: 'rgba(107,142,90,0.3)' },
        lineStyle: { color: '#6B8E5A', width: 2 },
        itemStyle: { color: '#6B8E5A' }
      }]
    }]
  }
})

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

const diaryMoodOption = computed(() => {
  const stats = store.getDiaryMoodStats()
  const data = Object.entries(stats).map(([key, value]) => ({
    name: moodLabel(key) + ' ' + moodEmoji(key),
    value: value as number,
    itemStyle: { color: moodColor(key) }
  }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}篇 ({d}%)' },
    legend: { bottom: '0', textStyle: { color: '#8B7355' }, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: { borderRadius: 8, borderColor: '#FAF8F3', borderWidth: 3 },
      label: { color: '#6B5344', fontSize: 12 },
      data,
    }]
  }
})

const diaryMonthlyOption = computed(() => {
  const year = new Date().getFullYear()
  const monthlyData = store.getDiaryMonthlyStats(year)
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: '#8B7355' },
      axisLine: { lineStyle: { color: '#EDE7D9' } }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#8B7355' },
      splitLine: { lineStyle: { color: '#EDE7D9' } }
    },
    series: [{
      type: 'bar',
      data: monthlyData,
      barWidth: '50%',
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#F4D03F' }, { offset: 1, color: '#F39C12' }]
        }
      }
    }]
  }
})

const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#6B8E5A'
  if (score >= 60) return '#F4D03F'
  if (score >= 40) return '#F39C12'
  return '#E74C3C'
}

const getStatLabel = (key: string): string => {
  const map: Record<string, string> = {
    totalPlants: '植物总数',
    healthyPlants: '茁壮成长',
    needsCarePlants: '需要照料',
    sickPlants: '状态不佳',
    dormantPlants: '休眠期',
    totalRecords: '记录总数',
    waterCount: '浇水次数',
    fertilizeCount: '施肥次数',
    pruneCount: '修剪次数',
    repotCount: '换盆次数',
    totalCareDays: '养护天数',
    currentStreak: '当前连续',
    longestStreak: '最长连续',
    completedReminders: '完成提醒',
    missedReminders: '错过提醒',
    totalDiaries: '日记总数'
  }
  return map[key] || key
}

const exportChart = (chartType: string) => {
  const chartRefs: Record<string, { value?: { getEchartsInstance?: () => ECharts } }> = {
    growth: growthChartRef,
    waterFrequency: waterFrequencyChartRef,
    fertilizeFrequency: fertilizeFrequencyChartRef,
    interval: intervalChartRef,
    seasonalActivity: seasonalActivityChartRef,
    seasonalInterval: seasonalIntervalChartRef,
    healthRadar: healthRadarChartRef
  }

  const ref = chartRefs[chartType]
  if (ref?.value?.getEchartsInstance) {
    const chart = ref.value.getEchartsInstance()
    exportChartAsImage(chart, chartType)
    ElMessage.success('图片导出成功')
  } else {
    ElMessage.error('图表未初始化完成，请稍后重试')
  }
}

const generateReport = () => {
  if (reportDateRange.value && reportDateRange.value.length === 2) {
    reportConfig.value.dateRange.start = reportDateRange.value[0]
    reportConfig.value.dateRange.end = reportDateRange.value[1]
  }

  if (reportConfig.value.plantIds.length === 0) {
    ElMessage.warning('请至少选择一棵植物')
    return
  }

  const enabledMetrics = reportConfig.value.metrics.filter(m => m.enabled)
  if (enabledMetrics.length === 0) {
    ElMessage.warning('请至少选择一个分析指标')
    return
  }

  generatedReport.value = store.generateCustomReport(reportConfig.value)
  showReportDialog.value = false
  showReportResult.value = true
  ElMessage.success('报表生成成功')
}

const exportReport = () => {
  if (!generatedReport.value) return

  const content = JSON.stringify(generatedReport.value, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${generatedReport.value.title}_${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报表导出成功')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.statistics-page {
  .page-header {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: $brown-dark;
      display: flex;
      align-items: center;
      gap: 12px;

      .title-icon {
        color: $forest-green;
        font-size: 28px;
      }
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

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(107, 142, 90, 0.12);
    }

    .overview-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;
    }

    .overview-info {
      .overview-value {
        font-size: 28px;
        font-weight: 700;
        color: $brown-dark;
      }

      .overview-label {
        font-size: 14px;
        color: $brown-light;
      }
    }
  }

  .chart-title {
    font-size: 16px;
    font-weight: 600;
    color: $brown-dark;
    margin-bottom: 16px;
  }

  .diary-stat-card {
    margin-bottom: 0;
  }

  .section-tabs {
    margin-top: 20px;

    :deep(.el-tabs__item) {
      color: $brown-light;
    }

    :deep(.el-tabs__item.is-active) {
      color: $forest-green;
    }

    :deep(.el-tabs__active-bar) {
      background-color: $forest-green;
    }
  }

  .plant-selector {
    margin-bottom: 20px;
  }

  .section-card {
    background: $cream-light;
    border: 1px solid $cream-dark;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 0;

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .chart-title {
        margin-bottom: 0;
      }
    }
  }

  .seasonal-suggestions {
    .season-card {
      background: $cream-light;
      border: 1px solid $cream-dark;
      border-top: 4px solid;
      border-radius: 12px;
      padding: 16px;
      height: 100%;

      .season-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .season-emoji {
          font-size: 24px;
        }

        .season-label {
          font-size: 18px;
          font-weight: 600;
          color: $brown-dark;
        }
      }

      .season-stats {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px dashed $cream-dark;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;

          .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: $forest-green;
          }

          .stat-label {
            font-size: 12px;
            color: $brown-light;
          }
        }
      }

      .suggestion-list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          font-size: 13px;
          color: $brown-light;
          padding-left: 16px;
          position: relative;
          margin-bottom: 8px;
          line-height: 1.5;

          &::before {
            content: '•';
            position: absolute;
            left: 0;
            color: $forest-green;
            font-weight: bold;
          }
        }
      }
    }
  }

  .health-score-card {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 350px;

    .health-score-circle {
      position: relative;
      width: 200px;
      height: 200px;

      svg {
        width: 100%;
        height: 100%;
        transform: rotate(0deg);
      }

      .health-score-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;

        .score-value {
          display: block;
          font-size: 48px;
          font-weight: 700;
          color: $brown-dark;
          line-height: 1;
        }

        .score-label {
          display: block;
          font-size: 14px;
          color: $brown-light;
          margin-top: 8px;
        }
      }
    }
  }

  .health-dimensions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    .dimension-item {
      .dimension-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .dimension-label {
          font-size: 14px;
          font-weight: 600;
          color: $brown-dark;
        }

        .dimension-value {
          font-size: 14px;
          font-weight: 700;
        }
      }

      .dimension-bar {
        height: 8px;
        background: $cream-dark;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 6px;

        .dimension-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
      }

      .dimension-desc {
        font-size: 12px;
        color: $brown-light;
      }
    }
  }

  .metric-checkboxes {
    :deep(.el-checkbox) {
      display: block;
      margin-bottom: 12px;

      .metric-info {
        display: flex;
        flex-direction: column;

        .metric-label {
          font-size: 14px;
          color: $brown-dark;
          font-weight: 500;
        }

        .metric-desc {
          font-size: 12px;
          color: $brown-light;
          margin-top: 2px;
        }
      }
    }
  }

  .report-preview {
    .report-header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid $cream-dark;
      margin-bottom: 20px;

      h2 {
        margin: 0 0 8px 0;
        color: $brown-dark;
      }

      .report-date {
        margin: 0;
        color: $brown-light;
        font-size: 14px;
      }
    }

    .report-sections {
      .report-section {
        margin-bottom: 24px;

        h3 {
          color: $forest-green;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid $cream-dark;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;

          .stat-item {
            background: $cream-light;
            padding: 16px;
            border-radius: 8px;
            text-align: center;

            .stat-label {
              display: block;
              font-size: 13px;
              color: $brown-light;
              margin-bottom: 6px;
            }

            .stat-value {
              font-size: 24px;
              font-weight: 700;
              color: $forest-green;
            }
          }
        }

        .table-content {
          :deep(.el-table) {
            background: $cream-light;
          }

          :deep(.el-table th) {
            background: $cream-dark;
            color: $brown-dark;
          }

          :deep(.el-table td) {
            background: $cream-light;
            color: $brown-light;
          }
        }

        .chart-content {
          padding: 20px;
        }
      }
    }
  }
}
</style>