// Suppress dotenv informational messages
process.env.DOTENV_CONFIG_QUIET = "true"
import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { singleton } from "./utils/server/utility.server"

// Support both local development and production environments
// Use LOCAL_DATABASE_URL when running on localhost, otherwise use DATABASE_URL
const isLocalhost =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" && window.location.hostname === "localhost") ||
  process.env.HOST === "localhost" ||
  process.env.HOST === "127.0.0.1"

const databaseUrl = isLocalhost
  ? process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL
  : process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Reduced logging for faster startup - uncomment when debugging database connection
// console.log("Initializing Prisma with database URL:", databaseUrl)
// console.log("Environment:", process.env.NODE_ENV, "| Localhost detected:", isLocalhost)

const prisma = singleton(
  "prisma",
  () => new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
)

// Only connect in production or when explicitly needed
if (process.env.NODE_ENV === "production") {
  prisma.$connect()
}

export { prisma }
