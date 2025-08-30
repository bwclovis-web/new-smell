import { HouseType, Prisma } from '@prisma/client'

import { prisma } from '~/db.server'
const buildHouseOrderBy = (
  sortBy?: string,
  sortByType?: boolean
): Prisma.PerfumeHouseOrderByWithRelationInput => {
  if (sortBy) {
    switch (sortBy) {
      case 'name-asc':
        return { name: 'asc' }
      case 'name-desc':
        return { name: 'desc' }
      case 'created-asc':
        return { createdAt: 'asc' }
      case 'type-asc':
        return { type: 'asc' }
      default:
        return { createdAt: 'desc' }
    }
  }
  return sortByType ? { type: 'asc' } : { createdAt: 'desc' }
}

export const getAllHousesWithOptions = async (options?: {
  sortByType?: boolean
  houseType?: string
  sortBy?: 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc' | 'type-asc'
}) => {
  const { sortByType, houseType, sortBy } = options || {}

  const where: Prisma.PerfumeHouseWhereInput = {}
  if (houseType && houseType !== 'all') {
    where.type = houseType as HouseType
  }

  const orderBy = buildHouseOrderBy(sortBy, sortByType)

  return prisma.perfumeHouse.findMany({
    where,
    orderBy
  })
}

// Simple getAllHouses for backward compatibility
export const getAllHouses = async () => prisma.perfumeHouse.findMany({
  orderBy: { createdAt: 'desc' }
})

export const getHousesByLetter = async (letter: string) => {
  return prisma.perfumeHouse.findMany({
    where: {
      name: {
        startsWith: letter,
        mode: 'insensitive'
      }
    },
    orderBy: { name: 'asc' }
  })
}

export const getHousesByLetterPaginated = async (letter: string, options: { skip: number; take: number }) => {
  const { skip, take } = options

  const [houses, totalCount] = await Promise.all([
    prisma.perfumeHouse.findMany({
      where: {
        name: {
          startsWith: letter,
          mode: 'insensitive'
        }
      },
      orderBy: { name: 'asc' },
      skip,
      take
    }),
    prisma.perfumeHouse.count({
      where: {
        name: {
          startsWith: letter,
          mode: 'insensitive'
        }
      }
    })
  ])

  return {
    houses,
    count: totalCount
  }
}

export const getPerfumeHouseByName =
  async (name: string, opts?: { skip?: number, take?: number }) => {
    const house = await prisma.perfumeHouse.findUnique({
      where: { name },
      include: {
        perfumes: {
          skip: opts?.skip ?? 0,
          take: opts?.take ?? 9,
          orderBy: { createdAt: 'desc' } // Add consistent ordering
        }
      }
    })

    return house
  }

export const searchPerfumeHouseByName = async (name: string) => {
  const house = await prisma.perfumeHouse.findMany({
    where: {
      name: {
        contains: name,
        mode: 'insensitive'
      }
    },
    take: 10
  })
  return house
}

export const deletePerfumeHouse = async (id: string) => {
  const deletedHouse = await prisma.perfumeHouse.delete({
    where: {
      id
    }
  })
  return deletedHouse
}
//TODO: Add validation for FormData fields
export const updatePerfumeHouse = async (id: string, data: FormData) => {
  try {
    const updatedHouse = await prisma.perfumeHouse.update({
      where: { id },
      data: {
        name: data.get('name') as string,
        description: data.get('description') as string,
        image: data.get('image') as string,
        website: data.get('website') as string,
        country: data.get('country') as string,
        founded: data.get('founded') as string,
        type: data.get('type') as HouseType,
        email: data.get('email') as string,
        phone: data.get('phone') as string,
        address: data.get('address') as string
      }
    })
    return { success: true, data: updatedHouse }
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError
      && err.code === 'P2002'
    ) {
      return {
        success: false,
        error: `A perfume house with that ${Array.isArray(err.meta?.target) ? err.meta.target[0] : 'value'} already exists.`
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred.'
    }
  }
}
export const createPerfumeHouse = async (data: FormData) => {
  try {
    const newHouse = await prisma.perfumeHouse.create({
      data: {
        name: data.get('name') as string,
        description: data.get('description') as string,
        image: data.get('image') as string,
        website: data.get('website') as string,
        country: data.get('country') as string,
        founded: data.get('founded') as string,
        type: data.get('type') as HouseType,
        email: data.get('email') as string,
        phone: data.get('phone') as string,
        address: data.get('address') as string
      }
    })
    return { success: true, data: newHouse }
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError
      && err.code === 'P2002'
    ) {
      return {
        success: false,
        error: `A perfume house with that ${Array.isArray(err.meta?.target) ? err.meta.target[0] : 'value'} already exists.`
      }
    }

    // Other errors (optional)
    return {
      success: false,
      error: 'An unexpected error occurred.'
    }
  }
}
