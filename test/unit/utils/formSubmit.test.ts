/**
 * Tests for form submission utilities
 * 
 * @group unit
 * @group forms
 */

import { describe, it, expect, vi } from 'vitest'
import { 
  extractFormData, 
  formDataToObject,
  createFormAction 
} from '~/utils/forms/formSubmit'

// Note: useFormSubmit is a React hook and requires integration testing
// with a React component. It's tested through real form usage.

describe('extractFormData', () => {
  it('should extract specified fields from FormData', () => {
    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'password123')
    formData.append('extra', 'ignored')

    const result = extractFormData<{ email: string; password: string }>(
      formData,
      ['email', 'password']
    )

    expect(result).toEqual({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(result).not.toHaveProperty('extra')
  })

  it('should handle missing fields', () => {
    const formData = new FormData()
    formData.append('email', 'test@example.com')

    const result = extractFormData<{ email: string; password?: string }>(
      formData,
      ['email', 'password']
    )

    expect(result).toEqual({
      email: 'test@example.com'
    })
  })
})

describe('formDataToObject', () => {
  it('should convert FormData to object', () => {
    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'password123')

    const result = formDataToObject(formData)

    expect(result).toEqual({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should handle multiple values for same key', () => {
    const formData = new FormData()
    formData.append('tags', 'tag1')
    formData.append('tags', 'tag2')
    formData.append('tags', 'tag3')

    const result = formDataToObject(formData)

    expect(result.tags).toEqual(['tag1', 'tag2', 'tag3'])
  })

  it('should return empty object for empty FormData', () => {
    const formData = new FormData()
    const result = formDataToObject(formData)

    expect(result).toEqual({})
  })
})

describe('createFormAction', () => {
  it('should create a form action handler', async () => {
    const handler = vi.fn().mockResolvedValue({ success: true })
    const action = createFormAction(handler)

    const formData = new FormData()
    formData.append('field', 'value')

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData
    })

    const result = await action({ request })

    expect(handler).toHaveBeenCalledWith({ field: 'value' })
    expect(result).toEqual({ success: true })
  })

  it('should validate before calling handler', async () => {
    const handler = vi.fn()
    const validate = vi.fn().mockReturnValue({ error: 'Validation failed' })
    const action = createFormAction(handler, { validate })

    const formData = new FormData()
    formData.append('field', 'value')

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData
    })

    const result = await action({ request })

    expect(validate).toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
    expect(result).toEqual({ error: 'Validation failed' })
  })

  it('should transform FormData before handler', async () => {
    const handler = vi.fn().mockResolvedValue({})
    const transform = vi.fn((fd: FormData) => ({ transformed: true }))
    const action = createFormAction(handler, { transform })

    const formData = new FormData()
    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData
    })

    await action({ request })

    expect(transform).toHaveBeenCalled()
    expect(handler).toHaveBeenCalledWith({ transformed: true })
  })

  it('should handle errors with custom error handler', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Handler error'))
    const onError = vi.fn().mockReturnValue({ error: 'Custom error' })
    const action = createFormAction(handler, { onError })

    const formData = new FormData()
    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData
    })

    const result = await action({ request })

    expect(onError).toHaveBeenCalled()
    expect(result).toEqual({ error: 'Custom error' })
  })

  it('should return default error message when no error handler provided', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Something went wrong'))
    const action = createFormAction(handler)

    const formData = new FormData()
    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData
    })

    const result = await action({ request })

    expect(result).toEqual({ error: 'Something went wrong' })
  })
})

