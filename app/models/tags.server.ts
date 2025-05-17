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
