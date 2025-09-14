import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import GlobalNavigation from './GlobalNavigation'

describe('GlobalNavigation', () => {
  it('renders a globalnavigation', () => {
    render(
      <MemoryRouter>
        <GlobalNavigation />
      </MemoryRouter>
    )
    expect(screen.getByText('Behind the Bottle')).toBeInTheDocument()
  })
})
