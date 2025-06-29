import { parseCookies, verifyJwt } from '@api/utils'

import { getUserById } from '~/models/user.server'

export type AuthResult = {
  success: boolean
  error?: string
  status?: number
  user?: any
}

const getTokenFromRequest = (request: Request) => {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies({ headers: { cookie: cookieHeader } })
  return cookies.token
}

const validateToken = (token: string | undefined) => {
  if (!token) {
    return { valid: false, error: 'User not authenticated' }
  }

  const payload = verifyJwt(token)
  if (!payload || !payload.userId) {
    return { valid: false, error: 'Invalid authentication token' }
  }

  return { valid: true, userId: payload.userId }
}

type ValidationResult = {
  valid: boolean
  userId?: string
  error?: string
}

const getUserFromValidation = async (validation: ValidationResult) => {
  if (!validation.valid || !validation.userId) {
    return { success: false, error: validation.error, status: 401 }
  }

  const user = await getUserById(validation.userId)
  if (!user) {
    return { success: false, error: 'User not found', status: 401 }
  }

  return { success: true, user }
}

export const authenticateUser = async (request: Request): Promise<AuthResult> => {
  try {
    const token = getTokenFromRequest(request)
    const validation = validateToken(token)
    return await getUserFromValidation(validation)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Authentication error:', error)
    return { success: false, error: 'Authentication failed', status: 500 }
  }
}
