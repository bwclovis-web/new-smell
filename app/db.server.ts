import 'dotenv/config'

import { PrismaClient } from '@prisma/client'

import { singleton } from './utils/server/utility.server'

console.log("Initializing Prisma with LOCAL_DATABASE_URL:", process.env.LOCAL_DATABASE_URL)

const prisma = singleton('prisma', () => new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_DATABASE_URL,
    },
  },
}))
prisma.$connect()

export { prisma }
