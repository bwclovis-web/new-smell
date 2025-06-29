import { parseCookies, verifyJwt } from '@api/utils'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'

import { getAllPerfumes } from '~/models/perfume.server'
import { getUserById } from '~/models/user.server'
import { addUserPerfume, getUserPerfumes, removeUserPerfume } from '~/models/user.server'

// Type definitions
type AuthResult = {
  success: boolean;
  error?: string;
  status?: number;
  user?: any;
}

// Helper functions for authentication
const getTokenFromRequest = (request: Request) => {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies({ headers: { cookie: cookieHeader } })
  return cookies.token
}

const validateToken = (token: string): { valid: boolean; userId?: string } => {
  if (!token) {
    return { valid: false }
  }

  const payload = verifyJwt(token)
  if (!payload || !payload.userId) {
    return { valid: false }
  }

  return { valid: true, userId: payload.userId }
}

// Helper function to handle user lookup based on token validation
const getUserFromValidation = async (validation: {
  valid: boolean;
  userId?: string
}): Promise<AuthResult> => {
  if (!validation.valid || !validation.userId) {
    return { success: false, error: 'Invalid authentication token', status: 401 }
  }

  const user = await getUserById(validation.userId)
  if (!user) {
    return { success: false, error: 'User not found', status: 401 }
  }

  return { success: true, user }
}

// Helper function to authenticate the user
const authenticateUser = async (request: Request): Promise<AuthResult> => {
  const token = getTokenFromRequest(request)

  if (!token) {
    return { success: false, error: 'User not authenticated', status: 401 }
  }

  const validation = validateToken(token)
  return getUserFromValidation(validation)
}

// Helper function to process the user perfume action
const processUserPerfumeAction = async (
  user: any,
  perfumeId: string,
  actionType: string,
  amount?: string
) => {
  if (actionType === 'add') {
    return await addUserPerfume(user.id, perfumeId, amount)
  }

  if (actionType === 'remove') {
    return await removeUserPerfume(user.id, perfumeId)
  }

  return { success: false, error: 'Invalid action' }
}

// Helper function to handle successful authentication in loader
const handleAuthSuccess = async (user: any) => {
  const userPerfumes = await getUserPerfumes(user.id)
  const allPerfumes = await getAllPerfumes()

  return new Response(
    JSON.stringify({ success: true, userPerfumes, allPerfumes }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// Helper function to handle authentication errors
const handleAuthError = (result: AuthResult) => new Response(
  JSON.stringify({ success: false, error: result.error }),
  { status: result.status, headers: { 'Content-Type': 'application/json' } }
)

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const authResult = await authenticateUser(request)

    if (!authResult.success) {
      return handleAuthError(authResult)
    }

    return handleAuthSuccess(authResult.user)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user perfumes:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch perfumes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Helper function to validate perfume ID
const validatePerfumeId = (perfumeId: string | null) => {
  if (!perfumeId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Perfume ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return null
}

// Helper function to handle errors in action
const handleActionError = (error: any) => {
  // eslint-disable-next-line no-console
  console.error('User perfume operation error:', error)
  return new Response(
    JSON.stringify({ success: false, error: 'Failed to update user perfumes' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}

// Helper function to process form data
const processFormData = async (request: Request) => {
  const formData = await request.formData()
  return {
    perfumeId: formData.get('perfumeId') as string,
    actionType: formData.get('action') as string,
    amount: formData.get('amount') as string | undefined
  }
}

// Helper function to prepare perfume action
const prepareAction = async (
  authResult: AuthResult,
  perfumeId: string,
  actionType: string,
  amount?: string
) => {
  const result = await processUserPerfumeAction(
    authResult.user,
    perfumeId,
    actionType,
    amount
  )

  return new Response(
    JSON.stringify(result),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// Helper function to process action request
const processActionRequest = async (request: Request) => {
  const { perfumeId, actionType, amount } = await processFormData(request)

  const validationError = validatePerfumeId(perfumeId)
  if (validationError) {
    return validationError
  }

  const authResult = await authenticateUser(request)
  if (!authResult.success) {
    return handleAuthError(authResult)
  }

  return prepareAction(authResult, perfumeId, actionType, amount)
}

// Action function to add or remove user perfumes
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    return await processActionRequest(request)
  } catch (error) {
    return handleActionError(error)
  }
}
