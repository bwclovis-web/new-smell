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
} from "chart.js"
import React, { type FC, useEffect, useRef, useState } from "react"
import { Bar, Line } from "react-chartjs-2"

import { useCSRFToken } from "~/components/Molecules/CSRFToken"

import { handleDownloadCSV } from "./bones/csvHandlers/csvDownload"
import { createHandleUploadCSV } from "./bones/csvHandlers/csvUploader"

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
  totalHousesNoPerfumes?: number
  missingByBrand: Record<string, number>
  duplicatesByBrand: Record<string, number>
  lastUpdated: string
  historyData?: {
    dates: string[]
    missing: number[]
    duplicates: number[]
  }
  totalMissingHouseInfo?: number
  missingHouseInfoByBrand?: Record<string, number>
  housesNoPerfumes?: Array<{
    id: string
    name: string
    type: string
    createdAt: string
  }>
}

// Helper functions for chart data preparation
// Helper to generate breakdown for missing house info
const getMissingHouseInfoBreakdown = (
  stats: DataQualityStats | null
): Record<string, string[]> => {
  if (!stats || !stats.missingHouseInfoByBrand) {
    return {}
  }
  // This assumes backend returns missingHouseInfoByBrand as { houseName: number }
  // For a more detailed breakdown, backend should return { houseName: [fields] }
  // For now, we infer missing fields by showing count as array of 'Field missing'
  return Object.fromEntries(
    Object.entries(stats.missingHouseInfoByBrand || {}).map(([house, count]) => [
      house,
      Array(count).fill("Field missing"),
    ])
  )
}
const prepareMissingChartData = (stats: DataQualityStats | null) => ({
  labels: stats?.missingByBrand
    ? Object.keys(stats.missingByBrand).slice(0, 10)
    : [],
  datasets: [
    {
      label: "Missing Information",
      data: stats?.missingByBrand
        ? Object.values(stats.missingByBrand).slice(0, 10)
        : [],
      backgroundColor: "rgba(255, 99, 132, 0.5)",
      borderColor: "rgb(255, 99, 132)",
      borderWidth: 1,
    },
  ],
})
const prepareMissingHouseInfoChartData = (stats: DataQualityStats | null) => ({
  labels:
    stats && stats.missingHouseInfoByBrand
      ? Object.keys(stats.missingHouseInfoByBrand).slice(0, 10)
      : [],
  datasets: [
    {
      label: "Missing House Info",
      data:
        stats && stats.missingHouseInfoByBrand
          ? Object.values(stats.missingHouseInfoByBrand).slice(0, 10)
          : [],
      backgroundColor: "rgba(255, 206, 86, 0.5)",
      borderColor: "rgb(255, 206, 86)",
      borderWidth: 1,
    },
  ],
})

const prepareDuplicateChartData = (stats: DataQualityStats | null) => ({
  labels: stats?.duplicatesByBrand
    ? Object.keys(stats.duplicatesByBrand).slice(0, 10)
    : [],
  datasets: [
    {
      label: "Duplicate Entries",
      data: stats?.duplicatesByBrand
        ? Object.values(stats.duplicatesByBrand).slice(0, 10)
        : [],
      backgroundColor: "rgba(53, 162, 235, 0.5)",
      borderColor: "rgb(53, 162, 235)",
      borderWidth: 1,
    },
  ],
})

