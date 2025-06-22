import { Prisma } from '@prisma-app/client'

import { prisma } from '~/db.server'
export const getAllPerfumes = async () => {
  const perfumes = await prisma.perfume.findMany({
    include: {
      perfumeHouse: true
    },
    take: 20
  })
  return perfumes
}

export const getPerfumeByName = async (name: string) => {
  const house = await prisma.perfume.findUnique({
    where: { name },
    include: {
      perfumeHouse: true,
      perfumeNotesOpen: true,
      perfumeNotesHeart: true,
      perfumeNotesClose: true
    }
  })
  return house
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

export const createPerfume = async data => {
  const newPerfume = await prisma.perfume.create({
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
      // description: data.get('description') as string,
      // image: data.get('imageUrl') as string,
      // notes: data.get('notes') as string[]
    }
  })
  return newPerfume
}
