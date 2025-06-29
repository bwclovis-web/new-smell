import { prisma } from '~/db.server'

export const addToWishlist = async (userId: string, perfumeId: string) => {
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
      perfumeId
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
                  name: true,
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
