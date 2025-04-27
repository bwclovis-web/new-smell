/* eslint-disable max-statements */
import { Password, User } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { redirect } from 'react-router'

import { prisma } from '~/db.server'
import { auth } from '~/modules/auth/auth.server'

export const verifyUserLogin = async (email: User['email'], password: Password['hash']) => {
  const userWithPassword = await prisma.user.findUnique({
    include: { password: true },
    where: { email }
  })

  if (!userWithPassword || !userWithPassword.password) {
    throw new Error('Customer not found')
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  )

  if (!isPasswordValid) {
    throw new Error('Password is not Valid')
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword

  return userWithoutPassword
}

export const fetchSessionUser = async (
  request: Request,
  redirectUrl: string
) => {
  const sessionUser = await auth.isAuthenticated(request)
  if (!sessionUser) {
    if (!redirectUrl) {
      throw redirect('/')
    }
    else {
      throw redirect(redirectUrl)
    }
  }
  return sessionUser
}

export const fetchUser = async (request: Request, redirectUrl: string) => {
  const sessionUser = await auth.isAuthenticated(request)
  const user = sessionUser?.id
    ? await prisma.user.findUnique({
      include: { password: true },
      where: { id: sessionUser.id }
    })
    : null

  if (!user) {
    if (!redirectUrl) {
      throw redirect('/')
    }
    else {
      throw redirect(redirectUrl)
    }
  }

  return user
}
