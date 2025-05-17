import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import TagSearch from './TagSearch'

describe('TagSearch', () => {
  it('renders a tagsearch', () => {
    render(<TagSearch />)
    expect(screen.getByText('TagSearch')).toBeInTheDocument()
  })
})
