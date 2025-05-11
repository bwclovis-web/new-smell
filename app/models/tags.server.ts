import { prisma } from '~/db.server'

export const getAllTags = async () => {
  const tags = await prisma.perfumeNotes.findMany()
  return tags
}
