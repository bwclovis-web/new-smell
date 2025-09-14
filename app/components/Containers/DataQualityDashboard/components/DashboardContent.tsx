import { type FC } from 'react'

import ChartVisualizations from './ChartVisualizations'
import SummaryStats from './SummaryStats'
import TimeframeSelector from './TimeframeSelector'
import TrendChart from './TrendChart'
import { type DataQualityStats } from '../utils/chartDataUtils'
import { createChartConfig } from '../utils/chartConfig'
import { prepareAllChartData } from '../utils/chartDataUtils'

interface DashboardContentProps {
  stats: DataQualityStats
  timeframe: 'week' | 'month' | 'all'
  setTimeframe: React.Dispatch<React.SetStateAction<'week' | 'month' | 'all'>>
}

const DashboardContent: FC<DashboardContentProps> = ({
  stats,
  timeframe,
  setTimeframe
}) => {
  // Get chart configuration and data
  const chartOptions = createChartConfig()
  const chartData = prepareAllChartData(stats)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Perfume Data Quality Dashboard</h2>

      {/* Timeframe Selector */}
      <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />

      {/* Summary Stats */}
      <SummaryStats stats={stats} />

      {/* Chart Visualizations */}
      <ChartVisualizations
        missingChartData={chartData.missingChartData}
        duplicateChartData={chartData.duplicateChartData}
        missingHouseInfoChartData={chartData.missingHouseInfoChartData}
        chartOptions={chartOptions}
        missingHouseInfoBreakdown={chartData.missingHouseInfoBreakdown}
      />

      {/* Trend Chart */}
      <TrendChart trendChartData={chartData.trendChartData} />

      {/* Last Updated */}
      <div className="mt-8 text-right text-sm text-gray-500">
        Last updated: {stats.lastUpdated}
      </div>
    </div>
  )
}

export default DashboardContent
