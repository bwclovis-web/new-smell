import React, { type FC } from 'react'

import AdminCSVControls from './components/AdminCSVControls'
import DashboardContent from './components/DashboardContent'
import ErrorDisplay from './components/ErrorDisplay'
import LoadingIndicator from './components/LoadingIndicator'
import { type DataQualityStats } from './utils/chartDataUtils'

interface DataQualityDashboardProps {
  user?: any
  isAdmin?: boolean
}

// Mock hook for now - this should be replaced with the actual hook
const useFetchDataQualityStats = (timeframe: 'week' | 'month' | 'all') => {
  // This is a placeholder - replace with actual implementation
  return {
    stats: null as DataQualityStats | null,
    loading: false,
    error: null as string | null,
    setLastFetch: (value: number) => { }
  }
}

const DataQualityDashboard: FC<DataQualityDashboardProps> = ({ user, isAdmin }) => {
  const [timeframe, setTimeframe] = React.useState<'week' | 'month' | 'all'>('month')
  const { stats, loading, error, setLastFetch } = useFetchDataQualityStats(timeframe)

  const handleUploadComplete = () => {
    // Force refresh by updating lastFetch to 0
    setLastFetch(0)
  }

  // Render component based on loading/error state
  if (loading) {
    return <LoadingIndicator />
  }

  if (error) {
    return <ErrorDisplay message={error} />
  }

  if (!stats) {
    return <div>No data available.</div>
  }

  return (
    <>
      {isAdmin && <AdminCSVControls onUploadComplete={handleUploadComplete} />}
      <DashboardContent
        stats={stats}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
      />
    </>
  )
}

export default DataQualityDashboard
