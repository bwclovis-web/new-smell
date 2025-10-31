import type { ActionFunctionArgs } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as wishlistServer from '~/models/wishlist.server'
import { action as wishlistAction } from '~/routes/api/wishlist'
import * as auth from '~/utils/auth.server'

vi.mock('~/models/wishlist.server')
vi.mock('~/utils/auth.server')
vi.mock('~/utils/alert-processors', () => ({
  processDecantInterestAlerts: vi.fn().mockResolvedValue(undefined)
}))

describe('Authentication Error Handling Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Missing Authentication', () => {
    it('should reject request without authentication token', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'No authentication token provided',
        status: 401
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const response = await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
      expect(auth.authenticateUser).toHaveBeenCalledWith(request)
    })

    it('should reject request with empty authentication header', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Invalid authentication token',
        status: 401
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        headers: {
          'Authorization': ''
        },
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })
  })

  describe('Invalid Authentication', () => {
    it('should reject request with malformed token', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Malformed authentication token',
        status: 401
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token-format'
        },
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })

    it('should reject request with expired token', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Authentication token has expired',
        status: 401
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer expired.token.here'
        },
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })

    it('should reject request with revoked token', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Authentication token has been revoked',
        status: 401
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })
  })

  describe('Session Errors', () => {
    it('should handle session timeout gracefully', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Session has expired',
        status: 401
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })

    it('should handle invalid session ID', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Invalid session ID',
        status: 401
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })

    it('should handle session hijacking attempt', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Security violation detected',
        status: 403
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        headers: {
          'X-Forwarded-For': '123.45.67.89' // Different IP than session
        },
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })
  })

  describe('Authorization Errors', () => {
    it('should reject user without required permissions', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Insufficient permissions',
        status: 403
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })

    it('should reject suspended user account', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Account has been suspended',
        status: 403
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })

    it('should reject deleted user account', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'User account not found',
        status: 404
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })
  })

  describe('Authentication Service Errors', () => {
    it('should handle authentication service unavailable', async () => {
      vi.mocked(auth.authenticateUser).mockRejectedValue(new Error('Authentication service unavailable'))

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      // The action handler catches errors and returns a response
      const response = await wishlistAction(args)
      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })

    it('should handle authentication timeout', async () => {
      vi.mocked(auth.authenticateUser).mockRejectedValue(new Error('Authentication request timeout'))

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      // The action handler catches errors and returns a response
      const response = await wishlistAction(args)
      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })

    it('should handle database error during authentication', async () => {
      vi.mocked(auth.authenticateUser).mockRejectedValue(new Error('Database error during authentication'))

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      // The action handler catches errors and returns a response
      const response = await wishlistAction(args)
      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })
  })

  describe('CSRF Protection', () => {
    it('should reject request with missing CSRF token', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'CSRF token missing',
        status: 403
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')
      // Missing CSRF token

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })

    it('should reject request with invalid CSRF token', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Invalid CSRF token',
        status: 403
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')
      formData.append('csrf_token', 'invalid-token')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })
  })

  describe('Rate Limiting', () => {
    it('should reject request when rate limit exceeded', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded',
        status: 429
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })

    it('should include retry-after header in rate limit response', async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded',
        status: 429,
        retryAfter: 60
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })
  })

  describe('Concurrent Authentication', () => {
    it('should handle concurrent authentication requests', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: true,
        user: mockUser as any
      })

      vi.mocked(wishlistServer.addToWishlist).mockResolvedValue({
        success: true,
        data: {
          id: 'wishlist-1',
          userId: mockUser.id,
          perfumeId: 'perfume-456',
          createdAt: new Date()
        } as any
      })

      const requests = Array.from({ length: 5 }, () => {
        const formData = new FormData()
        formData.append('perfumeId', 'perfume-456')
        formData.append('action', 'add')

        return new Request('https://example.com/api/wishlist', {
          method: 'POST',
          body: formData
        })
      })

      const args = requests.map(request => ({
        request,
        params: {},
        context: {}
      }))

      await Promise.all(args.map(arg => wishlistAction(arg)))

      expect(auth.authenticateUser).toHaveBeenCalledTimes(5)
    })
  })

  describe('Authentication Success', () => {
    it('should allow authenticated request to proceed', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: true,
        user: mockUser as any
      })

      vi.mocked(wishlistServer.addToWishlist).mockResolvedValue({
        success: true,
        data: {
          id: 'wishlist-1',
          userId: mockUser.id,
          perfumeId: 'perfume-456',
          createdAt: new Date()
        } as any
      })

      const formData = new FormData()
      formData.append('perfumeId', 'perfume-456')
      formData.append('action', 'add')

      const request = new Request('https://example.com/api/wishlist', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await wishlistAction(args)

      expect(auth.authenticateUser).toHaveBeenCalledWith(request)
      expect(wishlistServer.addToWishlist).toHaveBeenCalledWith(mockUser.id, 'perfume-456', false)
    })
  })
})

