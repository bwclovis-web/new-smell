// Simple script to create a test admin user
import { PrismaClient } from '@prisma-app/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    })

    if (existingUser) {
      console.log('Test admin user already exists')
      return existingUser
    }

    // Create test admin user
    const hashedPassword = await bcrypt.hash('password123', 10)

    const user = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Test Admin',
        role: 'admin'
      }
    })

    console.log('Test admin user created:', user.email)
    return user
  } catch (error) {
    console.error('Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
