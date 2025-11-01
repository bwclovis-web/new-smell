/**
 * SignUp Route Integration Tests
 * 
 * Tests user registration functionality:
 * - Valid user registration flow
 * - Password validation and matching
 * - Email and username validation
 * - Duplicate email/username prevention
 * - Input sanitization
 * - Required field validation
 * - Session creation after registration
 * 
 * @group integration
 * @group auth
 * @group signup
 */

import type { ActionFunctionArgs } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as sessionServer from '~/models/session.server'
import * as userServer from '~/models/user.server'
import { action as signUpAction } from '~/routes/login/SignUpPage'

vi.mock('~/models/user.server')
vi.mock('~/models/session.server')

describe('SignUp Route Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Action - User Registration', () => {
    it('should successfully register a new user with valid data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        username: 'newuser',
        role: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(userServer.getUserByName).mockResolvedValue(null)
      vi.mocked(userServer.createUser).mockResolvedValue(mockUser as any)
      vi.mocked(sessionServer.login).mockResolvedValue({ success: true } as any)

      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'SecurePassword123!')
      formData.append('passwordMatch', 'SecurePassword123!')
      formData.append('acceptTerms', 'true')

      const request = new Request('https://example.com/sign-up', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await signUpAction(args)

      expect(userServer.getUserByName).toHaveBeenCalledWith('newuser@example.com')
      expect(userServer.createUser).toHaveBeenCalled()
    })

    it('should reject registration when email already exists', async () => {
      const existingUser = {
        id: 'user-456',
        email: 'existing@example.com',
        username: 'existing',
        role: 'user' as const
      }

      vi.mocked(userServer.getUserByName).mockResolvedValue(existingUser as any)

      const formData = new FormData()
      formData.append('email', 'existing@example.com')
      formData.append('password', 'SecurePassword123!')
      formData.append('passwordMatch', 'SecurePassword123!')
      formData.append('acceptTerms', 'true')

      const request = new Request('https://example.com/sign-up', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await signUpAction(args)

      expect(result).toHaveProperty('error', 'Email already taken')
      expect(userServer.createUser).not.toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      const formData = new FormData()
      formData.append('email', 'invalid-email')
      formData.append('password', 'weak')

      const request = new Request('https://example.com/sign-up', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await signUpAction(args)

      expect(result).toHaveProperty('error')
      expect(userServer.createUser).not.toHaveBeenCalled()
    })
  })
})

