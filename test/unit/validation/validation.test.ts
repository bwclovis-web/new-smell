/**
 * Comprehensive validation tests
 * Tests all validation schemas, utilities, and components
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  AdminUserFormSchema,
  ChangePasswordSchema,
  CreateCommentSchema,
  CreatePerfumeHouseSchema,
  CreatePerfumeSchema,
  CreateRatingSchema,
  DataQualityReportSchema,
  PerfumeSearchSchema,
  UpdateProfileSchema,
  UpdateUserPerfumeSchema,
  UserFormSchema,
  UserLogInSchema,
  WishlistActionSchema
} from '../../../app/utils/formValidationSchemas'
import {
  validateAmount,
  validateAndSanitize,
  validateArray,
  validateData,
  validateEmail,
  validateEnum,
  validateFormData,
  validateId,
  validateJsonData,
  validateObject,
  validatePassword,
  validatePhone,
  validateRating,
  validateSearchParams,
  validateUrl,
  validateYear
} from '../../../app/utils/validation'

describe('Validation Utilities', () => {
  describe('validateData', () => {
    it('should validate valid data successfully', () => {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email()
      })

      const data = { name: 'John Doe', email: 'john@example.com' }
      const result = validateData(schema, data)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(data)
    })

    it('should return validation errors for invalid data', () => {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email()
      })

      const data = { name: 'J', email: 'invalid-email' }
      const result = validateData(schema, data)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors?.[0].field).toBe('name')
      expect(result.errors?.[1].field).toBe('email')
    })
  })

  describe('validateFormData', () => {
    it('should validate form data successfully', () => {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email()
      })

      const formData = new FormData()
      formData.append('name', 'John Doe')
      formData.append('email', 'john@example.com')

      const result = validateFormData(schema, formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ name: 'John Doe', email: 'john@example.com' })
    })
  })

  describe('validateId', () => {
    it('should validate valid IDs', () => {
      expect(() => validateId('valid-id-123')).not.toThrow()
      expect(() => validateId('user_123')).not.toThrow()
      expect(() => validateId('item-456')).not.toThrow()
    })

    it('should reject invalid IDs', () => {
      expect(() => validateId('')).toThrow('ID is required')
      expect(() => validateId('invalid id')).toThrow('ID contains invalid characters')
      expect(() => validateId('invalid@id')).toThrow('ID contains invalid characters')
    })
  })

  describe('validateEmail', () => {
    it('should validate valid emails', () => {
      expect(() => validateEmail('test@example.com')).not.toThrow()
      expect(() => validateEmail('user.name@domain.co.uk')).not.toThrow()
    })

    it('should reject invalid emails', () => {
      expect(() => validateEmail('invalid-email')).toThrow('Invalid email format')
      expect(() => validateEmail('@example.com')).toThrow('Invalid email format')
      expect(() => validateEmail('test@')).toThrow('Invalid email format')
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(() => validatePassword('StrongPass123!')).not.toThrow()
      expect(() => validatePassword('MyP@ssw0rd')).not.toThrow()
    })

    it('should reject weak passwords', () => {
      expect(() => validatePassword('weak')).toThrow('Password must be at least 8 characters long')
      expect(() => validatePassword('weakpassword')).toThrow('Password must contain at least one uppercase letter')
      expect(() => validatePassword('WEAKPASSWORD')).toThrow('Password must contain at least one lowercase letter')
      expect(() => validatePassword('WeakPassword')).toThrow('Password must contain at least one number')
      expect(() => validatePassword('WeakPass123')).toThrow('Password must contain at least one special character')
      expect(() => validatePassword('Weak Pass123!')).toThrow('Password cannot contain spaces')
    })
  })

  describe('validateUrl', () => {
    it('should validate valid URLs', () => {
      expect(() => validateUrl('https://example.com')).not.toThrow()
      expect(() => validateUrl('http://subdomain.example.com/path')).not.toThrow()
    })

    it('should reject invalid URLs', () => {
      expect(() => validateUrl('not-a-url')).toThrow('Invalid URL format')
      expect(() => validateUrl('ftp://example.com')).toThrow('Invalid URL format')
    })
  })

  describe('validatePhone', () => {
    it('should validate valid phone numbers', () => {
      expect(() => validatePhone('+1234567890')).not.toThrow()
      expect(() => validatePhone('1234567890')).not.toThrow()
    })

    it('should reject invalid phone numbers', () => {
      expect(() => validatePhone('abc123')).toThrow('Invalid phone number format')
      expect(() => validatePhone('123')).toThrow('Invalid phone number format')
    })
  })

  describe('validateYear', () => {
    it('should validate valid years', () => {
      expect(() => validateYear('2023')).not.toThrow()
      expect(() => validateYear('1990')).not.toThrow()
    })

    it('should reject invalid years', () => {
      expect(() => validateYear('1899')).toThrow('Year must be between 1900 and 2099')
      expect(() => validateYear('2100')).toThrow('Year must be between 1900 and 2099')
      expect(() => validateYear('abc')).toThrow('Year must be between 1900 and 2099')
    })
  })

  describe('validateRating', () => {
    it('should validate valid ratings', () => {
      expect(() => validateRating(1)).not.toThrow()
      expect(() => validateRating(3)).not.toThrow()
      expect(() => validateRating(5)).not.toThrow()
    })

    it('should reject invalid ratings', () => {
      expect(() => validateRating(0)).toThrow('Rating must be an integer between 1 and 5')
      expect(() => validateRating(6)).toThrow('Rating must be an integer between 1 and 5')
      expect(() => validateRating(2.5)).toThrow('Rating must be an integer between 1 and 5')
    })
  })

  describe('validateAmount', () => {
    it('should validate valid amounts', () => {
      expect(() => validateAmount('100')).not.toThrow()
      expect(() => validateAmount('100.50')).not.toThrow()
      expect(() => validateAmount('0.99')).not.toThrow()
    })

    it('should reject invalid amounts', () => {
      expect(() => validateAmount('-100')).toThrow('Amount must be a positive number')
      expect(() => validateAmount('100.999')).toThrow('Amount must have at most 2 decimal places')
      expect(() => validateAmount('abc')).toThrow('Amount must be a positive number')
    })
  })

  describe('validateEnum', () => {
    it('should validate valid enum values', () => {
      expect(() => validateEnum('add', ['add', 'remove'] as const)).not.toThrow()
      expect(() => validateEnum('remove', ['add', 'remove'] as const)).not.toThrow()
    })

    it('should reject invalid enum values', () => {
      expect(() => validateEnum('invalid', ['add', 'remove'] as const)).toThrow('Value must be one of: add, remove')
    })
  })

  describe('validateArray', () => {
    it('should validate valid arrays', () => {
      const result = validateArray(['1', '2', '3'], val => parseInt(val as string, 10))
      expect(result).toEqual([1, 2, 3])
    })

    it('should reject invalid arrays', () => {
      expect(() => validateArray('not-array', val => val)).toThrow('Array must be an array')
    })
  })

  describe('validateObject', () => {
    it('should validate valid objects', () => {
      const result = validateObject(
        { name: 'John', age: '25' },
        {
          name: val => val as string,
          age: val => parseInt(val as string, 10)
        }
      )
      expect(result).toEqual({ name: 'John', age: 25 })
    })

    it('should reject invalid objects', () => {
      expect(() => validateObject('not-object', {})).toThrow('Object must be an object')
    })
  })
})

describe('Form Validation Schemas', () => {
  describe('CreatePerfumeHouseSchema', () => {
    it('should validate valid perfume house data', () => {
      const validData = {
        name: 'Test House',
        description: 'A test perfume house',
        website: 'https://example.com',
        country: 'USA',
        founded: '2020',
        email: 'test@example.com',
        phone: '+1234567890',
        address: '123 Test Street'
      }

      const result = CreatePerfumeHouseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid perfume house data', () => {
      const invalidData = {
        name: 'A', // Too short
        description: 'Short', // Too short
        website: 'not-a-url',
        email: 'invalid-email',
        phone: 'abc123',
        founded: '1800' // Too old
      }

      const result = CreatePerfumeHouseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors).toHaveLength(6)
      }
    })
  })

  describe('CreatePerfumeSchema', () => {
    it('should validate valid perfume data', () => {
      const validData = {
        name: 'Test Perfume',
        description: 'A test perfume description',
        house: 'house-id',
        image: 'https://example.com/image.jpg'
      }

      const result = CreatePerfumeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid perfume data', () => {
      const invalidData = {
        name: 'A', // Too short
        description: 'Short', // Too short
        house: '', // Empty
        image: 'not-a-url'
      }

      const result = CreatePerfumeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('CreateRatingSchema', () => {
    it('should validate valid rating data', () => {
      const validData = {
        perfumeId: 'perfume-id',
        longevity: 4,
        sillage: 3,
        overall: 5
      }

      const result = CreateRatingSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject rating data without any ratings', () => {
      const invalidData = {
        perfumeId: 'perfume-id'
      }

      const result = CreateRatingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid rating values', () => {
      const invalidData = {
        perfumeId: 'perfume-id',
        overall: 6 // Too high
      }

      const result = CreateRatingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('UserFormSchema', () => {
    it('should validate valid user registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        acceptTerms: true
      }

      const result = UserFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'DifferentPass123!',
        acceptTerms: true
      }

      const result = UserFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject weak passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        acceptTerms: true
      }

      const result = UserFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('ChangePasswordSchema', () => {
    it('should validate valid password change data', () => {
      const validData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmNewPassword: 'NewPass123!'
      }

      const result = ChangePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject when new password matches current password', () => {
      const invalidData = {
        currentPassword: 'SamePass123!',
        newPassword: 'SamePass123!',
        confirmNewPassword: 'SamePass123!'
      }

      const result = ChangePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('PerfumeSearchSchema', () => {
    it('should validate valid search parameters', () => {
      const validData = {
        query: 'test perfume',
        houseName: 'Test House',
        type: 'EDP',
        priceRange: { min: 50, max: 200 },
        ratingRange: { min: 3, max: 5 },
        notes: ['vanilla', 'rose'],
        sortBy: 'name',
        sortOrder: 'asc'
      }

      const result = PerfumeSearchSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid price ranges', () => {
      const invalidData = {
        priceRange: { min: -10, max: 200 }
      }

      const result = PerfumeSearchSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid rating ranges', () => {
      const invalidData = {
        ratingRange: { min: 0, max: 6 }
      }

      const result = PerfumeSearchSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

describe('Data Sanitization', () => {
  describe('validateAndSanitize', () => {
    it('should sanitize string data', () => {
      const schema = z.object({
        name: z.string(),
        description: z.string()
      })

      const data = {
        name: '  Test Name  ',
        description: 'Test <script>alert("xss")</script> Description'
      }

      const result = validateAndSanitize(schema, data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Name')
        expect(result.data.description).toBe('Test alert("xss") Description')
      }
    })
  })
})
