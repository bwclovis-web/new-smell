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

export const getUserPerfumes = async (userId: string) => {
  const userPerfumes = await prisma.userPerfume.findMany({
    where: { userId },
    include: {
      perfume: {
        include: {
          perfumeHouse: true
        }
      }
    }
  })
  return userPerfumes
}

export const addUserPerfume = async (userId: string, perfumeId: string) => {
  try {
    // Check if the perfume is already in the user's collection
    const existingPerfume = await prisma.userPerfume.findFirst({
      where: {
        userId,
        perfumeId
      }
    })

    if (existingPerfume) {
      return { success: false, error: 'Perfume already in your collection' }
    }

    // Add the perfume to the user's collection
    const userPerfume = await prisma.userPerfume.create({
      data: {
        userId,
        perfumeId
      },
      include: {
        perfume: true
      }
    })

    return { success: true, userPerfume }
  } catch (error) {
    console.error('Error adding perfume to user collection:', error)
    return { success: false, error: 'Failed to add perfume to collection' }
  }
}

export const removeUserPerfume = async (userId: string, perfumeId: string) => {
  try {
    // Check if the perfume exists in the user's collection
    const existingPerfume = await prisma.userPerfume.findFirst({
      where: {
        userId,
        perfumeId
      }
    })

    if (!existingPerfume) {
      return { success: false, error: 'Perfume not found in your collection' }
    }

    // Remove the perfume from the user's collection
    await prisma.userPerfume.delete({
      where: {
        id: existingPerfume.id
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error removing perfume from user collection:', error)
    return { success: false, error: 'Failed to remove perfume from collection' }
  }
}
