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
      },
      comments: {
        orderBy: {
          createdAt: 'desc'
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

interface HandleExistingPerfumeParams {
  existingPerfume: any
  amount?: string
  price?: string
  placeOfPurchase?: string
}

// Helper function to handle existing perfume update
const handleExistingPerfume = async ({
  existingPerfume,
  amount,
  price,
  placeOfPurchase
}: HandleExistingPerfumeParams) => {
  // If the perfume exists and we need to update it
  const updateData: any = {}
  let shouldUpdate = false

  if (amount && existingPerfume.amount !== amount) {
    updateData.amount = amount
    shouldUpdate = true
  }

  if (price && existingPerfume.price !== price) {
    updateData.price = price
    shouldUpdate = true
  }

  if (placeOfPurchase && existingPerfume.placeOfPurchase !== placeOfPurchase) {
    updateData.placeOfPurchase = placeOfPurchase
    shouldUpdate = true
  }

  if (shouldUpdate) {
    const updatedPerfume = await prisma.userPerfume.update({
      where: { id: existingPerfume.id },
      data: updateData,
      include: { perfume: true }
    })
    return { success: true, userPerfume: updatedPerfume, updated: true }
  }

  return { success: false, error: 'Perfume already in your collection' }
}

interface AddUserPerfumeParams {
  userId: string
  perfumeId: string
  amount?: string
  price?: string
  placeOfPurchase?: string
}

export const addUserPerfume = async ({
  userId,
  perfumeId,
  amount,
  price,
  placeOfPurchase
}: AddUserPerfumeParams) => {
  try {
    // Check if the perfume exists in collection
    const existingPerfume = await findUserPerfume(userId, perfumeId)

    if (existingPerfume) {
      return handleExistingPerfume({
        existingPerfume,
        amount,
        price,
        placeOfPurchase
      })
    }

    // Add the perfume to the user's collection
    const userPerfume = await prisma.userPerfume.create({
      data: {
        userId,
        perfumeId,
        amount: amount || 'full', // Use provided amount or default to 'full'
        price,
        placeOfPurchase
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

interface AddCommentParams {
  userId: string
  perfumeId: string
  comment: string
  isPublic?: boolean
  userPerfumeId: string
}

export const addPerfumeComment = async ({
  userId,
  perfumeId,
  comment,
  isPublic = false,
  userPerfumeId
}: AddCommentParams) => {
  try {
    // Check if the user owns this perfume (only owners can comment)
    const existingPerfume = await findUserPerfume(userId, perfumeId)

    if (!existingPerfume) {
      return { success: false, error: 'You can only comment on perfumes in your collection' }
    }

    // Create the comment
    const userComment = await prisma.userPerfumeComment.create({
      data: {
        userId,
        perfumeId,
        userPerfumeId, // Use the provided userPerfumeId
        comment,
        isPublic
      },
      include: {
        perfume: true,
        userPerfume: true
      }
    })

    return { success: true, userComment }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error adding comment to perfume:', error)
    return { success: false, error: 'Failed to add comment to perfume' }
  }
}

interface UpdateCommentParams {
  userId: string
  commentId: string
  comment?: string
  isPublic?: boolean
}

// Helper function to find a user's comment
const findUserComment = async (commentId: string) =>
  // Note: After running npx prisma generate, this will be available
  prisma.userPerfumeComment.findUnique({
    where: { id: commentId }
  })


// Helper function to perform the comment update
const performCommentUpdate = async (commentId: string, updateData: any) =>
  // Note: After running npx prisma generate, this will be available
  prisma.userPerfumeComment.update({
    where: { id: commentId },
    data: updateData,
    include: {
      perfume: true
    }
  })


// Helper function to validate comment ownership
const validateCommentOwnership = (comment: any, userId: string) => {
  if (!comment) {
    return { isValid: false, error: 'Comment not found' }
  }

  if (comment.userId !== userId) {
    return { isValid: false, error: 'You can only update your own comments' }
  }

  return { isValid: true }
}

// Prepare update data for a comment
const prepareCommentUpdateData = (comment?: string, isPublic?: boolean) => {
  const updateData: any = {}

  if (comment !== undefined) {
    updateData.comment = comment
  }

  if (isPublic !== undefined) {
    updateData.isPublic = isPublic
  }

  return updateData
}

export const updatePerfumeComment = async ({
  userId,
  commentId,
  comment,
  isPublic
}: UpdateCommentParams) => {
  try {
    // Find and validate the comment
    const existingComment = await findUserComment(commentId)
    const validation = validateCommentOwnership(existingComment, userId)

    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    // Prepare and perform the update
    const updateData = prepareCommentUpdateData(comment, isPublic)
    const updatedComment = await performCommentUpdate(commentId, updateData)

    return { success: true, userComment: updatedComment }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating perfume comment:', error)
    return { success: false, error: 'Failed to update perfume comment' }
  }
}

export const deletePerfumeComment = async (userId: string, commentId: string) => {
  try {
    // Find the comment
    const existingComment = await findUserComment(commentId)
    const validation = validateCommentOwnership(existingComment, userId)

    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    // Delete the comment
    await prisma.userPerfumeComment.delete({
      where: { id: commentId }
    })

    return { success: true }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting perfume comment:', error)
    return { success: false, error: 'Failed to delete perfume comment' }
  }
}

export const getUserPerfumeComments = async (userId: string, perfumeId: string) => {
  try {
    // Find the user perfume first
    const existingPerfume = await findUserPerfume(userId, perfumeId)

    if (!existingPerfume) {
      return { success: false, error: 'Perfume not found in your collection' }
    }

    // Get user's comments for a specific perfume
    const comments = await prisma.userPerfumeComment.findMany({
      where: {
        userPerfumeId: existingPerfume.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { success: true, comments }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user perfume comments:', error)
    return { success: false, error: 'Failed to fetch comments' }
  }
}

export const getPublicPerfumeComments = async (perfumeId: string) => {
  try {
    // Get all public comments for a specific perfume
    const comments = await prisma.userPerfumeComment.findMany({
      where: {
        perfumeId,
        isPublic: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        userPerfume: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { success: true, comments }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching public perfume comments:', error)
    return { success: false, error: 'Failed to fetch public comments' }
  }
}
