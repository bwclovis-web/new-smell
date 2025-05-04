import { prisma } from '~/db.server'

export const getAllPerfumes = async () => {
  const perfumes = await prisma.perfume.findMany({
    include: {
      perfumeHouse: true
    }
  })
  return perfumes
}

export const searchPerfumeByName = async (name: string) => {
  const perfume = await prisma.perfumeHouses.findMany({
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
