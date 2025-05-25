import bcrypt from 'bcryptjs'

import { prisma } from '~/db.server'

export const createUser = async (data: FormData) => {
  const password = data.get('password')
  if (typeof password !== 'string') {
    throw new Error('Password is required and must be a string')
  }

  const user = await prisma.user.create({
    data: {
      email: data.get('email') as string,
      password: await bcrypt.hash(password, 10)
    }
  })
  return user
}

export const getUserByName = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true
    }
  })
  return user
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

// eslint-disable-next-line max-statements
export const signInCustomer = async (data: FormData) => {
  const password = data.get('password') as string
  const email = data.get('email') as string
  const user = await getUserByName(email)
  if (!user) {
    return null
  }
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    return null
  }
  return user
}
