import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import RadioSelect from './RadioSelect'

describe('RadioSelect', () => {
  it('renders a radioselect', () => {
    render(<RadioSelect />)
    expect(screen.getByText('RadioSelect')).toBeInTheDocument()
  })
})
