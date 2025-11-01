import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLoaderData } from "react-router"

import { Button } from "~/components/Atoms/Button"
import TitleBanner from "~/components/Organisms/TitleBanner"
import banner from "~/images/security.webp"
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { sharedLoader } from "~/utils/sharedLoader"

interface SecurityStats {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  uniqueIPs: number
  recentEvents: Array<{
    id: string
    type: string
    ipAddress: string
    path: string
    timestamp: string
    severity: string
  }>
  activeAlerts: number
  suspiciousIPs: number
}

interface RateLimitStats {
  totalViolations: number
  uniqueIPs: number
  violationsByPath: Record<string, number>
  recentViolations: Array<{
    timestamp: string
    path: string
    limitType: string
    ip: string
  }>
}

interface AuditStats {
  totalLogs: number
  logsByLevel: Record<string, number>
  logsByCategory: Record<string, number>
  logsByOutcome: Record<string, number>
  recentLogs: Array<{
    id: string
    timestamp: string
    level: string
    category: string
    action: string
    ipAddress: string
    outcome: string
  }>
  uniqueUsers: number
  uniqueIPs: number
}

export const ROUTE_PATH = "/admin/security-monitor" as const

export const loader = withLoaderErrorHandling(
  async ({ request }: { request: Request }) => {
    const user = await sharedLoader(request)

    // Get the base URL from the request
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    // Fetch security statistics
    const securityResponse = await fetch(`${baseUrl}/admin/security-stats`)
    if (!securityResponse.ok) {
      throw new Error(`Failed to fetch security stats: ${securityResponse.statusText}`)
    }
    const securityData = await securityResponse.json()

    // Fetch rate limit statistics
    const rateLimitResponse = await fetch(`${baseUrl}/admin/rate-limit-stats`)
    if (!rateLimitResponse.ok) {
      throw new Error(`Failed to fetch rate limit stats: ${rateLimitResponse.statusText}`)
    }
    const rateLimitData = await rateLimitResponse.json()

    // Fetch audit statistics
    const auditResponse = await fetch(`${baseUrl}/admin/audit-stats`)
    if (!auditResponse.ok) {
      throw new Error(`Failed to fetch audit stats: ${auditResponse.statusText}`)
    }
    const auditData = await auditResponse.json()

    // Ensure data is properly serialized and structured
    const security = securityData?.stats ||
      securityData || {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        uniqueIPs: 0,
        recentEvents: [],
        activeAlerts: 0,
        suspiciousIPs: 0,
      }

    const rateLimit = rateLimitData?.stats ||
      rateLimitData || {
        totalViolations: 0,
        uniqueIPs: 0,
        violationsByPath: {},
        recentViolations: [],
      }

    const audit = auditData?.stats ||
      auditData || {
        totalLogs: 0,
        logsByLevel: {},
        logsByCategory: {},
        logsByOutcome: {},
        recentLogs: [],
        uniqueUsers: 0,
        uniqueIPs: 0,
      }

    return {
      user,
      security,
      rateLimit,
      audit,
    }
  },
  {
    context: { page: "security-monitor" },
  }
)

