import { prisma } from '~/db.server'

export const getAllTags = async () => {
  const tags = await prisma.perfumeNotes.findMany()
  return tags
}

export const getTagsByName = async (name: string) => {
  const tags = await prisma.perfumeNotes.findMany({
    where: {
      name: {
        contains: name,
        mode: 'insensitive'
      }
    },
    take: 10
  })
  return tags
}

export const createTag = async (name: string) => {
  const tag = await prisma.perfumeNotes.create({
    data: {
      name
    }
  })
  return tag
}
