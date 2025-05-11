import { prisma } from '~/db.server'

export const getAllHouses = async () => (
  prisma.perfumeHouses.findMany()
)

export const getPerfumeHouseByName = async (name: string) => {
  const house = await prisma.perfumeHouses.findUnique({
    where: {
      name
    }
  })
  return house
}

export const searchPerfumeHouseByName = async (name: string) => {
  const house = await prisma.perfumeHouses.findMany({
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
  const deletedHouse = await prisma.perfumeHouses.delete({
    where: {
      id
    }
  })
  return deletedHouse
}

export const createPerfumeHouse = async (data) => {
  const newHouse = await prisma.perfumeHouses.create({
    data: {
      name: data.get('name') as string,
      description: data.get('description') as string,
      image: data.get('image') as string,
      website: data.get('website') as string,
      country: data.get('country') as string,
      founded: data.get('founded') as string
    }
  })
  return newHouse
}
