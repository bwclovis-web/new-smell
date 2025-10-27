import { Prisma } from '@prisma/client'

import { prisma } from '~/db.server'
import { createUrlSlug } from '~/utils/slug'

const buildPerfumeOrderBy = (sortBy?: string): Prisma.PerfumeOrderByWithRelationInput => {
  if (sortBy) {
    switch (sortBy) {
      case 'name-asc':
        return { name: 'asc' }
      case 'name-desc':
        return { name: 'desc' }
      case 'created-asc':
        return { createdAt: 'asc' }
      default:
        return { createdAt: 'desc' }
    }
  }
  return { createdAt: 'desc' }
}
export const getAllPerfumes = async () => {
  const perfumes = await prisma.perfume.findMany({
    include: {
      perfumeHouse: true
    }
  })
  return perfumes
}

export const getAllPerfumesWithOptions = async (options?: {
  sortBy?: 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc' | 'type-asc'
}) => {
  const { sortBy } = options || {}
  const orderBy = buildPerfumeOrderBy(sortBy)

  return prisma.perfume.findMany({
    include: {
      perfumeHouse: true
    },
    orderBy
  })
}

export const getPerfumeBySlug = async (slug: string) => {
  const house = await prisma.perfume.findUnique({
    where: { slug },
    include: {
      perfumeHouse: true,
      perfumeNotesOpen: true,
      perfumeNotesHeart: true,
      perfumeNotesClose: true
    }
  })
  return house
}

export const getPerfumeById = async (id: string) => {
  const perfume = await prisma.perfume.findUnique({
    where: { id },
    include: {
      perfumeHouse: true,
      perfumeNotesOpen: true,
      perfumeNotesHeart: true,
      perfumeNotesClose: true
    }
  })
  return perfume
}

export const deletePerfume = async (id: string) => {
  const deletedHouse = await prisma.perfume.delete({
    where: {
      id
    }
  })
  return deletedHouse
}

export const searchPerfumeByName = async (name: string) => {
  const searchTerm = name.trim()

  if (!searchTerm) {
    return []
  }

  // First, try exact matches and starts-with matches (highest priority)
  const exactMatches = await prisma.perfume.findMany({
    where: {
      OR: [
        { name: { equals: searchTerm, mode: 'insensitive' } },
        { name: { startsWith: searchTerm, mode: 'insensitive' } }
      ]
    },
    include: {
      perfumeHouse: true
    },
    orderBy: { name: 'asc' },
    take: 5
  })

  // Then, try contains matches (lower priority)
  const containsMatches = await prisma.perfume.findMany({
    where: {
      AND: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        // Exclude items already found in exact matches
        { id: { notIn: exactMatches.map(p => p.id) } }
      ]
    },
    include: {
      perfumeHouse: true
    },
    orderBy: { name: 'asc' },
    take: 5
  })

  // Combine and rank results
  const allResults = [...exactMatches, ...containsMatches]

  // Sort by relevance score
  const rankedResults = allResults
    .map(perfume => ({
      ...perfume,
      relevanceScore: calculateRelevanceScore(perfume.name, searchTerm)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10)

  return rankedResults
}

// Helper function to calculate relevance score
const calculateRelevanceScore = (perfumeName: string, searchTerm: string): number => {
  const name = perfumeName.toLowerCase()
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

export const updatePerfume = async (id: string, data: FormData) => {
  try {
    const name = sanitizeText(data.get('name') as string)

    // Debug logging
    const topNotes = data.getAll('notesTop') as string[]
    const heartNotes = data.getAll('notesHeart') as string[]
    const baseNotes = data.getAll('notesBase') as string[]

    console.log('UpdatePerfume - Received note data:', {
      topNotes,
      heartNotes,
      baseNotes
    })

    const updatedPerfume = await prisma.perfume.update({
      where: { id },
      data: {
        name,
        slug: createUrlSlug(name),
        description: sanitizeText(data.get('description') as string),
        image: data.get('image') as string,
        perfumeNotesOpen: {
          set: topNotes.map(id => ({ id }))
        },
        perfumeNotesHeart: {
          set: heartNotes.map(id => ({ id }))
        },
        perfumeNotesClose: {
          set: baseNotes.map(id => ({ id }))
        },
        perfumeHouse: {
          connect: {
            id: data.get('house') as string
          }
        }
      }
    })
    return { success: true, data: updatedPerfume }
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError
      && err.code === 'P2002'
    ) {
      return { success: false, error: 'Perfume already exists' }
    }
    throw err
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

export const createPerfume = async (data: FormData) => {
  const name = sanitizeText(data.get('name') as string)
  const description = sanitizeText(data.get('description') as string)
  const image = data.get('image') as string

  const newPerfume = await prisma.perfume.create({
    data: {
      name,
      slug: createUrlSlug(name),
      description,
      image,
      perfumeNotesOpen: {
        connect: (data.getAll('notesTop') as string[]).map(id => ({ id }))
      },
      perfumeNotesHeart: {
        connect: (data.getAll('notesHeart') as string[]).map(id => ({ id }))
      },
      perfumeNotesClose: {
        connect: (data.getAll('notesBase') as string[]).map(id => ({ id }))
      },
      perfumeHouse: {
        connect: {
          id: data.get('house') as string
        }
      }
    }
  })
  return newPerfume
}

export const getAvailablePerfumesForDecanting = async () => {
  const availablePerfumes = await prisma.perfume.findMany({
    where: {
      userPerfume: {
        some: {
          available: {
            not: "0"
          }
        }
      }
    },
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
    },
    orderBy: {
      name: 'asc'
    }
  })
  return availablePerfumes
}

export const getPerfumesByLetterPaginated = async (letter: string, options: { skip: number; take: number }) => {
  const { skip, take } = options

  const [perfumes, totalCount] = await Promise.all([
    prisma.perfume.findMany({
      where: {
        name: {
          startsWith: letter,
          mode: 'insensitive'
        }
      },
      include: {
        perfumeHouse: true
      },
      orderBy: { name: 'asc' },
      skip,
      take
    }),
    prisma.perfume.count({
      where: {
        name: {
          startsWith: letter,
          mode: 'insensitive'
        }
      }
    })
  ])

  return {
    perfumes,
    count: totalCount
  }
}
