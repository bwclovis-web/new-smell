import React, { useEffect, useState } from 'react'

import { analyzeBundle, getOptimizationRecommendations } from '~/utils/bundleSplitting'

interface PerformanceMonitorProps {
  enabled?: boolean
  showInConsole?: boolean
  showUI?: boolean
  className?: string
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  showInConsole = true,
  showUI = false,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])

  useEffect(() => {
    if (!enabled) {
 return 
}

    const collectMetrics = () => {
      const bundleAnalysis = analyzeBundle()
      if (bundleAnalysis) {
        setMetrics(bundleAnalysis)

        const recs = getOptimizationRecommendations(bundleAnalysis)
        setRecommendations(recs)

        if (showInConsole) {
          console.group('📊 Bundle Performance Analysis')
          console.log('Timing Metrics:', bundleAnalysis.timing)
          console.log('Resource Count:', bundleAnalysis.resources.length)
          console.log('Memory Usage:', bundleAnalysis.memory)

          if (recs.length > 0) {
            console.group('💡 Optimization Recommendations')
            recs.forEach((rec, index) => {
              console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`)
            })
            console.groupEnd()
          }
          console.groupEnd()
        }
      }
    }

    // Collect metrics after page load
    const timer = setTimeout(collectMetrics, 2000)

    return () => clearTimeout(timer)
  }, [enabled, showInConsole])

  if (!enabled || !showUI || !metrics) {
 return null 
}

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Bundle Performance</h3>

      <div className="space-y-2 text-xs">
        <div>
          <span className="text-gray-600">FCP:</span>
          <span className="ml-2 font-mono">
            {metrics.timing.firstContentfulPaint.toFixed(0)}ms
          </span>
        </div>

        <div>
          <span className="text-gray-600">LCP:</span>
          <span className="ml-2 font-mono">
            {metrics.timing.largestContentfulPaint.toFixed(0)}ms
          </span>
        </div>

        <div>
          <span className="text-gray-600">Resources:</span>
          <span className="ml-2 font-mono">
            {metrics.resources.length}
          </span>
        </div>

        {metrics.memory && (
          <div>
            <span className="text-gray-600">Memory:</span>
            <span className="ml-2 font-mono">
              {Math.round(metrics.memory.used / 1024 / 1024)}MB
            </span>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-1">Recommendations</h4>
          <div className="space-y-1">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="text-xs text-gray-600">
                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${rec.priority === 'high' ? 'bg-red-500' :
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                {rec.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor
