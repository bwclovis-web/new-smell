// Check imported data
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  try {
    const perfumeCount = await prisma.perfume.count()
    const houseCount = await prisma.perfumeHouse.count()
    const noteCount = await prisma.perfumeNotes.count()
    
    console.log(`✅ Data imported successfully!`)
    console.log(`📋 Perfumes: ${perfumeCount}`)
    console.log(`🏠 Houses: ${houseCount}`)
    console.log(`🎭 Notes: ${noteCount}`)
    
    // Show a few sample perfumes
    const samplePerfumes = await prisma.perfume.findMany({
      take: 5,
      include: {
        perfumeHouse: true
      }
    })
    
    console.log(`\n📊 Sample perfumes:`)
    samplePerfumes.forEach((perfume, index) => {
      console.log(`${index + 1}. ${perfume.name} by ${perfume.perfumeHouse?.name || 'Unknown'}`)
    })
    
  } catch (error) {
    console.error('Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
