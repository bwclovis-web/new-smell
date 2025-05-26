// app/models/session.server.ts
import { redirect } from 'react-router-dom'

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
  context: { userSession: any, req: any }
  userId: string
}) {
  try {
    const user = await getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Set user session
    context.req.session.userId = user.id
    context.req.session.role = user.role

    // Save session
    await context.req.session.save()

    return redirect('/') // Redirect to home or dashboard after login
  } catch (error) {
    console.error('Error during login:', error)
    throw new Error('Login failed')
  }
}

export async function logout({ context }: { context: { req: any } }) {
  await context.req.session.destroy()
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
