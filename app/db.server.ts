import 'dotenv/config'

import { PrismaClient } from '@prisma/client'

import { singleton } from './utils/server/utility.server'

// Support both local development and production environments
const databaseUrl = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

console.log("Initializing Prisma with database URL:", databaseUrl)

const prisma = singleton('prisma', () => new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
}))

// Only connect in production or when explicitly needed
if (process.env.NODE_ENV === 'production') {
  prisma.$connect()
}

export { prisma }
