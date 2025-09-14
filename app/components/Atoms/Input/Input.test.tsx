import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import Input from './Input'

describe('Input', () => {
  it('renders a input', () => {
    const inputRef = createRef<HTMLInputElement>()
    render(<Input inputType="text" inputRef={inputRef} label="Test Input" />)
    expect(screen.getByText('Test Input')).toBeInTheDocument()
  })
})
