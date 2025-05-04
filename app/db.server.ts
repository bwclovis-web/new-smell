import { PrismaClient } from '@prisma-app/client'

import { singleton } from './utils/server/utility.server'

const prisma = singleton('prisma', () => new PrismaClient())
prisma.$connect()

export { prisma }
