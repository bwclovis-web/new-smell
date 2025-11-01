/**
 * Error Analytics API Route
 * 
 * Provides error analytics data for the dashboard.
 * Requires admin authentication.
 */

import { type LoaderFunctionArgs } from 'react-router'

import { errorAnalytics } from '~/utils/errorAnalytics.server'
import { createError } from '~/utils/errorHandling'
import { withLoaderErrorHandling } from '~/utils/errorHandling.server'
import { sharedLoader } from '~/utils/sharedLoader'

export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    // Check authentication and authorization
    const user = await sharedLoader(request)
    
    if (!user) {
      throw createError.authentication('Authentication required')
    }
    
    if (user.role !== 'admin') {
      throw createError.authorization('Admin access required')
    }
    
    // Parse query parameters
    const url = new URL(request.url)
    const timeRange = (url.searchParams.get('timeRange') || 'day') as 
      'hour' | 'day' | 'week' | 'month' | 'all'
    const format = url.searchParams.get('format') || 'json'
    
    // Generate analytics report
    const report = errorAnalytics.generateReport({ timeRange })
    
    // Export format
    if (format === 'export') {
      const data = errorAnalytics.exportData({ timeRange })
      
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="error-analytics-${new Date().toISOString()}.json"`,
          'Cache-Control': 'no-store',
        },
      })
    }
    
    // Regular JSON response
    return Response.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  },
  {
    context: { api: 'error-analytics' },
    redirectOnAuth: '/sign-in?redirect=/admin/error-analytics',
    redirectOnAuthz: '/unauthorized',
  }
)

