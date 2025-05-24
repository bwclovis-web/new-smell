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
    where: { email }
  })
  return user
}
