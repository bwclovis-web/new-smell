import { prisma } from '~/db.server'

export const getAllHouses = async () => (
  prisma.perfumeHouse.findMany()
)

export const getPerfumeHouseByName = async (name: string) => {
  const house = await prisma.perfumeHouse.findUnique({
    where: { name },
    include: {
      perfumes: true
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

export const createPerfumeHouse = async (data) => {
  const newHouse = await prisma.perfumeHouse.create({
    data: {
      name: data.get('name') as string,
      description: data.get('description') as string,
      image: data.get('image') as string,
      website: data.get('website') as string,
      country: data.get('country') as string,
      founded: data.get('founded') as string,
      email: data.get('email') as string,
      phone: data.get('phone') as string,
      address: data.get('address') as string
    }
  })
  return newHouse
}
