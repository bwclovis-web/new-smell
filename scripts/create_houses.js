import { PrismaClient } from '@prisma-app/client'

const prisma = new PrismaClient()

const houses = [
  {
    name: '4160 Tuesdays',
    description: 'British indie perfume house founded by Sarah McCartney',
    type: 'indie',
    country: 'United Kingdom'
  },
  {
    name: 'Akro',
    description: 'Contemporary fragrance house focusing on addictive scents',
    type: 'niche'
  },
  {
    name: 'Blackcliff',
    description: 'Modern fragrance house creating sophisticated scents',
    type: 'niche'
  },
  {
    name: 'luvmilk',
    description: 'Indie bath and body company known for sweet, gourmand fragrances',
    type: 'indie'
  },
  {
    name: 'Navitus',
    description: 'Luxury fragrance house specializing in extrait de parfum',
    type: 'niche'
  },
  {
    name: 'Poesie Perfume and Tea',
    description: 'Indie perfume house creating literary-inspired fragrances',
    type: 'indie'
  },
  {
    name: 'Possets',
    description: 'American indie perfume house known for unique blends',
    type: 'indie',
    country: 'United States'
  },
  {
    name: 'House of Oud',
    description: 'Luxury fragrance house specializing in oud-based perfumes',
    type: 'niche'
  },
  {
    name: 'Sorce',
    description: 'Modern indie perfume house creating artistic fragrances',
    type: 'indie'
  },
  {
    name: 'Scents of Wood',
    description: 'Contemporary fragrance house specializing in wood-based perfumes',
    type: 'niche'
  }
]

async function createHouses() {
  console.log('Creating perfume houses...')
  
  for (const house of houses) {
    try {
      const existing = await prisma.perfumeHouse.findUnique({
        where: { name: house.name }
      })
      
      if (existing) {
        console.log(`House "${house.name}" already exists`)
      } else {
        await prisma.perfumeHouse.create({
          data: house
        })
        console.log(`Created house: ${house.name}`)
      }
    } catch (error) {
      console.error(`Error creating house ${house.name}:`, error.message)
    }
  }
  
  await prisma.$disconnect()
  console.log('House creation complete.')
}

createHouses()
