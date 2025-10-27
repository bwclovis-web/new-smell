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

  const where: Prisma.PerfumeHouseWhereInput = {
    // Only include houses that have at least one perfume
    perfumes: {
      some: {}
    }
  }
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
        slug: true,
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

  const where: Prisma.PerfumeHouseWhereInput = {
    // Only include houses that have at least one perfume
    perfumes: {
      some: {}
    }
  }
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
          slug: true,
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

  const where: Prisma.PerfumeHouseWhereInput = {
    // Only include houses that have at least one perfume
    perfumes: {
      some: {}
    }
  }

  if (selectFields) {
    return prisma.perfumeHouse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        country: true,
        founded: true,
        createdAt: true,
        updatedAt: true,
      }
    })
  }

  return prisma.perfumeHouse.findMany({
    where,
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
      },
      // Only include houses that have at least one perfume
      perfumes: {
        some: {}
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
    },
    // Only include houses that have at least one perfume
    perfumes: {
      some: {}
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

export const getPerfumeHouseByName = async (name: string) => {
  const house = await prisma.perfumeHouse.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive'
      }
    }
  })

  return house
}

export const searchPerfumeHouseByName = async (name: string) => {
  const searchTerm = name.trim()

  if (!searchTerm) {
    return []
  }

  // First, try exact matches and starts-with matches (highest priority)
  const exactMatches = await prisma.perfumeHouse.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { equals: searchTerm, mode: 'insensitive' } },
            { name: { startsWith: searchTerm, mode: 'insensitive' } }
          ]
        },
        // Only include houses that have at least one perfume
        { perfumes: { some: {} } }
      ]
    },
    orderBy: { name: 'asc' },
    take: 5
  })

  // Then, try contains matches (lower priority)
  const containsMatches = await prisma.perfumeHouse.findMany({
    where: {
      AND: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        // Exclude items already found in exact matches
        { id: { notIn: exactMatches.map(h => h.id) } },
        // Only include houses that have at least one perfume
        { perfumes: { some: {} } }
      ]
    },
    orderBy: { name: 'asc' },
    take: 5
  })

  // Combine and rank results
  const allResults = [...exactMatches, ...containsMatches]

  // Sort by relevance score
  const rankedResults = allResults
    .map(house => ({
      ...house,
      relevanceScore: calculateHouseRelevanceScore(house.name, searchTerm)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10)

  return rankedResults
}

// Helper function to calculate relevance score for houses
const calculateHouseRelevanceScore = (houseName: string, searchTerm: string): number => {
  const name = houseName.toLowerCase()
  const term = searchTerm.toLowerCase()

  let score = 0

  // Exact match gets highest score
  if (name === term) {
    score += 100
  }
  // Starts with gets high score
  else if (name.startsWith(term)) {
    score += 80
  }
  // Contains gets medium score
  else if (name.includes(term)) {
    score += 40
  }

  // Bonus for shorter names (more specific matches)
  score += Math.max(0, 20 - name.length)

  // Bonus for matches at word boundaries
  const wordBoundaryRegex = new RegExp(`\\b${term}`, 'i')
  if (wordBoundaryRegex.test(name)) {
    score += 20
  }

  return score
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
    const name = sanitizeText(data.get('name') as string)
    const updatedHouse = await prisma.perfumeHouse.update({
      where: { id },
      data: {
        name,
        slug: createUrlSlug(name),
        description: sanitizeText(data.get('description') as string),
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
// Helper function to sanitize text input by normalizing Unicode characters
const sanitizeText = (text: string | null): string => {
  if (!text) return ''

  return text
    .normalize('NFD')  // Normalize Unicode
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
    .replace(/[\u2013\u2014]/g, '-')  // en dash, em dash → hyphen
    .replace(/[\u2018\u2019]/g, "'")  // smart single quotes
    .replace(/[\u201C\u201D]/g, '"')  // smart double quotes
    .replace(/[\u2026]/g, '...')      // ellipsis
}

export const createPerfumeHouse = async (data: FormData) => {
  try {
    const name = sanitizeText(data.get('name') as string)
    const newHouse = await prisma.perfumeHouse.create({
      data: {
        name,
        slug: createUrlSlug(name),
        description: sanitizeText(data.get('description') as string),
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
