import { vi } from 'vitest'

// Integration test specific setup
export const integrationTestSetup = () => {
  // Mock database connections
  vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      perfume: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      house: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $disconnect: vi.fn(),
    })),
  }))

  // Mock external API calls
  global.fetch = vi.fn()

  // Mock file system operations
  vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn(),
  }))

  // Mock environment variables
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
  process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-for-testing'
  process.env.SESSION_SECRET = 'test-session-secret-minimum-32-characters-long-for-testing'
}

// Cleanup after each integration test
export const integrationTestCleanup = () => {
  vi.clearAllMocks()
  vi.resetAllMocks()
}
