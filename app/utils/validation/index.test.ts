/**
 * Validation utilities tests
 */

import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  createValidationMiddleware,
  sanitizeObject,
  sanitizeString,
  validateAmount,
  validateAndSanitize,
  validateAndTransform,
  validateArray,
  validateData,
  validateEmail,
  validateEnum,
  validateFields,
  validateFormData,
  validateId,
  validateObject,
  validatePagination,
  validatePassword,
  validatePhone,
  validateRating,
  validateUrl,
  validateYear,
} from './index'

// ============================================================================
// VALIDATION DATA TESTS
// ============================================================================

describe('validateData', () => {
  const userSchema = z.object({
    name: z.string().min(2),
    age: z.number().min(0),
  })

  it('should validate correct data', () => {
    const result = validateData(userSchema, { name: 'John', age: 30 })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'John', age: 30 })
    expect(result.errors).toBeUndefined()
  })

  it('should return errors for invalid data', () => {
    const result = validateData(userSchema, { name: 'J', age: -5 })

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors?.length).toBeGreaterThan(0)
  })

  it('should handle unknown fields with stripUnknown', () => {
    const result = validateData(
      userSchema,
      { name: 'John', age: 30, extra: 'field' },
      { stripUnknown: true }
    )

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'John', age: 30 })
  })
})

// ============================================================================
// FORM DATA VALIDATION TESTS
// ============================================================================

describe('validateFormData', () => {
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  })

  it('should validate form data', () => {
    const formData = new FormData()
    formData.append('email', 'user@example.com')
    formData.append('password', 'SecureP@ss123')

    const result = validateFormData(loginSchema, formData)

    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('user@example.com')
  })

  it('should return errors for invalid form data', () => {
    const formData = new FormData()
    formData.append('email', 'invalid-email')
    formData.append('password', 'short')

    const result = validateFormData(loginSchema, formData)

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})

// ============================================================================
// SEARCH PARAMS VALIDATION TESTS
// ============================================================================

describe('validateSearchParams', () => {
  const searchSchema = z.object({
    q: z.string().optional(),
    page: z.string(),
  })

  it('should validate URL search params', () => {
    const params = new URLSearchParams('q=test&page=2')
    const result = validateData(searchSchema, Object.fromEntries(params))

    expect(result.success).toBe(true)
    expect(result.data?.q).toBe('test')
    expect(result.data?.page).toBe('2')
  })
})

// ============================================================================
// SANITIZATION TESTS
// ============================================================================

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    expect(sanitizeString('Hello <b>World</b>')).toBe('Hello bWorld/b')
  })

  it('should remove control characters', () => {
    expect(sanitizeString('Hello\x00World')).toBe('HelloWorld')
    expect(sanitizeString('Test\x1FString')).toBe('TestString')
  })

  it('should trim whitespace', () => {
    expect(sanitizeString('  Hello World  ')).toBe('Hello World')
  })

  it('should handle normal strings', () => {
    expect(sanitizeString('Hello World')).toBe('Hello World')
  })
})

describe('sanitizeObject', () => {
  it('should sanitize string properties', () => {
    const input = {
      name: '  John  ',
      email: '<script>test@example.com</script>',
      age: 30,
    }

    const result = sanitizeObject(input)

    expect(result.name).toBe('John')
    expect(result.email).toBe('scripttest@example.com/script')
    expect(result.age).toBe(30)
  })

  it('should handle nested objects', () => {
    const input = {
      user: {
        name: '  Jane  ',
        bio: '<b>Developer</b>',
      },
      active: true,
    }

    const result = sanitizeObject(input)

    expect(result.user.name).toBe('Jane')
    expect(result.user.bio).toBe('bDeveloper/b')
    expect(result.active).toBe(true)
  })
})

describe('validateAndSanitize', () => {
  const schema = z.object({
    name: z.string(),
    email: z.string().email(),
  })

  it('should validate and sanitize data', () => {
    const result = validateAndSanitize(schema, {
      name: '  John  ',
      email: 'john@example.com',
    })

    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('John')
  })
})

// ============================================================================
// TRANSFORMATION TESTS
// ============================================================================

