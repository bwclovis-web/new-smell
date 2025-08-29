import { PrismaClient } from '@prisma/client'
import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Configuration
const CSV_FILE_PATH = path.join(process.cwd(), 'enriched_data', 's&scomplete.csv')
const BATCH_SIZE = 100
const MAX_RETRIES = 3

// Statistics tracking
let stats = {
  total: 0,
  imported: 0,
  skipped: 0,
  errors: 0,
  startTime: null,
  endTime: null
}

// Helper function to map CSV type to HouseType enum
function mapHouseType(type) {
  if (!type) {
 return 'indie' 
}
  
  const typeLower = type.toLowerCase()
  if (typeLower.includes('niche')) {
 return 'niche' 
}
  if (typeLower.includes('designer')) {
 return 'designer' 
}
  if (typeLower.includes('celebrity')) {
 return 'celebrity' 
}
  if (typeLower.includes('drugstore')) {
 return 'drugstore' 
}
  
  return 'indie' // default
}

// Helper function to clean and validate data
function cleanData(row) {
  return {
    name: row.name?.trim() || '',
    description: row.description?.trim() || null,
    image: row.image?.trim() || null,
    website: row.website?.trim() || null,
    country: row.country?.trim() || null,
    founded: row.founded?.trim() || null,
    email: row.email?.trim() || null,
    phone: row.phone?.trim() || null,
    address: row.address?.trim() || null,
    type: mapHouseType(row.type)
  }
}

// Helper function to validate required fields
function validateData(data) {
  if (!data.name || data.name.length === 0) {
    return { valid: false, error: 'Name is required' }
  }
  
  if (data.name.length > 255) {
    return { valid: false, error: 'Name too long' }
  }
  
  return { valid: true }
}

// Function to import a single house with retry logic
async function importHouse(data, retryCount = 0) {
  try {
    // Check if house already exists
    const existing = await prisma.perfumeHouse.findUnique({
      where: { name: data.name }
    })
    
    if (existing) {
      stats.skipped++
      return { success: true, skipped: true, message: `House "${data.name}" already exists` }
    }
    
    // Create new house
    await prisma.perfumeHouse.create({
      data: data
    })
    
    stats.imported++
    return { success: true, message: `Created house: ${data.name}` }
    
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying import for "${data.name}" (attempt ${retryCount + 1})`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
      return importHouse(data, retryCount + 1)
    }
    
    stats.errors++
    return { 
      success: false, 
      error: error.message, 
      message: `Failed to import "${data.name}" after ${MAX_RETRIES} attempts` 
    }
  }
}

// Main import function
async function importSAndSComplete() {
  console.log('🚀 Starting S&S Complete import...')
  console.log(`📁 Reading from: ${CSV_FILE_PATH}`)
  
  stats.startTime = new Date()
  
  // Check if file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`)
    process.exit(1)
  }
  
  const houses = []
  
  // Read and parse CSV
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', row => {
        stats.total++
        
        // Clean and validate data
        const cleanedData = cleanData(row)
        const validation = validateData(cleanedData)
        
        if (validation.valid) {
          houses.push(cleanedData)
        } else {
          console.log(`⚠️  Skipping invalid row: ${validation.error} - ${JSON.stringify(row)}`)
          stats.skipped++
        }
        
        // Progress indicator
        if (stats.total % 100 === 0) {
          console.log(`📊 Processed ${stats.total} rows...`)
        }
      })
      .on('end', async () => {
        console.log(`\n📋 CSV parsing complete. Found ${houses.length} valid houses to import.`)
        
        try {
          // Import houses in batches
          for (let i = 0; i < houses.length; i += BATCH_SIZE) {
            const batch = houses.slice(i, i + BATCH_SIZE)
            console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(houses.length / BATCH_SIZE)}`)
            
            const promises = batch.map(house => importHouse(house))
            const results = await Promise.allSettled(promises)
            
            // Log batch results
            results.forEach((result, index) => {
              if (result.status === 'fulfilled') {
                const house = batch[index]
                if (result.value.skipped) {
                  console.log(`⏭️  ${result.value.message}`)
                } else {
                  console.log(`✅ ${result.value.message}`)
                }
              } else {
                console.log(`❌ Batch item failed: ${result.reason}`)
              }
            })
            
            // Small delay between batches to avoid overwhelming the database
            if (i + BATCH_SIZE < houses.length) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }
          }
          
          stats.endTime = new Date()
          const duration = (stats.endTime - stats.startTime) / 1000
          
          console.log('\n🎉 Import complete!')
          console.log('📊 Final Statistics:')
          console.log(`   Total rows processed: ${stats.total}`)
          console.log(`   Houses imported: ${stats.imported}`)
          console.log(`   Houses skipped (already exist): ${stats.skipped}`)
          console.log(`   Errors: ${stats.errors}`)
          console.log(`   Duration: ${duration.toFixed(2)} seconds`)
          
          resolve()
          
        } catch (error) {
          console.error('❌ Error during import:', error)
          reject(error)
        }
      })
      .on('error', error => {
        console.error('❌ Error reading CSV:', error)
        reject(error)
      })
  })
}

// Main execution
async function main() {
  try {
    await importSAndSComplete()
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed.')
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { importSAndSComplete }
