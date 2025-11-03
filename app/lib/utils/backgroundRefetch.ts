/**
 * Background Refetching Utilities
 * 
 * Provides configurations and utilities for background refetching strategies
 * in TanStack Query, including refetchInterval, refetchOnWindowFocus, and
 * stale-while-revalidate patterns.
 */

/**
 * Refetch interval configurations for different data types
 * All intervals are in milliseconds
 */
export const refetchIntervals = {
  /**
   * Real-time data that should be updated frequently
   * Examples: Live notifications, chat messages, real-time stats
   */
  realTime: 5 * 1000, // 5 seconds

  /**
   * Active data that changes often but not in real-time
   * Examples: User alerts, notifications, activity feeds
   */
  active: 30 * 1000, // 30 seconds

  /**
   * Semi-active data that may change occasionally
   * Examples: User wishlist, recent activity, dashboard stats
   */
  semiActive: 2 * 60 * 1000, // 2 minutes

  /**
   * Background data that changes infrequently
   * Examples: User profile, settings, cached lists
   */
  background: 5 * 60 * 1000, // 5 minutes

  /**
   * Static data that rarely changes
   * Examples: House/perfume lists (unless actively being edited)
   */
  static: 10 * 60 * 1000, // 10 minutes

  /**
   * Disabled - no automatic refetching
   * Use for one-time data fetches or when refetching is handled manually
   */
  disabled: false,
} as const

/**
 * Refetch interval type for type safety
 */
export type RefetchIntervalType = keyof typeof refetchIntervals

/**
 * Get refetch interval by type
 */
export function getRefetchInterval(
  type: RefetchIntervalType
): number | false {
  return refetchIntervals[type]
}

/**
 * Custom refetch interval function that pauses when tab is not visible
 * This helps reduce unnecessary network requests when the user isn't viewing the app
 */
export function createSmartRefetchInterval(
  baseInterval: number,
  pauseWhenHidden: boolean = true
): (query: { state: { dataUpdateCount: number } }) => number | false {
  return (query) => {
    // Pause refetching when tab is hidden (if enabled)
    if (pauseWhenHidden && document.hidden) {
      return false
    }

    // Use base interval when tab is visible
    return baseInterval
  }
}

/**
 * Refetch on window focus strategies
 */
export const refetchOnWindowFocusStrategies = {
  /**
   * Always refetch when window gains focus
   * Use for: Critical data that must be fresh when user returns
   */
  always: true,

  /**
   * Never refetch on window focus
   * Use for: Static data, or when you want full control over refetching
   */
  never: false,

  /**
   * Refetch only if data is stale
   * Use for: Most common case - refresh data only if it's outdated
   */
  whenStale: (query: { state: { dataUpdatedAt: number } }) => {
    const staleTime = 5 * 60 * 1000 // 5 minutes
    const now = Date.now()
    return now - query.state.dataUpdatedAt > staleTime
  },
} as const

/**
 * Background refetch configuration for different data types
 */
export interface BackgroundRefetchConfig {
  /**
   * Refetch interval in milliseconds or false to disable
   * Can be a function that returns interval based on query state
   */
  refetchInterval?: number | false | ((query: any) => number | false)

  /**
   * Whether to refetch when window gains focus
   * Can be a function that returns boolean based on query state
   */
  refetchOnWindowFocus?: boolean | ((query: any) => boolean)

  /**
   * Whether to refetch when network reconnects
   */
  refetchOnReconnect?: boolean

  /**
   * Stale time in milliseconds - data is considered fresh for this duration
   * After this time, data is considered stale and will be refetched
   */
  staleTime?: number
}

/**
 * Pre-configured background refetch strategies
 */
export const backgroundRefetchStrategies: Record<
  string,
  BackgroundRefetchConfig
> = {
  /**
   * Real-time data strategy
   * - Frequent refetching (5 seconds)
   * - Refetch on window focus
   * - Very short stale time (10 seconds)
   */
  realTime: {
    refetchInterval: refetchIntervals.realTime,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10 * 1000, // 10 seconds
  },

  /**
   * Active data strategy (e.g., user alerts, notifications)
   * - Regular refetching (30 seconds)
   * - Refetch on window focus if stale
   * - Short stale time (1 minute)
   */
  active: {
    refetchInterval: refetchIntervals.active,
    refetchOnWindowFocus: refetchOnWindowFocusStrategies.whenStale,
    refetchOnReconnect: true,
    staleTime: 1 * 60 * 1000, // 1 minute
  },

  /**
   * Semi-active data strategy
   * - Occasional refetching (2 minutes)
   * - Refetch on window focus if stale
   * - Medium stale time (3 minutes)
   */
  semiActive: {
    refetchInterval: refetchIntervals.semiActive,
    refetchOnWindowFocus: refetchOnWindowFocusStrategies.whenStale,
    refetchOnReconnect: true,
    staleTime: 3 * 60 * 1000, // 3 minutes
  },

  /**
   * Background data strategy
   * - Infrequent refetching (5 minutes)
   * - Refetch on window focus if stale
   * - Standard stale time (5 minutes)
   */
  background: {
    refetchInterval: refetchIntervals.background,
    refetchOnWindowFocus: refetchOnWindowFocusStrategies.whenStale,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  },

  /**
   * Static data strategy
   * - Very infrequent refetching (10 minutes)
   * - Refetch on window focus if stale
   * - Long stale time (10 minutes)
   */
  static: {
    refetchInterval: refetchIntervals.static,
    refetchOnWindowFocus: refetchOnWindowFocusStrategies.whenStale,
    refetchOnReconnect: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
  },

  /**
   * Manual refetch strategy
   * - No automatic refetching
   * - Refetch on window focus if stale
   * - Standard stale time (5 minutes)
   */
  manual: {
    refetchInterval: false,
    refetchOnWindowFocus: refetchOnWindowFocusStrategies.whenStale,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  },
}

/**
 * Get background refetch configuration by strategy name
 */
export function getBackgroundRefetchConfig(
  strategy: keyof typeof backgroundRefetchStrategies
): BackgroundRefetchConfig {
  return backgroundRefetchStrategies[strategy]
}