const prepareTrendChartData = (stats: DataQualityStats | null) => {
  if (!stats?.historyData) {
    return {
      labels: [],
      datasets: [],
    }
  }

  return {
    labels: stats.historyData.dates || [],
    datasets: [
      {
        label: "Missing Information",
        data: stats.historyData.missing || [],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.1,
      },
      {
        label: "Duplicate Entries",
        data: stats.historyData.duplicates || [],
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
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
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-red-800">Missing Information</h3>
      <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalMissing}</p>
      <p className="text-sm text-red-700 mt-1">
        Entries missing descriptions or notes
      </p>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-blue-800">Duplicate Entries</h3>
      <p className="text-3xl font-bold text-blue-600 mt-2">
        {stats.totalDuplicates}
      </p>
      <p className="text-sm text-blue-700 mt-1">Perfumes with multiple entries</p>
    </div>
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-yellow-800">Missing House Info</h3>
      <p className="text-3xl font-bold text-yellow-600 mt-2">
        {stats.totalMissingHouseInfo ?? 0}
      </p>
      <p className="text-sm text-yellow-700 mt-1">
        Perfume houses missing contact info, descriptions, etc.
      </p>
    </div>
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-purple-800">
        Houses With No Perfumes
      </h3>
      <p className="text-3xl font-bold text-purple-600 mt-2">
        {stats.totalHousesNoPerfumes ?? 0}
      </p>
      <p className="text-sm text-purple-700 mt-1">
        Houses with zero perfumes listed
      </p>
    </div>
  </div>
)

const renderChartVisualizations = ({
  missingChartData,
  duplicateChartData,
  missingHouseInfoChartData,
  chartOptions,
  missingHouseInfoBreakdown,
}: {
  missingChartData: any
  duplicateChartData: any
  missingHouseInfoChartData: any
  chartOptions: any
  missingHouseInfoBreakdown?: Record<string, string[]>
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        Top Brands with Missing Data
      </h3>
      <Bar options={chartOptions} data={missingChartData} />
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        Top Brands with Duplicates
      </h3>
      <Bar options={chartOptions} data={duplicateChartData} />
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        Top Houses Missing Info
      </h3>
      <Bar options={chartOptions} data={missingHouseInfoChartData} />
      {/* Breakdown Table for Missing House Info */}
      <>
        {missingHouseInfoBreakdown &&
          Object.keys(missingHouseInfoBreakdown || {}).length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-yellow-800 mb-2">
                Breakdown by House
              </h4>
              <table className="min-w-full text-sm border border-yellow-200 rounded">
                <thead>
                  <tr className="bg-yellow-50">
                    <th className="px-2 py-1 text-left text-yellow-900">House</th>
                    <th className="px-2 py-1 text-left text-yellow-900">
                      Missing Fields
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(missingHouseInfoBreakdown || {}).map(
                    ([house, fields]) => (
                      <tr key={house} className="border-t border-yellow-100">
                        <td className="px-2 py-1 text-yellow-900">{house}</td>
                        <td className="px-2 py-1 text-yellow-700">
                          {fields.length}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </>
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
            position: "top" as const,
          },
          title: {
            display: true,
            text: "Quality Trends Over Time",
          },
        },
      }}
      data={trendChartData}
    />
  </div>
)

const renderTimeframeSelector = (
  timeframe: "week" | "month" | "all",
  setTimeframe: React.Dispatch<React.SetStateAction<"week" | "month" | "all">>
) => (
  <div className="flex justify-end mb-6">
    <div className="inline-flex rounded-md shadow-sm" role="group">
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
          timeframe === "week"
            ? "bg-gray-800 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => setTimeframe("week")}
      >
        Last Week
      </button>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium ${
          timeframe === "month"
            ? "bg-gray-800 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => setTimeframe("month")}
      >
        Last Month
      </button>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
          timeframe === "all"
            ? "bg-gray-800 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => setTimeframe("all")}
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
  missingHouseInfoChartData,
  trendChartData,
  missingHouseInfoBreakdown,
}: {
  stats: DataQualityStats
  timeframe: "week" | "month" | "all"
  setTimeframe: React.Dispatch<React.SetStateAction<"week" | "month" | "all">>
  chartOptions: any
  missingChartData: any
  duplicateChartData: any
  missingHouseInfoChartData: any
  trendChartData: any
  missingHouseInfoBreakdown?: Record<string, string[]>
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Perfume Data Quality Dashboard
    </h2>

    {/* Timeframe Selector */}
    {renderTimeframeSelector(timeframe, setTimeframe)}

    {/* Summary Stats */}
    {renderSummaryStats(stats)}

    {/* Chart Visualizations */}
    {renderChartVisualizations({
      missingChartData,
      duplicateChartData,
      missingHouseInfoChartData,
      chartOptions,
      missingHouseInfoBreakdown,
    })}

    {/* Trend Chart */}
    {renderTrendChart(trendChartData)}

    {/* Houses with Data Issues */}
    {stats.housesNoPerfumes && stats.housesNoPerfumes.length > 0 && (
      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-purple-900 mb-4">
          Houses with No Perfumes ({stats.housesNoPerfumes.length})
        </h3>
        <p className="text-sm text-purple-700 mb-4">
          These perfume houses exist in the database but have no perfumes listed.
        </p>
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-purple-200">
            <thead className="bg-purple-100 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-purple-900 uppercase tracking-wider">
                  House Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-purple-900 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-purple-900 uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-purple-100">
              {stats.housesNoPerfumes.map((house) => (
                <tr key={house.id} className="hover:bg-purple-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {house.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                    {house.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(house.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

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
  setStats: React.Dispatch<React.SetStateAction<DataQualityStats | null>>,
  force: boolean = false
) => {
  // Add cache-busting timestamp to ensure fresh data
  const cacheBuster = Date.now()
  const forceParam = force ? "&force=true" : ""
  const url = `/api/data-quality?timeframe=${timeframe}${forceParam}&_=${cacheBuster}`

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[DATA QUALITY] Error response:", errorText)
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  const data = await response.json()
  setStats(data)
}

// Fetch data function with debouncing and caching
const useFetchDataQualityStats = (timeframe: "week" | "month" | "all") => {
  const [stats, setStats] = useState<DataQualityStats | null>(null)
  const [loading, setLoading] = useState(true) // Start with loading true
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [refreshTrigger, setRefreshTrigger] = useState<{
    count: number
    force: boolean
  }>({ count: 0, force: false })

  useEffect(() => {
    const fetchStats = async () => {
      // Debouncing: Don't fetch if we just fetched within the last 5 seconds
      // BUT always fetch on first load (lastFetch === 0) or when manually triggered
      const isManualRefresh = refreshTrigger.count > 0
      if (lastFetch !== 0 && shouldSkipFetch(lastFetch) && !isManualRefresh) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        // Use force flag when it's a manual refresh
        await performApiFetch(timeframe, setStats, refreshTrigger.force)
        setLastFetch(Date.now())
      } catch (err) {
        setError(
          `Failed to fetch data quality stats: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
        console.error("[DATA QUALITY] Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timeframe, refreshTrigger]) // Only depend on timeframe and manual refresh trigger

  // Expose a function to force refresh
  const forceRefresh = (force: boolean = false) =>
    setRefreshTrigger((prev) => ({ count: prev.count + 1, force }))

  return { stats, loading, error, forceRefresh }
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
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Top Brands with Issues",
    },
  },
})

// Prepare all chart data function
const prepareAllChartData = (stats: DataQualityStats | null) => ({
  missingChartData: prepareMissingChartData(stats),
  duplicateChartData: prepareDuplicateChartData(stats),
  trendChartData: prepareTrendChartData(stats),
  missingHouseInfoChartData: prepareMissingHouseInfoChartData(stats),
  missingHouseInfoBreakdown: getMissingHouseInfoBreakdown(stats),
})

// Render component based on loading/error state
const renderDashboardState = ({
  loading,
  error,
  stats,
  timeframe,
  setTimeframe,
}: {
  loading: boolean
  error: string | null
  stats: DataQualityStats | null
  timeframe: "week" | "month" | "all"
  setTimeframe: React.Dispatch<React.SetStateAction<"week" | "month" | "all">>
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
      missingHouseInfoChartData={chartData.missingHouseInfoChartData}
      trendChartData={chartData.trendChartData}
      missingHouseInfoBreakdown={chartData.missingHouseInfoBreakdown}
    />
  )
}

type DataQualityDashboardProps = {
  user?: { id: string; email: string; role?: string }
  isAdmin?: boolean
}

const DataQualityDashboard: FC<DataQualityDashboardProps> = ({ user, isAdmin }) => {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("month")
  const { stats, loading, error, forceRefresh } = useFetchDataQualityStats(timeframe)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { csrfToken } = useCSRFToken()

  // Create upload handler with CSRF token
  const handleUploadCSV = createHandleUploadCSV(csrfToken)

  // Wrap the upload handler to refresh dashboard after upload
  const handleUploadAndRefresh: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    try {
      await handleUploadCSV(e)
      // Force refresh with force=true to regenerate reports immediately
      forceRefresh(true)
    } catch (err) {
      // Optionally handle error
      // eslint-disable-next-line no-console
      console.error("CSV upload failed", err)
    }
  }

  // Handler for manual refresh button
  const handleManualRefresh = () => {
    forceRefresh(true)
  }

  // Admin controls for CSV
  const renderAdminCSVControls = () => (
    <div className="mb-6 flex gap-4 items-center">
      <button
        className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition-colors"
        onClick={handleDownloadCSV}
      >
        Download House Info CSV
      </button>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleUploadAndRefresh}
      />
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        Upload Edited CSV
      </button>
      <button
        className="px-4 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition-colors"
        onClick={handleManualRefresh}
        disabled={loading}
      >
        {loading ? "Refreshing..." : "Refresh Data"}
      </button>
    </div>
  )

  return (
    <>
      {isAdmin && renderAdminCSVControls()}
      {renderDashboardState({
        loading,
        error,
        stats,
        timeframe,
        setTimeframe,
      })}
    </>
  )
}

export default DataQualityDashboard
