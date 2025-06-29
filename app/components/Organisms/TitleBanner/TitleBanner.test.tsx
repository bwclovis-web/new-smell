import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import TitleBanner from './TitleBanner'

describe('TitleBanner', () => {
  it('renders a titlebanner', () => {
    render(<TitleBanner />)
    expect(screen.getByText('TitleBanner')).toBeInTheDocument()
  })
})
