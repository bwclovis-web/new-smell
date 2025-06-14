import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Modal from './Modal'

describe('Modal', () => {
  it('renders a modal', () => {
    render(<Modal />)
    expect(screen.getByText('Modal')).toBeInTheDocument()
  })
})
