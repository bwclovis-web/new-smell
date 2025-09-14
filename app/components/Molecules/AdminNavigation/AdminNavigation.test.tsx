import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import AdminNavigation from './AdminNavigation'

describe('AdminNavigation', () => {
  it('renders a adminnavigation', () => {
    const user = { role: 'admin' }
    render(
      <MemoryRouter>
        <AdminNavigation user={user} />
      </MemoryRouter>
    )
    expect(screen.getByText('create house')).toBeInTheDocument()
  })
})
