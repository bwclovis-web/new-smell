import { prisma } from '~/db.server'

export const getAllPerfumes = async () => {
  const perfumes = await prisma.perfume.findMany({
    include: {
      perfumeHouse: true
    }
  })
  return perfumes
}

export const getPerfumeByName = async (id: string) => {
  const house = await prisma.perfume.findUnique({
    where: { id },
    include: {
      perfumeHouse: true,
      perfumeNotesOpen: true,
      perfumeNotesHeart: true,
      perfumeNotesClose: true
    }
  })
  return house
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

export const createPerfume = async data => {
  const newPerfume = await prisma.perfume.create({
    data: {
      name: data.get('name') as string,
      description: data.get('description') as string,
      image: data.get('image') as string,
      perfumeNotesOpen: {
        connect: (data.getAll('notesOpen') as string[]).map(id => ({ id }))
      },
      perfumeNotesHeart: {
        connect: (data.getAll('notesHeart') as string[]).map(id => ({ id }))
      },
      perfumeNotesClose: {
        connect: (data.getAll('notesClose') as string[]).map(id => ({ id }))
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
