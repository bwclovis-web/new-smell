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
  const perfume = await prisma.perfume.findMany({
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
  return perfume
}

export const updatePerfume = async (id: string, data: FormData) => {
  try {
    const updatedPerfume = await prisma.perfume.update({
      where: { id },
      data: {
        name: data.get('name') as string,
        description: data.get('description') as string,
        image: data.get('image') as string,
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

export const createPerfume = async (data: FormData) => {
  const name = data.get('name') as string
  const newPerfume = await prisma.perfume.create({
    data: {
      name,
      slug: createUrlSlug(name),
      description: data.get('description') as string,
      image: data.get('image') as string,
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
      // description: data.get('description') as string,
      // image: data.get('imageUrl') as string,
      // notes: data.get('notes') as string[]
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
