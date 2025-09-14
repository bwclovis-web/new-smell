import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import TagSearch from './TagSearch'

describe('TagSearch', () => {
  it('renders a tagsearch', () => {
    const inputRef = createRef<HTMLInputElement>()
    const data = []
    const onChange = () => { }
    render(<TagSearch data={data} onChange={onChange} label="Test Tags" />)
    expect(screen.getByText('Test Tags search')).toBeInTheDocument()
  })
})
