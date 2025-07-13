import 'dotenv/config'

import { PrismaClient } from '@prisma/client'

import { singleton } from './utils/server/utility.server'

console.log("Initializing Prisma with DATABASE_URL:", process.env.DATABASE_URL)

const prisma = singleton('prisma', () => new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}))
prisma.$connect()

export { prisma }
