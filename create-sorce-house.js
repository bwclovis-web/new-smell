import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createPerfumeHouse() {
  try {
    // Check if the house already exists
    const existingHouse = await prisma.perfumeHouse.findUnique({
      where: { name: 'Sorce' }
    })
    
    if (existingHouse) {
      console.log('Perfume house "Sorce" already exists.')
      return existingHouse
    }
    
    // Create the house if it doesn't exist
    const house = await prisma.perfumeHouse.create({
      data: {
        name: 'Sorce',
        description: 'Sorce is an indie perfume house creating unique, narrative-driven fragrances with high-quality materials.',
        website: 'https://shopsorce.com'
      }
    })
    
    console.log('Created perfume house "Sorce"')
    return house
  } catch (error) {
    console.error('Error creating perfume house:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPerfumeHouse()
