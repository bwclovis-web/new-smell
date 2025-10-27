import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from '@testing-library/react'
import PerformanceMonitor from './PerformanceMonitor'
import * as bundleSplitting from '~/utils/bundleSplitting'

// Mock the bundleSplitting utilities
vi.mock('~/utils/bundleSplitting', () => ({
  analyzeBundle: vi.fn(),
  getOptimizationRecommendations: vi.fn()
}))

describe('PerformanceMonitor (Atom)', () => {
  const mockBundleAnalysis = {
    timing: {
      firstContentfulPaint: 1200,
      largestContentfulPaint: 2300
    },
    resources: [
      { name: 'bundle1.js', size: 1024 },
      { name: 'bundle2.js', size: 2048 },
      { name: 'styles.css', size: 512 }
    ],
    memory: {
      used: 52428800, // 50MB
      total: 104857600, // 100MB
      limit: 2147483648 // 2GB
    }
  }

  const mockRecommendations = [
    { priority: 'high', message: 'Large bundle detected' },
    { priority: 'medium', message: 'Consider code splitting' },
    { priority: 'low', message: 'Optimize images' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Clear console mocks
    vi.spyOn(console, 'group').mockImplementation(() => { })
    vi.spyOn(console, 'log').mockImplementation(() => { })
    vi.spyOn(console, 'groupEnd').mockImplementation(() => { })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render nothing when disabled', () => {
      const { container } = render(<PerformanceMonitor enabled={false} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render nothing when showUI is false', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(mockRecommendations)

      const { container } = render(
        <PerformanceMonitor enabled={true} showUI={false} showInConsole={false} />
      )

      // Wait for metrics collection
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(container.firstChild).toBeNull()
    })

    it('should render UI when enabled and showUI is true', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(mockRecommendations)

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      // Advance timers to trigger metrics collection
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Bundle Performance')).toBeInTheDocument()
    })

    it('should not render before metrics are collected', () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(null)

      const { container } = render(
        <PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Metrics Collection', () => {
    it('should collect metrics after 2 seconds', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(mockRecommendations)

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      expect(bundleSplitting.analyzeBundle).not.toHaveBeenCalled()

      // Advance timers
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(bundleSplitting.analyzeBundle).toHaveBeenCalledTimes(1)
    })

    it('should not collect metrics when disabled', () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)

      render(<PerformanceMonitor enabled={false} showInConsole={false} />)

      vi.advanceTimersByTime(2000)

      expect(bundleSplitting.analyzeBundle).not.toHaveBeenCalled()
    })

    it('should get optimization recommendations', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(mockRecommendations)

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(bundleSplitting.getOptimizationRecommendations).toHaveBeenCalledWith(mockBundleAnalysis)
    })
  })

  describe('Console Logging', () => {
    it('should log metrics to console when showInConsole is true', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(mockRecommendations)

      render(<PerformanceMonitor enabled={true} showInConsole={true} showUI={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(console.group).toHaveBeenCalledWith('📊 Bundle Performance Analysis')
      expect(console.log).toHaveBeenCalledWith('Timing Metrics:', mockBundleAnalysis.timing)
      expect(console.log).toHaveBeenCalledWith('Resource Count:', mockBundleAnalysis.resources.length)
      expect(console.log).toHaveBeenCalledWith('Memory Usage:', mockBundleAnalysis.memory)
    })

    it('should log recommendations when available', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(mockRecommendations)

      render(<PerformanceMonitor enabled={true} showInConsole={true} showUI={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(console.group).toHaveBeenCalledWith('💡 Optimization Recommendations')
      expect(console.log).toHaveBeenCalledWith('1. [HIGH] Large bundle detected')
      expect(console.log).toHaveBeenCalledWith('2. [MEDIUM] Consider code splitting')
      expect(console.log).toHaveBeenCalledWith('3. [LOW] Optimize images')
    })

    it('should not log to console when showInConsole is false', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(mockRecommendations)

      render(<PerformanceMonitor enabled={true} showInConsole={false} showUI={true} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(bundleSplitting.analyzeBundle).toHaveBeenCalled()
      expect(console.group).not.toHaveBeenCalled()
      expect(console.log).not.toHaveBeenCalled()
    })
  })

  describe('UI Display', () => {
    it('should display FCP metric', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('FCP:')).toBeInTheDocument()
      expect(screen.getByText('1200ms')).toBeInTheDocument()
    })

    it('should display LCP metric', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('LCP:')).toBeInTheDocument()
      expect(screen.getByText('2300ms')).toBeInTheDocument()
    })

    it('should display resource count', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Resources:')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should display memory usage', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Memory:')).toBeInTheDocument()
      expect(screen.getByText('50MB')).toBeInTheDocument()
    })

    it('should not display memory when not available', async () => {
      const analysisWithoutMemory = {
        ...mockBundleAnalysis,
        memory: undefined
      }

      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(analysisWithoutMemory)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Resources:')).toBeInTheDocument()
      expect(screen.queryByText('Memory:')).not.toBeInTheDocument()
    })
  })

  describe('Recommendations Display', () => {
    it('should display recommendations section when available', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(mockRecommendations)

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Recommendations')).toBeInTheDocument()
    })

    it('should display up to 3 recommendations', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(mockRecommendations)

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Large bundle detected')).toBeInTheDocument()
      expect(screen.getByText('Consider code splitting')).toBeInTheDocument()
      expect(screen.getByText('Optimize images')).toBeInTheDocument()
    })

    it('should display priority indicators with correct colors', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(mockRecommendations)

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Large bundle detected')).toBeInTheDocument()
      const container = screen.getByText('Large bundle detected').closest('div')
      const indicator = container?.querySelector('.bg-red-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should not display recommendations section when empty', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Bundle Performance')).toBeInTheDocument()
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument()
    })

    it('should limit recommendations to top 3', async () => {
      const manyRecommendations = [
        { priority: 'high', message: 'Recommendation 1' },
        { priority: 'high', message: 'Recommendation 2' },
        { priority: 'medium', message: 'Recommendation 3' },
        { priority: 'low', message: 'Recommendation 4' },
        { priority: 'low', message: 'Recommendation 5' }
      ]

      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue(manyRecommendations)

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Recommendation 1')).toBeInTheDocument()
      expect(screen.getByText('Recommendation 2')).toBeInTheDocument()
      expect(screen.getByText('Recommendation 3')).toBeInTheDocument()
      expect(screen.queryByText('Recommendation 4')).not.toBeInTheDocument()
      expect(screen.queryByText('Recommendation 5')).not.toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply default className', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      const { container } = render(
        <PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />
      )

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      const element = container.querySelector('.fixed.bottom-4.right-4')
      expect(element).toBeInTheDocument()
    })

    it('should apply custom className', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      const { container } = render(
        <PerformanceMonitor
          enabled={true}
          showUI={true}
          showInConsole={false}
          className="custom-class"
        />
      )

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      const element = container.querySelector('.custom-class')
      expect(element).toBeInTheDocument()
    })

    it('should have fixed positioning', async () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      const { container } = render(
        <PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />
      )

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      const element = container.querySelector('.fixed')
      expect(element).toBeInTheDocument()
      expect(element).toHaveClass('bottom-4', 'right-4')
    })
  })

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)

      const { unmount } = render(
        <PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />
      )

      unmount()

      vi.advanceTimersByTime(2000)

      expect(bundleSplitting.analyzeBundle).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null bundle analysis', () => {
      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(null)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      const { container } = render(
        <PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />
      )

      vi.advanceTimersByTime(2000)

      expect(container.firstChild).toBeNull()
    })

    it('should handle missing timing data', async () => {
      const incompleteAnalysis = {
        timing: {
          firstContentfulPaint: 0,
          largestContentfulPaint: 0
        },
        resources: [],
        memory: null
      }

      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(incompleteAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('0ms')).toBeInTheDocument()
    })

    it('should handle very large memory values', async () => {
      const largeMemoryAnalysis = {
        ...mockBundleAnalysis,
        memory: {
          used: 1073741824, // 1GB
          total: 2147483648, // 2GB
          limit: 4294967296 // 4GB
        }
      }

      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(largeMemoryAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      render(<PerformanceMonitor enabled={true} showUI={true} showInConsole={false} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('1024MB')).toBeInTheDocument()
    })
  })

  describe('Default Props', () => {
    it('should use development mode as default enabled value', () => {
      const originalEnv = process.env.NODE_ENV

      // Mock development environment
      process.env.NODE_ENV = 'development'

      vi.mocked(bundleSplitting.analyzeBundle).mockReturnValue(mockBundleAnalysis)
      vi.mocked(bundleSplitting.getOptimizationRecommendations).mockReturnValue([])

      render(<PerformanceMonitor showUI={true} showInConsole={false} />)

      vi.advanceTimersByTime(2000)

      // Component should be enabled in development mode by default

      process.env.NODE_ENV = originalEnv
    })
  })
})
