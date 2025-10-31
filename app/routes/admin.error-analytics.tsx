/**
 * Error Analytics Dashboard Page
 * 
 * Admin page for viewing error analytics and insights.
 */

export const ROUTE_PATH = '/admin/error-analytics';

import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { withLoaderErrorHandling } from '~/utils/errorHandling.server';
import { errorAnalytics } from '~/utils/errorAnalytics.server';
import { sharedLoader } from '~/utils/sharedLoader';
import { createError } from '~/utils/errorHandling';
import { ErrorAnalyticsDashboard } from '~/components/Organisms/ErrorAnalyticsDashboard/ErrorAnalyticsDashboard';

export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    // Check authentication and authorization
    const user = await sharedLoader(request);
    
    if (!user) {
      throw createError.authentication('Authentication required');
    }
    
    if (user.role !== 'admin') {
      throw createError.authorization('Admin access required');
    }
    
    // Generate initial analytics report
    const report = errorAnalytics.generateReport({ timeRange: 'day' });
    
    return {
      report,
      user,
    };
  },
  {
    context: { page: 'error-analytics-dashboard' },
    redirectOnAuth: '/sign-in?redirect=/admin/error-analytics',
    redirectOnAuthz: '/unauthorized',
  }
);

export default function ErrorAnalyticsPage() {
  const { report } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorAnalyticsDashboard initialData={report} />
    </div>
  );
}

