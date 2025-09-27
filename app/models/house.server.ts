import { Prisma, HouseType } from '@prisma/client'

import { prisma } from '~/db.server'
import { createUrlSlug } from '~/utils/slug'
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
  skip?: number
  take?: number
  selectFields?: boolean // If true, only return essential fields
}) => {
  const { sortByType, houseType, sortBy, skip, take, selectFields } = options || {}

  const where: Prisma.PerfumeHouseWhereInput = {}
  if (houseType && houseType !== 'all') {
    where.type = houseType as HouseType
  }

  const orderBy = buildHouseOrderBy(sortBy, sortByType)

  // If selectFields is true, only return essential fields to reduce response size
  if (selectFields) {
    return prisma.perfumeHouse.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        type: true,
        country: true,
        founded: true,
        createdAt: true,
        updatedAt: true,
        // Exclude large fields like description, image, website, email, phone, address
      }
    })
  }

  return prisma.perfumeHouse.findMany({
    where,
    orderBy,
    skip,
    take
  })
}

// Add a new function for paginated results with count
export const getHousesPaginated = async (options?: {
  sortByType?: boolean
  houseType?: string
  sortBy?: 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc' | 'type-asc'
  skip?: number
  take?: number
  selectFields?: boolean
}) => {
  const { sortByType, houseType, sortBy, skip = 0, take = 50, selectFields } = options || {}

  const where: Prisma.PerfumeHouseWhereInput = {}
  if (houseType && houseType !== 'all') {
    where.type = houseType as HouseType
  }

  const orderBy = buildHouseOrderBy(sortBy, sortByType)

  const [houses, totalCount] = await Promise.all([
    selectFields
      ? prisma.perfumeHouse.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
          founded: true,
          createdAt: true,
          updatedAt: true,
        }
      })
      : prisma.perfumeHouse.findMany({
        where,
        orderBy,
        skip,
        take
      }),
    prisma.perfumeHouse.count({ where })
  ])

  return {
    houses,
    count: totalCount,
    hasMore: skip + take < totalCount,
    currentPage: Math.floor(skip / take) + 1,
    totalPages: Math.ceil(totalCount / take)
  }
}

// Simple getAllHouses for backward compatibility - now with pagination
export const getAllHouses = async (options?: { skip?: number; take?: number; selectFields?: boolean }) => {
  const { skip, take, selectFields } = options || {}

  if (selectFields) {
    return prisma.perfumeHouse.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        name: true,
        type: true,
        country: true,
        founded: true,
        createdAt: true,
        updatedAt: true,
      }
    })
  }

  return prisma.perfumeHouse.findMany({
    orderBy: { createdAt: 'desc' },
    skip,
    take
  })
}

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

export const getHousesByLetterPaginated = async (letter: string, options: { skip: number; take: number; houseType?: string }) => {
  const { skip, take, houseType = 'all' } = options

  const where: Prisma.PerfumeHouseWhereInput = {
    name: {
      startsWith: letter,
      mode: 'insensitive'
    }
  }

  // Add house type filter if not 'all'
  if (houseType && houseType !== 'all') {
    where.type = houseType as HouseType
  }

  const [houses, totalCount] = await Promise.all([
    prisma.perfumeHouse.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take
    }),
    prisma.perfumeHouse.count({
      where
    })
  ])

  return {
    houses,
    count: totalCount
  }
}

export const getPerfumeHouseBySlug =
  async (slug: string, opts?: { skip?: number, take?: number }) => {
    const house = await prisma.perfumeHouse.findUnique({
      where: { slug },
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

export const getPerfumeHouseById = async (id: string, opts?: { skip?: number, take?: number }) => {
  const house = await prisma.perfumeHouse.findUnique({
    where: { id },
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
    orderBy: {
      name: 'asc'
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
    const name = data.get('name') as string
    const newHouse = await prisma.perfumeHouse.create({
      data: {
        name,
        slug: createUrlSlug(name),
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
