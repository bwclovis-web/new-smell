// app/models/session.server.ts
import { redirect } from 'react-router-dom'

import { ROUTE_PATH as LOGIN_PATH } from '~/routes/login/LoginPage'

import { getUserById } from './user.server'
export async function getUser(context: { userSession: any }) {
  const userId = context.userSession?.userId
  if (!userId) {
    return null
  }
  return getUserById(userId)
}

export async function requireUser(context: { userSession: any }) {
  const user = await getUser(context)
  if (!user) {
    throw redirect(LOGIN_PATH)
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
  context.userSession.userId = userId
  await context.req.session.save()
  return redirect('/')
}

export async function logout({ context }: { context: { req: any } }) {
  await context.req.session.destroy()
  return redirect(LOGIN_PATH)
}