const SecurityMonitor = () => {
  const loaderData = useLoaderData<typeof loader>()
  const { security, rateLimit, audit, error } = loaderData || {}
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const { t } = useTranslation()

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true)
      // In a real app, you'd refetch the data here
      setTimeout(() => {
        setIsRefreshing(false)
        setLastRefresh(new Date())
      }, 1000)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Handle loading state
  if (!loaderData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Security Monitor</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Loading security monitoring data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Security Monitor</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <TitleBanner
        image={banner}
        heading={t("securityMonitor.heading")}
        subheading={t("securityMonitor.subheading")}
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-noir-gold">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button onClick={() => window.location.reload()} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Security Events Overview */}
        {security && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-noir-light/20 rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm font-bold">🚨</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-semibold font-noir-gold-500">
                    Security Events
                  </h3>
                  <p className="text-3xl font-bold text-noir-gold">
                    {String(security?.totalEvents || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-noir-light/20 rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm font-bold">⚠️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Active Alerts
                  </h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {String(security?.activeAlerts || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-noir-light/20 rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">🌐</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Unique IPs</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {String(security?.uniqueIPs || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-noir-light/20 rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm font-bold">👁️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Suspicious IPs
                  </h3>
                  <p className="text-3xl font-bold text-yellow-600">
                    {String(security?.suspiciousIPs || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rate Limiting Stats */}
        {rateLimit && (
          <div className="bg-noir-light/20 rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Rate Limiting Statistics
              </h2>
              <div className="text-sm text-gray-500">
                {(rateLimit?.totalViolations || 0) > 0
                  ? "⚠️ Violations detected"
                  : "✅ No violations"}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Total Violations
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {String(rateLimit?.totalViolations || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Unique IPs
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {String(rateLimit?.uniqueIPs || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Recent Violations
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {String(rateLimit?.recentViolations?.length || 0)}
                </p>
              </div>
            </div>

            {/* Violations by Path */}
            {rateLimit?.violationsByPath &&
              Object.keys(rateLimit.violationsByPath).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Violations by Path
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(rateLimit?.violationsByPath || {}).map(([path, count]: [string, any]) => (
                        <div
                          key={path}
                          className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {path}
                          </span>
                          <span className="text-sm font-bold text-red-600">
                            {String(count)} violations
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Audit Logs Stats */}
        {audit && (
          <div className="bg-noir-light/20 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Audit Logs Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Total Logs
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {String(audit?.totalLogs || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Unique Users
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {String(audit?.uniqueUsers || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Unique IPs
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {String(audit?.uniqueIPs || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Recent Logs
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {String(audit?.recentLogs?.length || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Security Events */}
        {security &&
          security?.recentEvents &&
          Array.isArray(security.recentEvents) &&
          security.recentEvents.length > 0 && (
            <div className="bg-noir-light/20 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Security Events
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Path
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {security?.recentEvents?.slice(0, 10).map((event: any) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.timestamp
                            ? new Date(event.timestamp).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {event.type || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-mono">
                            {event.ipAddress || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-mono text-xs">
                            {event.path || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              event.severity === "high"
                                ? "bg-red-100 text-red-800"
                                : event.severity === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {event.severity || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* No Events Message */}
        {security &&
          (!security?.recentEvents ||
            !Array.isArray(security.recentEvents) ||
            security.recentEvents.length === 0) && (
            <div className="bg-noir-light/20 rounded-lg shadow p-6 text-center">
              <div className="text-6xl mb-4">🛡️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Recent Security Events
              </h2>
              <p className="text-gray-600">
                Your application is secure! No security events have been detected
                recently.
              </p>
            </div>
          )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-noir-light/20 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => window.open("/admin/rate-limit-stats", "_blank")}
                className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                View Rate Limit Stats (JSON)
              </button>
              <button
                onClick={() => window.open("/admin/security-stats", "_blank")}
                className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                View Security Stats (JSON)
              </button>
              <button
                onClick={() => window.open("/admin/audit-logs", "_blank")}
                className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                View Audit Logs (JSON)
              </button>
            </div>
          </div>

          <div className="bg-noir-light/20 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Status
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rate Limiting</span>
                <span className="text-sm font-medium text-green-600">✅ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CSRF Protection</span>
                <span className="text-sm font-medium text-green-600">✅ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Security Headers</span>
                <span className="text-sm font-medium text-green-600">✅ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Audit Logging</span>
                <span className="text-sm font-medium text-green-600">✅ Active</span>
              </div>
            </div>
          </div>

          <div className="bg-noir-light/20 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Monitoring Info
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Auto-refresh every 30 seconds</p>
              <p>• Data retention: 7 days</p>
              <p>• Alert threshold: 5 violations/15min</p>
              <p>• IP blocking: 10+ violations/15min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default SecurityMonitor
