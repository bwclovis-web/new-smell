// app/models/session.server.ts
import cookie from 'cookie'
import jwt from 'jsonwebtoken'
import { redirect } from 'react-router-dom'

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'

import { ROUTE_PATH as SIGN_IN } from '~/routes/login/SignInPage'

import { getUserById } from './user.server'
export async function getUser(context: { userSession: any }) {
  const userId = context?.userSession?.userId
  if (!userId) {
    return null
  }
  return getUserById(userId)
}

export async function requireUser(context: { userSession: any }) {
  const user = await getUser(context)
  if (!user) {
    throw redirect(SIGN_IN)
  }
  return user
}

export async function login({
  context,
  userId
}: {
  context: { req: any, res: any }
  userId: string
  redirectTo?: string
}) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' })

  // Set Set-Cookie header on the response (HttpOnly cookie)
  context.res.setHeader('Set-Cookie', cookie.serialize('token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }))
  throw redirect(SIGN_IN)
}

export async function logout({ context }: { context: { res: any } }) {
  context.res.setHeader('Set-Cookie', cookie.serialize('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }))
  return redirect(SIGN_IN)
}

export async function requireRoles(
  context: { userSession: any },
  roles: string[]
) {
  const user = await getUser(context)
  if (!user || !roles.includes(user.role)) {
    throw redirect(SIGN_IN) // or custom unauthorized route
  }
  return user
}
