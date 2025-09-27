import { prisma } from '~/db.server'

export const addToWishlist = async (userId: string, perfumeId: string, isPublic: boolean = false) => {
  // Check if item already exists in wishlist
  const existing = await prisma.userPerfumeWishlist.findFirst({
    where: {
      userId,
      perfumeId
    }
  })

  if (existing) {
    return { success: false, error: 'Perfume already in wishlist' }
  }

  const wishlistItem = await prisma.userPerfumeWishlist.create({
    data: {
      userId,
      perfumeId,
      isPublic
    }
  })

  return { success: true, data: wishlistItem }
}

export const removeFromWishlist = async (userId: string, perfumeId: string) => {
  const deleted = await prisma.userPerfumeWishlist.deleteMany({
    where: {
      userId,
      perfumeId
    }
  })

  return { success: true, data: deleted }
}

export const updateWishlistVisibility = async (userId: string, perfumeId: string, isPublic: boolean) => {
  const updated = await prisma.userPerfumeWishlist.updateMany({
    where: {
      userId,
      perfumeId
    },
    data: {
      isPublic
    }
  })

  return { success: true, data: updated }
}

export const isInWishlist = async (userId: string, perfumeId: string) => {
  const item = await prisma.userPerfumeWishlist.findFirst({
    where: {
      userId,
      perfumeId
    }
  })

  return !!item
}

export const getUserWishlist = async (userId: string) => {
  const wishlist = await prisma.userPerfumeWishlist.findMany({
    where: {
      userId
    },
    include: {
      perfume: {
        include: {
          perfumeHouse: true,
          userPerfume: {
            where: {
              available: {
                not: "0"
              }
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true,
                  email: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return wishlist
}
