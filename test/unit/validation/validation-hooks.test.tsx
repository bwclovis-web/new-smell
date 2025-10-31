/**
 * Validation hooks tests
 * Tests the useValidation and useFieldValidation hooks
 */

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { useFieldValidation, useValidation } from '../../../app/hooks/useValidation'

describe('useValidation Hook', () => {
  const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    age: z.number().min(18, 'Must be at least 18 years old')
  })

  const initialValues = {
    name: '',
    email: '',
    age: 0
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.isValid).toBe(false)
    expect(result.current.isDirty).toBe(false)
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.isValidating).toBe(false)
  })

  it('should update values when setValue is called', () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    act(() => {
      result.current.setValue('name', 'John Doe')
    })

    expect(result.current.values.name).toBe('John Doe')
    expect(result.current.isDirty).toBe(true)
  })

  it('should update multiple values when setValues is called', () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    act(() => {
      result.current.setValues({
        name: 'John Doe',
        email: 'john@example.com'
      })
    })

    expect(result.current.values.name).toBe('John Doe')
    expect(result.current.values.email).toBe('john@example.com')
    expect(result.current.isDirty).toBe(true)
  })

  it('should set field errors', () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    act(() => {
      result.current.setError('name', 'Name is required')
    })

    expect(result.current.errors.name).toBe('Name is required')
  })

  it('should clear field errors', () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    act(() => {
      result.current.setError('name', 'Name is required')
    })

    expect(result.current.errors.name).toBe('Name is required')

    act(() => {
      result.current.clearError('name')
    })

    expect(result.current.errors.name).toBeUndefined()
  })

  it('should clear all errors', () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    act(() => {
      result.current.setErrors({
        name: 'Name is required',
        email: 'Email is required'
      })
    })

    expect(Object.keys(result.current.errors)).toHaveLength(2)

    act(() => {
      result.current.clearErrors()
    })

    expect(Object.keys(result.current.errors)).toHaveLength(0)
  })

  it('should set touched state', () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    act(() => {
      result.current.setTouched('name', true)
    })

    expect(result.current.touched.name).toBe(true)
  })

  it('should validate form and return validation result', async () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    act(() => {
      result.current.setValues({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      })
    })

    let validationResult: boolean
    await act(async () => {
      validationResult = await result.current.validate()
    })

    expect(validationResult!).toBe(true)
    expect(Object.keys(result.current.errors)).toHaveLength(0)
  })

  it('should return validation errors for invalid data', async () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    act(() => {
      result.current.setValues({
        name: 'J', // Too short
        email: 'invalid-email',
        age: 15 // Too young
      })
    })

    let validationResult: boolean
    await act(async () => {
      validationResult = await result.current.validate()
    })

    expect(validationResult!).toBe(false)
    expect(result.current.errors.name).toBe('Name must be at least 2 characters')
    expect(result.current.errors.email).toBe('Invalid email format')
    expect(result.current.errors.age).toBe('Must be at least 18 years old')
  })

  it('should handle form submission', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit
      }))

    act(() => {
      result.current.setValues({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      })
    })

    await act(async () => {
      await result.current.handleSubmit(onSubmit)()
    })

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25
    })
  })

  it('should not submit form with validation errors', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit,
        validateOnSubmit: true
      }))

    act(() => {
      result.current.setValues({
        name: 'J', // Too short
        email: 'invalid-email',
        age: 15 // Too young
      })
    })

    await act(async () => {
      await result.current.handleSubmit(onSubmit)()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should reset form to initial values', () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    act(() => {
      result.current.setValues({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      })
    })

    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.isDirty).toBe(false)
    expect(Object.keys(result.current.errors)).toHaveLength(0)
  })

  it('should reset form to specific values', () => {
    const { result } = renderHook(() => useValidation({
        schema,
        initialValues,
        onSubmit: vi.fn()
      }))

    const newValues = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      age: 30
    }

    act(() => {
      result.current.resetToValues(newValues)
    })

    expect(result.current.values).toEqual(newValues)
    expect(result.current.isDirty).toBe(false)
  })
})

describe('useFieldValidation Hook', () => {
  const schema = z.object({
    email: z.string().email('Invalid email format')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate field on change', async () => {
    const { result } = renderHook(() => useFieldValidation(schema, 'email', 'invalid-email', {
        validateOnChange: true
      }))

    expect(result.current.error).toBe('Invalid email format')
    expect(result.current.isValidating).toBe(false)
  })

  it('should not validate field when validateOnChange is false', () => {
    const { result } = renderHook(() => useFieldValidation(schema, 'email', 'invalid-email', {
        validateOnChange: false
      }))

    expect(result.current.error).toBe('')
    expect(result.current.isValidating).toBe(false)
  })

  it('should validate field manually', async () => {
    const { result } = renderHook(() => useFieldValidation(schema, 'email', 'invalid-email', {
        validateOnChange: false
      }))

    let validationResult: boolean
    await act(async () => {
      validationResult = await result.current.validate()
    })

    expect(validationResult!).toBe(false)
    expect(result.current.error).toBe('Invalid email format')
  })

  it('should clear error on valid input', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFieldValidation(schema, 'email', value, {
          validateOnChange: true
        }),
      {
        initialProps: { value: 'invalid-email' }
      }
    )

    expect(result.current.error).toBe('Invalid email format')

    rerender({ value: 'valid@example.com' })

    await act(async () => {
      // Wait for debounced validation
      await new Promise(resolve => setTimeout(resolve, 350))
    })

    expect(result.current.error).toBe('')
  })
})
