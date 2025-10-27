import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { performanceTestCleanup, performanceTestSetup } from '../setup-performance'

// Example performance test for component rendering
describe('Component Rendering Performance', () => {
  beforeEach(() => {
    performanceTestSetup()
  })

  afterEach(() => {
    performanceTestCleanup()
  })

  it('should render Button component within performance threshold', () => {
    const { Button } = await import('../../app/components/Atoms/Button/Button')

    const renderTime = global.measurePerformance('Button render', () => {
      render(<Button>Test Button</Button>)
    })

    // Assert that rendering takes less than 10ms
    expect(renderTime).toBeLessThan(10)
  })

  it('should render Modal component within performance threshold', () => {
    const Modal = await import('../../app/components/Organisms/Modal/Modal')

    const renderTime = global.measurePerformance('Modal render', () => {
      render(<Modal.default>Test Modal</Modal.default>)
    })

    // Assert that rendering takes less than 20ms
    expect(renderTime).toBeLessThan(20)
  })

  it('should handle multiple component renders efficiently', () => {
    const { Button } = await import('../../app/components/Atoms/Button/Button')

    const renderTime = global.measurePerformance('Multiple Button renders', () => {
      for (let i = 0; i < 100; i++) {
        render(<Button key={i}>Button {i}</Button>)
      }
    })

    // Assert that 100 renders take less than 500ms
    expect(renderTime).toBeLessThan(500)
  })

  it('should not exceed memory threshold during rendering', () => {
    const { Button } = await import('../../app/components/Atoms/Button/Button')

    const initialMemory = global.measureMemory()

    // Render many components
    for (let i = 0; i < 1000; i++) {
      render(<Button key={i}>Button {i}</Button>)
    }

    const finalMemory = global.measureMemory()

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.used - initialMemory.used
      // Assert that memory increase is less than 10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    }
  })
})
