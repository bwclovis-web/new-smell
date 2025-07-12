import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import React, { useEffect, useState } from 'react'
import { Bar, Line } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

type DataQualityStats = {
  totalMissing: number
  totalDuplicates: number
  missingByBrand: Record<string, number>
  duplicatesByBrand: Record<string, number>
  lastUpdated: string
  historyData?: {
    dates: string[]
    missing: number[]
    duplicates: number[]
  }
}

// Helper functions for chart data preparation
const prepareMissingChartData = (stats: DataQualityStats | null) => ({
  labels: stats ? Object.keys(stats.missingByBrand).slice(0, 10) : [],
  datasets: [
    {
      label: 'Missing Information',
      data: stats ? Object.values(stats.missingByBrand).slice(0, 10) : [],
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 1,
    },
  ],
})

const prepareDuplicateChartData = (stats: DataQualityStats | null) => ({
  labels: stats ? Object.keys(stats.duplicatesByBrand).slice(0, 10) : [],
  datasets: [
    {
      label: 'Duplicate Entries',
      data: stats ? Object.values(stats.duplicatesByBrand).slice(0, 10) : [],
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
      borderColor: 'rgb(53, 162, 235)',
      borderWidth: 1,
    },
  ],
})

const prepareTrendChartData = (stats: DataQualityStats | null) => {
  if (!stats?.historyData) {
    return {
      labels: [],
      datasets: []
    }
  }

  return {
    labels: stats.historyData.dates || [],
    datasets: [
      {
        label: 'Missing Information',
        data: stats.historyData.missing || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
      },
      {
        label: 'Duplicate Entries',
        data: stats.historyData.duplicates || [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1,
      },
    ],
  }
}

// Component functions to render dashboard sections
// These component declarations have been removed as they're not being used directly
// in the DataQualityDashboard component.

// Helper functions to render dashboard sections
const renderSummaryStats = (stats: DataQualityStats) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-red-800">Missing Information</h3>
      <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalMissing}</p>
      <p className="text-sm text-red-700 mt-1">Entries missing descriptions or notes</p>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-blue-800">Duplicate Entries</h3>
      <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalDuplicates}</p>
      <p className="text-sm text-blue-700 mt-1">Perfumes with multiple entries</p>
    </div>
  </div>
)

const renderChartVisualizations = (
  missingChartData: any,
  duplicateChartData: any,
  chartOptions: any
) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Top Brands with Missing Data</h3>
      <Bar options={chartOptions} data={missingChartData} />
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Top Brands with Duplicates</h3>
      <Bar options={chartOptions} data={duplicateChartData} />
    </div>
  </div>
)

const renderTrendChart = (trendChartData: any) => (
  <div className="bg-gray-50 rounded-lg p-4 mb-8">
    <h3 className="text-lg font-medium text-gray-800 mb-4">Data Quality Trends</h3>
    <Line
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          title: {
            display: true,
            text: 'Quality Trends Over Time',
          },
        },
      }}
      data={trendChartData}
    />
  </div>
)

