import { prisma } from '../db.server'

export const getAllFeatures = async () => (
  prisma.perfumeHouses.findMany()
)
