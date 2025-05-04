import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AdminNavigation from './AdminNavigation'

describe('AdminNavigation', () => {
  it('renders a adminnavigation', () => {
    render(<AdminNavigation />)
    expect(screen.getByText('AdminNavigation')).toBeInTheDocument()
  })
})