describe('validateAndTransform', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  })

  it('should validate and transform data', () => {
    const result = validateAndTransform(
      schema,
      { name: 'John', age: 30 },
      data => ({
        ...data,
        displayName: `${data.name} (${data.age})`,
      })
    )

    expect(result.success).toBe(true)
    expect(result.data?.displayName).toBe('John (30)')
  })

  it('should handle transformation errors', () => {
    const result = validateAndTransform(
      schema,
      { name: 'John', age: 30 },
      () => {
        throw new Error('Transform failed')
      }
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Transform failed')
  })

  it('should return validation errors before transformation', () => {
    const result = validateAndTransform(
      schema,
      { name: 'John' }, // Missing age
      data => data
    )

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})

// ============================================================================
// FIELD VALIDATION TESTS
// ============================================================================

describe('validateFields', () => {
  it('should validate multiple fields', () => {
    const validators = {
      name: z.string().min(2),
      age: z.number().min(0),
      email: z.string().email(),
    }

    const result = validateFields(validators, {
      name: 'John',
      age: 30,
      email: 'john@example.com',
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      name: 'John',
      age: 30,
      email: 'john@example.com',
    })
  })

  it('should collect errors from multiple fields', () => {
    const validators = {
      name: z.string().min(2),
      age: z.number().min(0),
    }

    const result = validateFields(validators, {
      name: 'J',
      age: -5,
    })

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors?.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// PAGINATION VALIDATION TESTS
// ============================================================================

describe('validatePagination', () => {
  it('should validate correct pagination params', () => {
    const params = new URLSearchParams('page=2&limit=20')
    const result = validatePagination(params)

    expect(result.page).toBe(2)
    expect(result.limit).toBe(20)
    expect(result.offset).toBe(20)
  })

  it('should use default values', () => {
    const params = new URLSearchParams()
    const result = validatePagination(params)

    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
    expect(result.offset).toBe(0)
  })

  it('should throw for invalid page', () => {
    const params = new URLSearchParams('page=0')
    expect(() => validatePagination(params)).toThrow('Page must be 1 or greater')
  })

  it('should throw for invalid limit', () => {
    const params = new URLSearchParams('limit=101')
    expect(() => validatePagination(params)).toThrow('Limit must be between 1 and 100')
  })
})

// ============================================================================
// SPECIFIC FIELD VALIDATORS TESTS
// ============================================================================

describe('validateId', () => {
  it('should validate valid IDs', () => {
    expect(validateId('abc123')).toBe('abc123')
    expect(validateId('user-id-123')).toBe('user-id-123')
  })

  it('should throw for empty IDs', () => {
    expect(() => validateId(null)).toThrow('ID is required')
    expect(() => validateId('')).toThrow('ID is required')
  })

  it('should throw for invalid characters', () => {
    expect(() => validateId('id with spaces')).toThrow('invalid characters')
    expect(() => validateId('id@special')).toThrow('invalid characters')
  })

  it('should use custom field name', () => {
    expect(() => validateId(null, 'User ID')).toThrow('User ID is required')
  })
})

describe('validateEmail', () => {
  it('should validate and normalize emails', () => {
    expect(validateEmail('USER@EXAMPLE.COM')).toBe('user@example.com')
    expect(validateEmail('user@example.com')).toBe('user@example.com')
  })

  it('should throw for invalid emails', () => {
    expect(() => validateEmail('invalid')).toThrow('Invalid email format')
    expect(() => validateEmail('invalid@')).toThrow('Invalid email format')
  })
})

describe('validatePassword', () => {
  it('should validate strong passwords', () => {
    expect(() => validatePassword('SecureP@ss123')).not.toThrow()
  })

  it('should throw for weak passwords', () => {
    expect(() => validatePassword('short')).toThrow('at least 8 characters')
    expect(() => validatePassword('nouppercase1!')).toThrow('uppercase letter')
    expect(() => validatePassword('NOLOWERCASE1!')).toThrow('lowercase letter')
    expect(() => validatePassword('NoNumbers!')).toThrow('number')
    expect(() => validatePassword('NoSpecial123')).toThrow('special character')
    expect(() => validatePassword('Has Space1!')).toThrow('cannot contain spaces')
  })
})

describe('validateUrl', () => {
  it('should validate URLs', () => {
    expect(validateUrl('https://example.com')).toBe('https://example.com/')
    expect(validateUrl('http://example.com/path')).toBe('http://example.com/path')
  })

  it('should throw for invalid URLs', () => {
    expect(() => validateUrl('invalid')).toThrow('Invalid URL format')
    expect(() => validateUrl('example.com')).toThrow('Invalid URL format')
  })
})

describe('validatePhone', () => {
  it('should validate phone numbers', () => {
    expect(validatePhone('+1234567890')).toBe('+1234567890')
    expect(validatePhone('1234567890')).toBe('1234567890')
  })

  it('should throw for invalid phone numbers', () => {
    expect(() => validatePhone('abc')).toThrow('Invalid phone number format')
    expect(() => validatePhone('12 34')).toThrow('Invalid phone number format')
    expect(() => validatePhone('0123456789')).toThrow('Invalid phone number format')
  })
})

describe('validateYear', () => {
  it('should validate years', () => {
    expect(validateYear('1900')).toBe(1900)
    expect(validateYear('2023')).toBe(2023)
    expect(validateYear('2099')).toBe(2099)
  })

  it('should throw for invalid years', () => {
    expect(() => validateYear('1899')).toThrow('between 1900 and 2099')
    expect(() => validateYear('2100')).toThrow('between 1900 and 2099')
    expect(() => validateYear('abc')).toThrow('between 1900 and 2099')
  })
})

describe('validateRating', () => {
  it('should validate ratings', () => {
    expect(validateRating(1)).toBe(1)
    expect(validateRating(3)).toBe(3)
    expect(validateRating(5)).toBe(5)
  })

  it('should throw for invalid ratings', () => {
    expect(() => validateRating(0)).toThrow('between 1 and 5')
    expect(() => validateRating(6)).toThrow('between 1 and 5')
    expect(() => validateRating(3.5)).toThrow('integer')
  })
})

describe('validateAmount', () => {
  it('should validate amounts', () => {
    expect(validateAmount('10')).toBe(10)
    expect(validateAmount('10.5')).toBe(10.5)
    expect(validateAmount('10.99')).toBe(10.99)
  })

  it('should throw for invalid amounts', () => {
    expect(() => validateAmount('-10')).toThrow('positive number')
    expect(() => validateAmount('10.999')).toThrow('at most 2 decimal places')
    expect(() => validateAmount('abc')).toThrow('positive number')
  })
})

describe('validateEnum', () => {
  it('should validate enum values', () => {
    const values = ['red', 'green', 'blue'] as const
    expect(validateEnum('red', values)).toBe('red')
    expect(validateEnum('blue', values)).toBe('blue')
  })

  it('should throw for invalid enum values', () => {
    const values = ['red', 'green', 'blue'] as const
    expect(() => validateEnum('yellow', values)).toThrow('must be one of')
  })

  it('should use custom field name', () => {
    const values = ['red', 'green', 'blue'] as const
    expect(() => validateEnum('yellow', values, 'Color')).toThrow('Color must be one of')
  })
})

describe('validateArray', () => {
  const numberValidator = (value: unknown) => {
    if (typeof value !== 'number') {
      throw new Error('Must be a number')
    }
    return value
  }

  it('should validate array of values', () => {
    const result = validateArray([1, 2, 3], numberValidator)
    expect(result).toEqual([1, 2, 3])
  })

  it('should throw for non-array', () => {
    expect(() => validateArray('not-array' as any, numberValidator)).toThrow('must be an array')
  })

  it('should throw for invalid array items', () => {
    expect(() => validateArray([1, 'invalid', 3], numberValidator)).toThrow('[1]:')
  })
})

describe('validateObject', () => {
  const validators = {
    name: (value: unknown) => {
      if (typeof value !== 'string') {
        throw new Error('Must be a string')
      }
      return value
    },
    age: (value: unknown) => {
      if (typeof value !== 'number') {
        throw new Error('Must be a number')
      }
      return value
    },
  }

  it('should validate object properties', () => {
    const result = validateObject(
      { name: 'John', age: 30 },
      validators
    )

    expect(result).toEqual({ name: 'John', age: 30 })
  })

  it('should throw for non-object', () => {
    expect(() => validateObject('not-object', validators)).toThrow('must be an object')
  })

  it('should throw for invalid properties', () => {
    expect(() => validateObject(
      { name: 123, age: 30 },
      validators
    )).toThrow('name:')
  })
})

// ============================================================================
// MIDDLEWARE TESTS
// ============================================================================

describe('createValidationMiddleware', () => {
  const schema = z.object({
    name: z.string(),
    email: z.string().email(),
  })

  it('should create middleware that validates JSON data', async () => {
    const middleware = createValidationMiddleware(schema)

    const request = new Request('https://example.com/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
    })

    const result = await middleware(request)

    expect(result.name).toBe('John')
    expect(result.email).toBe('john@example.com')
  })

  it('should create middleware that validates FormData', async () => {
    const middleware = createValidationMiddleware(schema)

    const formData = new FormData()
    formData.append('name', 'John')
    formData.append('email', 'john@example.com')

    const request = new Request('https://example.com/api', {
      method: 'POST',
      body: formData,
    })

    const result = await middleware(request)

    expect(result.name).toBe('John')
    expect(result.email).toBe('john@example.com')
  })

  it('should throw Response for invalid data', async () => {
    const middleware = createValidationMiddleware(schema)

    const request = new Request('https://example.com/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'invalid-email' }),
    })

    await expect(middleware(request)).rejects.toThrow(Response)
  })
})

