/**
 * Bundle splitting configuration and utilities
 */

// Bundle splitting strategies
export const bundleStrategies = {
  // Route-based splitting
  routeBased: {
    critical: [
      'home',
      'behind-the-bottle',
      'the-vault',
      'perfume',
      'perfume-house'
    ],
    admin: [
      'admin/adminIndex',
      'admin/MyScents',
      'admin/WishlistPage',
      'admin/data-quality'
    ],
    auth: [
      'login/SignInPage',
      'login/SignUpPage'
    ],
    lazy: [
      'the-exchange',
      'trader-profile',
      'rating-demo'
    ]
  },

  // Component-based splitting
  componentBased: {
    heavy: [
      'DataQualityDashboard',
      'VirtualScrollDemo',
      'PerfumeForm',
      'HouseForm'
    ],
    charts: [
      'ChartComponents',
      'DataVisualization'
    ],
    modals: [
      'ComplexModals',
      'DataEntryModals'
    ]
  },

  // Vendor splitting
  vendor: {
    react: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    ui: ['@gsap/react', 'gsap', 'zustand', 'react-i18next', 'i18next'],
    icons: ['react-icons/gr', 'react-icons/md', 'react-icons/fa', 'react-icons/io5'],
    utils: ['cookie', 'clsx', 'class-variance-authority', 'tailwind-merge'],
    charts: ['chart.js', 'react-chartjs-2'] // If using chart libraries
  }
}

// Bundle size limits (in KB)
export const bundleLimits = {
  initial: 250,      // Initial bundle size
  route: 100,        // Individual route chunks
  vendor: 200,       // Vendor chunks
  component: 50,     // Component chunks
  warning: 1000      // Warning threshold
}

// Preloading strategies
export const preloadingStrategies = {
  // Preload critical routes immediately
  critical: {
    routes: ['behind-the-bottle', 'the-vault'],
    components: ['GlobalNavigation', 'TitleBanner']
  },

  // Preload on hover/focus
  onInteraction: {
    routes: ['admin/MyScents', 'admin/WishlistPage'],
    components: ['DataQualityDashboard', 'VirtualScrollDemo']
  },

  // Preload on idle
  onIdle: {
    routes: ['the-exchange', 'trader-profile'],
    components: ['ComplexModals', 'ChartComponents']
  }
}

// Bundle analysis utilities
export const analyzeBundle = () => {
  if (typeof window === 'undefined') return null

  const performance = window.performance
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  return {
    // Timing metrics
    timing: {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0
    },

    // Resource metrics
    resources: performance.getEntriesByType('resource').map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: (resource as any).transferSize || 0,
      type: resource.initiatorType
    })),

    // Memory usage (if available)
    memory: (performance as any).memory ? {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit
    } : null
  }
}

// Bundle optimization recommendations
export const getOptimizationRecommendations = (bundleAnalysis: ReturnType<typeof analyzeBundle>) => {
  if (!bundleAnalysis) return []

  const recommendations = []
  const { timing, resources } = bundleAnalysis

  // Check for slow loading times
  if (timing.firstContentfulPaint > 2000) {
    recommendations.push({
      type: 'performance',
      message: 'First Contentful Paint is slow. Consider code splitting critical routes.',
      priority: 'high'
    })
  }

  // Check for large JavaScript bundles
  const jsResources = resources.filter(r => r.name.endsWith('.js'))
  const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0)

  if (totalJSSize > bundleLimits.initial * 1024) {
    recommendations.push({
      type: 'bundle-size',
      message: `Total JS bundle size (${Math.round(totalJSSize / 1024)}KB) exceeds recommended limit. Consider splitting vendor chunks.`,
      priority: 'medium'
    })
  }

  // Check for unused resources
  const unusedResources = resources.filter(r => r.duration < 10 && r.size > 10000)
  if (unusedResources.length > 0) {
    recommendations.push({
      type: 'unused-code',
      message: `${unusedResources.length} large resources loaded but not used. Consider lazy loading.`,
      priority: 'low'
    })
  }

  return recommendations
}

// Dynamic import with retry logic
export const createRetryableImport = <T>(
  importFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
) => {
  return new Promise<T>((resolve, reject) => {
    let retries = 0

    const attemptImport = async () => {
      try {
        const result = await importFn()
        resolve(result)
      } catch (error) {
        retries++
        if (retries < maxRetries) {
          setTimeout(attemptImport, delay * retries)
        } else {
          reject(error)
        }
      }
    }

    attemptImport()
  })
}

// Bundle splitting configuration for Vite
export const viteBundleConfig = {
  rollupOptions: {
    output: {
      manualChunks: {
        // Core React libraries
        'react-vendor': ['react', 'react-dom', 'react-router', 'react-router-dom'],

        // UI and animation libraries
        'ui-vendor': ['@gsap/react', 'gsap', 'zustand', 'react-i18next', 'i18next'],

        // Icon libraries
        'icons-vendor': ['react-icons/gr', 'react-icons/md', 'react-icons/fa', 'react-icons/io5'],

        // Utility libraries
        'utils-vendor': ['cookie', 'clsx', 'class-variance-authority', 'tailwind-merge'],

        // Admin features
        'admin': [
          './app/routes/admin/adminIndex.tsx',
          './app/routes/admin/AdminLayout.tsx',
          './app/routes/admin/MyScents.tsx',
          './app/routes/admin/WishlistPage.tsx'
        ],

        // Authentication
        'auth': [
          './app/routes/login/LoginLayout.tsx',
          './app/routes/login/SignInPage.tsx',
          './app/routes/login/SignUpPage.tsx'
        ],

        // Data visualization
        'data-viz': [
          './app/components/Containers/DataQualityDashboard/DataQualityDashboard.tsx'
        ]
      }
    }
  }
}
