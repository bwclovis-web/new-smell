import React, { useState } from 'react'
import { type MetaFunction } from 'react-router'

import {
  PerformanceDashboard,
  PerformanceAlerts,
  PerformanceOptimizer,
  PerformanceTracer
} from '~/components/Organisms/PerformanceComponents'

export const meta: MetaFunction = () => {
  return [
    { title: 'Performance Demo - Voodoo Perfumes' },
    { name: 'description', content: 'Performance monitoring and optimization components demo' }
  ]
}

const PerformanceDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'optimizer' | 'tracer'>('dashboard')

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', component: PerformanceDashboard },
    { id: 'alerts', name: 'Alerts', component: PerformanceAlerts },
    { id: 'optimizer', name: 'Optimizer', component: PerformanceOptimizer },
    { id: 'tracer', name: 'Tracer', component: PerformanceTracer }
  ] as const

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Components Demo</h1>
          <p className="text-gray-600">
            Comprehensive performance monitoring, alerting, optimization, and tracing tools for web applications.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Component Content */}
        <div className="bg-white rounded-lg shadow">
          {ActiveComponent && (
            <ActiveComponent
              enabled={true}
              showUI={true}
              className="w-full"
            />
          )}
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Usage Instructions</h2>
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">Performance Dashboard</h3>
              <p>Real-time performance metrics including Core Web Vitals, navigation timing, resource usage, and memory consumption.</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Performance Alerts</h3>
              <p>Configurable alerting system that monitors performance thresholds and notifies when metrics exceed acceptable limits.</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Performance Optimizer</h3>
              <p>Automated optimization tools that can apply performance improvements like lazy loading, resource preloading, and code optimization.</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Performance Tracer</h3>
              <p>Detailed performance tracing that captures and analyzes performance events, measures, and marks for debugging and optimization.</p>
            </div>
          </div>
        </div>

        {/* Integration Examples */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Basic Usage</h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
                {`import { PerformanceDashboard } from '~/components/Organisms/PerformanceComponents'

// In your component
<PerformanceDashboard
  enabled={process.env.NODE_ENV === 'development'}
  showUI={true}
  refreshInterval={5000}
  thresholds={{
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fcp: 1800,
    tti: 3800
  }}
/>`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Custom Alert Rules</h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
                {`const customRules = [
  {
    id: 'custom-metric',
    name: 'Custom Performance Metric',
    metric: 'customMetric',
    threshold: 1000,
    operator: 'gt',
    severity: 'high',
    enabled: true,
    description: 'Custom performance threshold'
  }
]

<PerformanceAlerts
  enabled={true}
  customRules={customRules}
  autoResolve={true}
  autoResolveDelay={30000}
/>`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Performance Tracing</h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
                {`// Add custom performance marks
window.performanceTracer?.addMark('user-action-start')
// ... perform action
window.performanceTracer?.addMark('user-action-end')
window.performanceTracer?.addMeasure('user-action-duration', 'user-action-start', 'user-action-end')

<PerformanceTracer
  enabled={true}
  categories={['navigation', 'resource', 'paint', 'measure', 'mark']}
  autoStart={true}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceDemo
