/**
 * Dynamic import utilities for code splitting
 */

// Route-based dynamic imports
export const dynamicRouteImports = {
  // Admin routes
  adminIndex: () => import("~/routes/admin/adminIndex"),
  adminLayout: () => import("~/routes/admin/AdminLayout"),
  myScents: () => import("~/routes/admin/MyScents"),
  wishlistPage: () => import("~/routes/admin/WishlistPage"),
  dataQuality: () => import("~/routes/admin/data-quality"),
  createPerfumeHouse: () => import("~/routes/admin/CreatePerfumeHousePage"),
  createPerfume: () => import("~/routes/admin/CreatePerfumePage"),
  editPerfumeHouse: () => import("~/routes/admin/EditPerfumeHousePage"),
  editPerfume: () => import("~/routes/admin/EditPerfumePage"),

  // Auth routes
  loginLayout: () => import("~/routes/login/LoginLayout"),
  signInPage: () => import("~/routes/login/SignInPage"),
  signUpPage: () => import("~/routes/login/SignUpPage"),

  // Main routes
  behindTheBottle: () => import("~/routes/behind-the-bottle"),
  theVault: () => import("~/routes/the-vault"),
  theExchange: () => import("~/routes/the-exchange"),
  perfumeDetail: () => import("~/routes/perfume"),
  perfumeHouse: () => import("~/routes/perfume-house"),
  traderProfile: () => import("~/routes/trader-profile"),

  // Utility routes
  notFound: () => import("~/routes/NotFoundPage"),
  // ratingDemo: () => import('~/routes/rating-demo') // Removed demo route
}

// Component-based dynamic imports for heavy components
export const dynamicComponentImports = {
  // Data visualization components
  dataQualityDashboard: () =>
    import("~/components/Containers/DataQualityDashboard"),

  // Complex forms
  perfumeForm: () => import("~/components/Containers/Forms/PerfumeForm"),
  houseForm: () => import("~/components/Containers/Forms/HouseForm"),

  // Heavy UI components
  virtualScrollDemo: () =>
    import("~/components/Examples/VirtualScrollDemo/VirtualScrollDemo"),

  // Chart components (if using chart libraries)
  chartComponents: () =>
    import("~/components/Containers/DataQualityDashboard"),

  // Modal components
  complexModals: () => import("~/components/Organisms/Modal/Modal"),
}

// Utility functions for dynamic imports
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn)
}

// Preload functions for critical routes
export const preloadRoute = (routeKey: keyof typeof dynamicRouteImports) => {
  return dynamicRouteImports[routeKey]()
}

// Preload multiple routes
export const preloadRoutes = (routeKeys: (keyof typeof dynamicRouteImports)[]) => {
  return Promise.all(routeKeys.map(preloadRoute))
}

// Critical routes that should be preloaded
export const criticalRoutes = [
  "behindTheBottle",
  "theVault",
  "perfumeDetail",
  "perfumeHouse",
] as const

// Non-critical routes that can be loaded on demand
export const lazyRoutes = [
  "adminIndex",
  "myScents",
  "wishlistPage",
  "dataQuality",
  "theExchange",
  "traderProfile",
] as const

// Route priority levels
export const routePriorities = {
  critical: criticalRoutes,
  lazy: lazyRoutes,
} as const

// Dynamic import with error boundary
export const createSafeDynamicImport = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallbackComponent?: T
) => {
  return React.lazy(() =>
    importFn().catch(() => ({
      default: fallbackComponent || (() => <div>Failed to load component</div>),
    }))
  )
}

// Bundle analysis helpers
export const getBundleInfo = () => {
  if (typeof window !== "undefined" && "performance" in window) {
    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded:
        navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime || 0,
      firstContentfulPaint:
        performance.getEntriesByName("first-contentful-paint")[0]?.startTime || 0,
    }
  }
  return null
}
