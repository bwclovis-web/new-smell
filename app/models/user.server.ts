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

// Helper function to find a user perfume
const findUserPerfume = async (userId: string, perfumeId: string) => (
  prisma.userPerfume.findFirst({
    where: { userId, perfumeId }
  })
)

// Helper function to handle existing perfume update
const handleExistingPerfume = async (existingPerfume: any, amount?: string) => {
  // If the perfume exists and we're updating the amount
  if (amount && existingPerfume.amount !== amount) {
    const updatedPerfume = await prisma.userPerfume.update({
      where: { id: existingPerfume.id },
      data: { amount },
      include: { perfume: true }
    })
    return { success: true, userPerfume: updatedPerfume, updated: true }
  }
  return { success: false, error: 'Perfume already in your collection' }
}

export const addUserPerfume = async (
  userId: string,
  perfumeId: string,
  amount?: string
) => {
  try {
    // Check if the perfume exists in collection
    const existingPerfume = await findUserPerfume(userId, perfumeId)

    if (existingPerfume) {
      return handleExistingPerfume(existingPerfume, amount)
    }

    // Add the perfume to the user's collection
    const userPerfume = await prisma.userPerfume.create({
      data: {
        userId,
        perfumeId,
        amount: amount || 'full' // Use provided amount or default to 'full'
      },
      include: {
        perfume: true
      }
    })

    return { success: true, userPerfume }
  } catch (error) {
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error('Error removing perfume from user collection:', error)
    return { success: false, error: 'Failed to remove perfume from collection' }
  }
}

export const updateAvailableAmount = async (
  userId: string,
  perfumeId: string,
  availableAmount: string
) => {
  try {
    // Check if the user owns this perfume
    const existingPerfume = await findUserPerfume(userId, perfumeId)

    if (!existingPerfume) {
      return { success: false, error: 'Perfume not found in your collection' }
    }

    // Update the available amount
    const updatedPerfume = await prisma.userPerfume.update({
      where: { id: existingPerfume.id },
      data: { available: availableAmount },
      include: { perfume: true }
    })

    return { success: true, userPerfume: updatedPerfume }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating available amount:', error)
    return { success: false, error: 'Failed to update available amount' }
  }
}
