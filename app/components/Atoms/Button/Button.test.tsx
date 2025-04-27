import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from './Button'

describe('Button', () => {
  it('renders a button', () => {
    render(<Button />)
    expect(screen.getByText('Button')).toBeInTheDocument()
  })
})
