import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import SearchBar from './SearchBar'

describe('SearchBar', () => {
  it('renders a searchbar', () => {
    render(<SearchBar />)
    expect(screen.getByText('SearchBar')).toBeInTheDocument()
  })
})
