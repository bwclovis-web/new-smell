import type { Feature } from '@prisma/client'

import { prisma } from '../db.server'

export const getAllFeatures = async (): Promise<Feature[]> => (
  prisma.feature.findMany()
)
