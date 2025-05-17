import { HouseType, Prisma } from '@prisma-app/client'

import { prisma } from '~/db.server'
export const getAllHouses = async (sortByType = false) => (
  prisma.perfumeHouse.findMany({
    orderBy: sortByType ? { type: 'asc' } : { createdAt: 'desc' }
  })
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
        error: `A perfume house with that ${err.meta?.target?.[0] || 'value'} already exists.`
      }
    }

    // Other errors (optional)
    return {
      success: false,
      error: 'An unexpected error occurred.'
    }
  }
}
