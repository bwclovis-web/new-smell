/**
 * Security Testing Route
 * This route is for manually testing security hardening features
 * DELETE THIS FILE after testing
 */

import type { LoaderFunctionArgs } from 'react-router'

import { createError } from '~/utils/errorHandling'
import { ServerErrorHandler } from '~/utils/errorHandling.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const testType = url.searchParams.get('test')

  try {
    switch (testType) {
      case 'sensitive-context':
        // Test context sanitization
        throw createError.authentication('Login failed', {
          email: 'user@example.com',
          password: 'secret123',
          apiKey: 'test-api-key-12345',
          token: 'bearer-token-xyz',
          creditCard: '4111111111111111',
          username: 'johndoe',
          preferences: {
            theme: 'dark',
            sessionId: 'session-abc-123'
          }
        })

      case 'nested-sensitive':
        // Test nested sensitive data
        throw createError.server('Configuration error', {
          config: {
            database: {
              host: 'localhost',
              port: 5432,
              password: 'db-password-secret',
              username: 'dbadmin'
            },
            api: {
              endpoint: 'https://api.example.com',
              apiKey: 'api-key-secret-123',
              secret: 'jwt-secret-key'
            }
          }
        })

      case 'validation':
        // Test validation error
        throw createError.validation('Invalid email address', {
          field: 'email',
          value: 'invalid-email',
          userId: '12345'
        })

      case 'database':
        // Test database error
        throw createError.database('Connection timeout', {
          operation: 'SELECT',
          table: 'users',
          query: 'SELECT * FROM users WHERE id = $1'
        })

      case 'network':
        // Test network error
        throw createError.network('Failed to fetch data', {
          url: 'https://external-api.com/data',
          method: 'GET',
          timeout: 5000
        })

      case 'authorization':
        // Test authorization error
        throw createError.authorization('Admin access required', {
          userId: '12345',
          requiredRole: 'admin',
          currentRole: 'user'
        })

      default:
        return new Response(JSON.stringify({
          message: 'Security Test Route',
          availableTests: [
            'sensitive-context',
            'nested-sensitive',
            'validation',
            'database',
            'network',
            'authorization'
          ],
          usage: '?test=<test-name>',
          instructions: [
            '1. Test in development: NODE_ENV=development npm run dev',
            '2. Test in production: NODE_ENV=production npm run start',
            '3. Compare responses between environments',
            '4. Check browser Network tab for headers',
            '5. Check server logs for sanitization',
            '6. DELETE THIS FILE after testing'
          ]
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    const appError = ServerErrorHandler.handle(error, {
      testRoute: true,
      requestUrl: request.url
    })
    
    return ServerErrorHandler.createErrorResponse(appError)
  }
}

