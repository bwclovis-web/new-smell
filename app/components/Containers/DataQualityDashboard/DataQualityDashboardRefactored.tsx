// Import to ensure Chart.js is registered
import './utils/chartSetup'

import React, { type FC } from 'react'

import AdminCSVControls from './components/AdminCSVControls'
import DashboardContent from './components/DashboardContent'
import ErrorDisplay from './components/ErrorDisplay'
import LoadingIndicator from './components/LoadingIndicator'
import { useFetchDataQualityStats } from './hooks'

interface DataQualityDashboardProps {
  user?: any
  isAdmin?: boolean
}

const DataQualityDashboard: FC<DataQualityDashboardProps> = ({ user, isAdmin }) => {
  const [timeframe, setTimeframe] = React.useState<'week' | 'month' | 'all'>('month')
  const { stats, loading, error, forceRefresh } = useFetchDataQualityStats(timeframe)

  const handleUploadComplete = () => {
    // Force refresh with force=true to regenerate reports immediately
    forceRefresh(true)
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
