import React, { useState, useEffect } from 'react'
import { type MetaFunction } from 'react-router'
import { useOutletContext } from 'react-router-dom'

import {
  PerformanceDashboard,
  PerformanceAlerts,
  PerformanceOptimizer,
  PerformanceTracer
} from '~/components/Organisms/PerformanceComponents'

interface PerformanceSettings {
  monitoring: {
    enabled: boolean
    refreshInterval: number
    autoStart: boolean
  }
  alerts: {
    enabled: boolean
    autoResolve: boolean
    autoResolveDelay: number
    maxAlerts: number
  }
  optimization: {
    enabled: boolean
    autoOptimize: boolean
    customRules: boolean
  }
  tracing: {
    enabled: boolean
    maxEvents: number
    categories: string[]
  }
  thresholds: {
    lcp: number
    fid: number
    cls: number
    fcp: number
    tti: number
  }
}

export const ROUTE_PATH = '/admin/performance-admin'

export const meta: MetaFunction = () => {
  return [
    { title: 'Performance Admin - Voodoo Perfumes' },
    { name: 'description', content: 'Performance monitoring and management admin interface' }
  ]
}

const PerformanceAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboard' | 'alerts' | 'optimizer' | 'tracer' | 'settings' | 'reports'>('overview')
  const [settings, setSettings] = useState<PerformanceSettings>({
    monitoring: {
      enabled: true,
      refreshInterval: 5000,
      autoStart: true
    },
    alerts: {
      enabled: true,
      autoResolve: true,
      autoResolveDelay: 30000,
      maxAlerts: 50
    },
    optimization: {
      enabled: true,
      autoOptimize: false,
      customRules: false
    },
    tracing: {
      enabled: true,
      maxEvents: 1000,
      categories: ['navigation', 'resource', 'paint', 'measure', 'mark']
    },
    thresholds: {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      tti: 3800
    }
  })

  const [performanceStats, setPerformanceStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    optimizationsApplied: 0,
    eventsTraced: 0,
    averageLoadTime: 0,
    performanceScore: 0
  })

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'dashboard', name: 'Dashboard', icon: '📈' },
    { id: 'alerts', name: 'Alerts', icon: '🚨' },
    { id: 'optimizer', name: 'Optimizer', icon: '⚡' },
    { id: 'tracer', name: 'Tracer', icon: '🔍' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'reports', name: 'Reports', icon: '📋' }
  ] as const

  const updateSettings = (section: keyof PerformanceSettings, updates: Partial<PerformanceSettings[keyof PerformanceSettings]>) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }

  const saveSettings = () => {
    // In a real app, this would save to a backend
    localStorage.setItem('performance-settings', JSON.stringify(settings))
    console.log('Settings saved:', settings)
  }

  const resetSettings = () => {
    const defaultSettings: PerformanceSettings = {
      monitoring: { enabled: true, refreshInterval: 5000, autoStart: true },
      alerts: { enabled: true, autoResolve: true, autoResolveDelay: 30000, maxAlerts: 50 },
      optimization: { enabled: true, autoOptimize: false, customRules: false },
      tracing: { enabled: true, maxEvents: 1000, categories: ['navigation', 'resource', 'paint', 'measure', 'mark'] },
      thresholds: { lcp: 2500, fid: 100, cls: 0.1, fcp: 1800, tti: 3800 }
    }
    setSettings(defaultSettings)
  }

  const exportPerformanceData = () => {
    const data = {
      settings,
      stats: performanceStats,
      timestamp: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Performance Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{performanceStats.activeAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Optimizations Applied</p>
              <p className="text-2xl font-bold text-gray-900">{performanceStats.optimizationsApplied}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🔍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Events Traced</p>
              <p className="text-2xl font-bold text-gray-900">{performanceStats.eventsTraced}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Performance Score</p>
              <p className="text-2xl font-bold text-gray-900">{performanceStats.performanceScore}/100</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium text-gray-900">View Dashboard</p>
                <p className="text-sm text-gray-600">Real-time performance metrics</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="font-medium text-gray-900">Manage Alerts</p>
                <p className="text-sm text-gray-600">Configure and monitor alerts</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('optimizer')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="font-medium text-gray-900">Run Optimizations</p>
                <p className="text-sm text-gray-600">Apply performance improvements</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Performance Monitoring</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${settings.monitoring.enabled
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {settings.monitoring.enabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Alert System</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${settings.alerts.enabled
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {settings.alerts.enabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Auto Optimization</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${settings.optimization.autoOptimize
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
              }`}>
              {settings.optimization.autoOptimize ? 'Enabled' : 'Manual'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Performance Tracing</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${settings.tracing.enabled
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {settings.tracing.enabled ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Monitoring Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoring Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Monitoring</label>
              <p className="text-sm text-gray-500">Enable real-time performance monitoring</p>
            </div>
            <input
              type="checkbox"
              checked={settings.monitoring.enabled}
              onChange={(e) => updateSettings('monitoring', { enabled: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Interval (ms)</label>
            <input
              type="number"
              value={settings.monitoring.refreshInterval}
              onChange={(e) => updateSettings('monitoring', { refreshInterval: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1000"
              step="1000"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto Start</label>
              <p className="text-sm text-gray-500">Automatically start monitoring on page load</p>
            </div>
            <input
              type="checkbox"
              checked={settings.monitoring.autoStart}
              onChange={(e) => updateSettings('monitoring', { autoStart: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Alert Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Alerts</label>
              <p className="text-sm text-gray-500">Enable performance alerting system</p>
            </div>
            <input
              type="checkbox"
              checked={settings.alerts.enabled}
              onChange={(e) => updateSettings('alerts', { enabled: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto Resolve</label>
              <p className="text-sm text-gray-500">Automatically resolve alerts after delay</p>
            </div>
            <input
              type="checkbox"
              checked={settings.alerts.autoResolve}
              onChange={(e) => updateSettings('alerts', { autoResolve: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Auto Resolve Delay (ms)</label>
            <input
              type="number"
              value={settings.alerts.autoResolveDelay}
              onChange={(e) => updateSettings('alerts', { autoResolveDelay: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1000"
              step="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Alerts</label>
            <input
              type="number"
              value={settings.alerts.maxAlerts}
              onChange={(e) => updateSettings('alerts', { maxAlerts: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              step="10"
            />
          </div>
        </div>
      </div>

      {/* Threshold Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LCP Threshold (ms)</label>
            <input
              type="number"
              value={settings.thresholds.lcp}
              onChange={(e) => updateSettings('thresholds', { lcp: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1000"
              step="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">FID Threshold (ms)</label>
            <input
              type="number"
              value={settings.thresholds.fid}
              onChange={(e) => updateSettings('thresholds', { fid: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              step="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CLS Threshold</label>
            <input
              type="number"
              value={settings.thresholds.cls}
              onChange={(e) => updateSettings('thresholds', { cls: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0.01"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">FCP Threshold (ms)</label>
            <input
              type="number"
              value={settings.thresholds.fcp}
              onChange={(e) => updateSettings('thresholds', { fcp: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="500"
              step="100"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={saveSettings}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Save Settings
        </button>
        <button
          onClick={resetSettings}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          onClick={exportPerformanceData}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Export Data
        </button>
      </div>
    </div>
  )

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Reports</h3>
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📊</span>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Reports Coming Soon</h4>
          <p className="text-gray-600">Detailed performance analytics and reporting features will be available in a future update.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Admin</h1>
          <p className="text-gray-600">
            Comprehensive performance monitoring, alerting, optimization, and management tools.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'dashboard' && (
            <PerformanceDashboard
              enabled={settings.monitoring.enabled}
              showUI={true}
              refreshInterval={settings.monitoring.refreshInterval}
              thresholds={settings.thresholds}
            />
          )}
          {activeTab === 'alerts' && (
            <PerformanceAlerts
              enabled={settings.alerts.enabled}
              showUI={true}
              autoResolve={settings.alerts.autoResolve}
              autoResolveDelay={settings.alerts.autoResolveDelay}
              maxAlerts={settings.alerts.maxAlerts}
            />
          )}
          {activeTab === 'optimizer' && (
            <PerformanceOptimizer
              enabled={settings.optimization.enabled}
              showUI={true}
              autoOptimize={settings.optimization.autoOptimize}
            />
          )}
          {activeTab === 'tracer' && (
            <PerformanceTracer
              enabled={settings.tracing.enabled}
              showUI={true}
              maxEvents={settings.tracing.maxEvents}
              categories={settings.tracing.categories}
              autoStart={settings.monitoring.autoStart}
            />
          )}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'reports' && renderReports()}
        </div>
      </div>
    </div>
  )
}

export default PerformanceAdmin
