import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Select from './Select'

describe('Select', () => {
  it('renders a select', () => {
    render(<Select />)
    expect(screen.getByText('Select')).toBeInTheDocument()
  })
})