const renderTimeframeSelector = (
  timeframe: 'week' | 'month' | 'all',
  setTimeframe: React.Dispatch<React.SetStateAction<'week' | 'month' | 'all'>>
) => (
  <div className="flex justify-end mb-6">
    <div className="inline-flex rounded-md shadow-sm" role="group">
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${timeframe === 'week'
          ? 'bg-gray-800 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        onClick={() => setTimeframe('week')}
      >
        Last Week
      </button>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium ${timeframe === 'month'
          ? 'bg-gray-800 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        onClick={() => setTimeframe('month')}
      >
        Last Month
      </button>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${timeframe === 'all'
          ? 'bg-gray-800 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        onClick={() => setTimeframe('all')}
      >
        All Time
      </button>
    </div>
  </div>
)

// Main dashboard content component
const DashboardContent = ({
  stats,
  timeframe,
  setTimeframe,
  chartOptions,
  missingChartData,
  duplicateChartData,
  trendChartData
}: {
  stats: DataQualityStats;
  timeframe: 'week' | 'month' | 'all';
  setTimeframe: React.Dispatch<React.SetStateAction<'week' | 'month' | 'all'>>;
  chartOptions: any;
  missingChartData: any;
  duplicateChartData: any;
  trendChartData: any;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Perfume Data Quality Dashboard</h2>

    {/* Timeframe Selector */}
    {renderTimeframeSelector(timeframe, setTimeframe)}

    {/* Summary Stats */}
    {renderSummaryStats(stats)}

    {/* Chart Visualizations */}
    {renderChartVisualizations(missingChartData, duplicateChartData, chartOptions)}

    {/* Trend Chart */}
    {renderTrendChart(trendChartData)}

    {/* Last Updated */}
    <div className="mt-8 text-right text-sm text-gray-500">
      Last updated: {stats.lastUpdated}
    </div>
  </div>
)

// Check if we should skip the fetch due to debouncing
const shouldSkipFetch = (lastFetch: number): boolean => {
  const now = Date.now()
  return now - lastFetch < 5000 // Don't fetch within 5 seconds
}

// Perform the actual API fetch
const performApiFetch = async (
  timeframe: string,
  setStats: React.Dispatch<React.SetStateAction<DataQualityStats | null>>
) => {
  const response = await fetch(`/api/data-quality?timeframe=${timeframe}`)
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }
  const data = await response.json()
  setStats(data)
}

// Fetch data function with debouncing and caching
const useFetchDataQualityStats = (timeframe: 'week' | 'month' | 'all') => {
  const [stats, setStats] = useState<DataQualityStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  useEffect(() => {
    const fetchStats = async () => {
      // Debouncing: Don't fetch if we just fetched within the last 5 seconds
      if (shouldSkipFetch(lastFetch)) {
        return
      }

      setLoading(true)
      setError(null)
      try {
        await performApiFetch(timeframe, setStats)
        setLastFetch(Date.now())
      } catch (err) {
        setError(`Failed to fetch data quality stats: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timeframe, lastFetch])

  return { stats, loading, error }
}

// Loading indicator component
const LoadingIndicator = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-noir-gold"></div>
    <span className="ml-3 text-gray-600">Loading data quality stats...</span>
  </div>
)

// Error display component
const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="rounded-md bg-red-50 p-4">
    <div className="flex">
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <div className="mt-2 text-sm text-red-700">
          <p>{message}</p>
        </div>
      </div>
    </div>
  </div>
)

// Create chart config helper
const createChartConfig = () => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Top Brands with Issues',
    },
  },
})

// Prepare all chart data function
const prepareAllChartData = (stats: DataQualityStats | null) => ({
  missingChartData: prepareMissingChartData(stats),
  duplicateChartData: prepareDuplicateChartData(stats),
  trendChartData: prepareTrendChartData(stats)
})

// Render component based on loading/error state
const renderDashboardState = ({
  loading,
  error,
  stats,
  timeframe,
  setTimeframe
}: {
  loading: boolean;
  error: string | null;
  stats: DataQualityStats | null;
  timeframe: 'week' | 'month' | 'all';
  setTimeframe: React.Dispatch<React.SetStateAction<'week' | 'month' | 'all'>>;
}) => {
  if (loading) {
    return <LoadingIndicator />
  }

  if (error) {
    return <ErrorDisplay message={error} />
  }

  if (!stats) {
    return <div>No data available.</div>
  }

  // Get chart configuration and data
  const chartOptions = createChartConfig()
  const chartData = prepareAllChartData(stats)

  // Render dashboard content
  return (
    <DashboardContent
      stats={stats}
      timeframe={timeframe}
      setTimeframe={setTimeframe}
      chartOptions={chartOptions}
      missingChartData={chartData.missingChartData}
      duplicateChartData={chartData.duplicateChartData}
      trendChartData={chartData.trendChartData}
    />
  )
}

const DataQualityDashboard = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month')
  const { stats, loading, error } = useFetchDataQualityStats(timeframe)

  return renderDashboardState({
    loading,
    error,
    stats,
    timeframe,
    setTimeframe
  })
}

export default DataQualityDashboard
