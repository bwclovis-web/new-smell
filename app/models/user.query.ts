/**
 * User query functions - separated to avoid circular dependencies
 * This file should NOT import from session.server.ts or any files that import from session.server.ts
 */

import { prisma } from '~/db.server'

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id }
  })
  return user
}

export const getUserByName = async (username: string) => {
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive'
      }
    }
  })
  return user
}

export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  })
  return user
}

export const getAllUsers = async () => {
  const users = await prisma.user.findMany()
  return users
}

