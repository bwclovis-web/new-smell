import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import GlobalNavigation from './GlobalNavigation'

describe('GlobalNavigation', () => {
  it('renders a globalnavigation', () => {
    render(<GlobalNavigation />)
    expect(screen.getByText('GlobalNavigation')).toBeInTheDocument()
  })
})
