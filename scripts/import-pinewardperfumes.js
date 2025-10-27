#!/usr/bin/env node
/**
 * Import Pineward Perfumes to database
 * Handles duplicates by appending house name
 * Reuses existing notes when possible
 * Only creates new notes when needed
 */

import { PrismaClient } from '@prisma/client'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseNotes(notesString) {
  if (!notesString || notesString.trim() === '' || notesString === '[]') {
    return []
  }

  try {
    // Try to parse as JSON array first
    const parsed = JSON.parse(notesString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // If JSON parsing fails, try to split by comma
    return notesString.split(',').map(note => note.trim()).filter(note => note.length > 0)
  }
}

async function createOrGetPerfumeHouse(houseName) {
  if (!houseName || houseName.trim() === '') {
    return null
  }

  const existingHouse = await prisma.perfumeHouse.findFirst({
    where: { 
      name: {
        equals: houseName.trim(),
        mode: 'insensitive'
      }
    }
  })

  if (existingHouse) {
    return existingHouse
  }

  return await prisma.perfumeHouse.create({
    data: {
      name: houseName.trim(),
      slug: houseName.trim().toLowerCase().replace(/\s+/g, '-'),
      type: 'indie' // Pineward is an indie house
    }
  })
}

async function createOrGetPerfumeNote(noteName, perfumeId, noteType) {
  if (!noteName || noteName.trim() === '') {
    return null
  }

  const cleanNoteName = noteName.trim().toLowerCase()

  // First, try to find existing note with the same name
  const existingNote = await prisma.perfumeNotes.findFirst({
    where: { 
      name: {
        equals: cleanNoteName,
        mode: 'insensitive'
      }
    }
  })

  if (existingNote) {
    // Connect to existing note - don't update the note itself, just connect via perfume
    return existingNote
  } else {
    // Create new note
    const noteData = {
      name: cleanNoteName
    }

    return await prisma.perfumeNotes.create({
      data: noteData
    })
  }
}

async function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
}

async function checkForDuplicateInSameHouse(perfumeName, houseId) {
  return await prisma.perfume.findFirst({
    where: {
      name: perfumeName,
      perfumeHouseId: houseId
    }
  })
}

async function checkForDuplicateInOtherHouses(perfumeName, houseId) {
  return await prisma.perfume.findFirst({
    where: {
      name: perfumeName,
      perfumeHouseId: {
        not: houseId
      }
    },
    include: {
      perfumeHouse: true
    }
  })
}

async function importPinewardPerfumesData() {
  const csvFile = 'perfumes_pinewardperfumes.csv'
  const filePath = path.join(__dirname, '../csv', csvFile)

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${csvFile}`)
    return
  }

  console.log(`📁 Reading ${csvFile}...`)
  const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
  
  // Parse CSV manually to handle JSON arrays properly
  const lines = content.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
  const records = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const fields = []
    let currentField = ''
    let inQuotes = false
    let quoteCount = 0
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      
      if (char === '"') {
        quoteCount++
        if (quoteCount % 2 === 1) {
          inQuotes = true
        } else {
          inQuotes = false
        }
        currentField += char
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.replace(/^"|"$/g, ''))
        currentField = ''
      } else {
        currentField += char
      }
    }
    
    // Add the last field
    fields.push(currentField.replace(/^"|"$/g, ''))
    
    // Create record object
    const record = {}
    headers.forEach((header, index) => {
      record[header] = fields[index] || ''
    })
    records.push(record)
  }

  console.log(`📊 Found ${records.length} records to import`)

  // Create or get Pineward Perfumes house
  const perfumeHouse = await createOrGetPerfumeHouse('Pineward Perfumes')
  console.log(`🏠 Perfume house: ${perfumeHouse.name} (${perfumeHouse.id})`)

  let imported = 0
  let skipped = 0
  let duplicates = 0
  let updated = 0

  for (let i = 0; i < records.length; i++) {
    const data = records[i]
    
    try {
      // Skip if name is empty
      if (!data.name || data.name.trim() === '') {
        console.log(`⚠️  Skipping record ${i + 1}: No name`)
        skipped++
        continue
      }

      const originalName = data.name.trim()
      let finalName = originalName
      let slug = await createSlug(originalName)

      // Check for duplicate in same house
      const duplicateInSameHouse = await checkForDuplicateInSameHouse(originalName, perfumeHouse.id)
      
      if (duplicateInSameHouse) {
        // Check which has more data (description, image, notes)
        const currentDataScore = (data.description ? 1 : 0) + (data.image ? 1 : 0) + 
                                (parseNotes(data.openNotes || '').length + parseNotes(data.heartNotes || '').length + parseNotes(data.baseNotes || '').length)
        
        const existingDataScore = (duplicateInSameHouse.description ? 1 : 0) + (duplicateInSameHouse.image ? 1 : 0)
        
        if (currentDataScore > existingDataScore) {
          // Update existing perfume with better data
          await prisma.perfume.update({
            where: { id: duplicateInSameHouse.id },
            data: {
              description: data.description || duplicateInSameHouse.description,
              image: data.image || duplicateInSameHouse.image
            }
          })
          console.log(`🔄 Updated existing perfume with better data: ${originalName}`)
          updated++
        } else {
          console.log(`⚠️  Perfume "${originalName}" already exists in same house with better data, skipping...`)
          skipped++
        }
        continue
      }

      // Check for duplicate in other houses
      const duplicateInOtherHouse = await checkForDuplicateInOtherHouses(originalName, perfumeHouse.id)
      
      if (duplicateInOtherHouse) {
        finalName = `${originalName} - ${duplicateInOtherHouse.perfumeHouse.name}`
        slug = await createSlug(finalName)
        
        // Check if the modified name also exists
        const modifiedExists = await prisma.perfume.findFirst({
          where: { name: finalName }
        })
        
        if (modifiedExists) {
          console.log(`⚠️  Perfume "${originalName}" already exists with house suffix, skipping...`)
          skipped++
          continue
        }
        
        console.log(`🔄 Duplicate found in other house: "${originalName}" -> "${finalName}"`)
        duplicates++
      }

      // Create the perfume
      const perfume = await prisma.perfume.create({
        data: {
          name: finalName,
          slug: slug,
          description: data.description || null,
          image: data.image || null,
          perfumeHouseId: perfumeHouse.id
        }
      })

      console.log(`✅ Created: ${finalName}`)

      // Process notes - Pineward only uses openNotes (top notes)
      const openNotes = parseNotes(data.openNotes || '')
      const heartNotes = parseNotes(data.heartNotes || '')
      const baseNotes = parseNotes(data.baseNotes || '')

      // Create note connections
      const noteConnections = {
        perfumeNotesOpen: { connect: [] },
        perfumeNotesHeart: { connect: [] },
        perfumeNotesClose: { connect: [] }
      }

      // Process open notes
      for (const noteName of openNotes) {
        const note = await createOrGetPerfumeNote(noteName, perfume.id, 'open')
        if (note) {
          noteConnections.perfumeNotesOpen.connect.push({ id: note.id })
        }
      }

      // Process heart notes
      for (const noteName of heartNotes) {
        const note = await createOrGetPerfumeNote(noteName, perfume.id, 'heart')
        if (note) {
          noteConnections.perfumeNotesHeart.connect.push({ id: note.id })
        }
      }

      // Process base notes
      for (const noteName of baseNotes) {
        const note = await createOrGetPerfumeNote(noteName, perfume.id, 'base')
        if (note) {
          noteConnections.perfumeNotesClose.connect.push({ id: note.id })
        }
      }

      // Update perfume with note connections
      await prisma.perfume.update({
        where: { id: perfume.id },
        data: noteConnections
      })

      imported++

    } catch (error) {
      console.error(`❌ Error processing record ${i + 1}:`, error.message)
      console.error('Record data:', data)
      skipped++
    }
  }

  console.log('\n📈 Import Summary:')
  console.log(`✅ Imported: ${imported}`)
  console.log(`🔄 Updated existing: ${updated}`)
  console.log(`🔄 Duplicates handled: ${duplicates}`)
  console.log(`⚠️  Skipped: ${skipped}`)
  console.log(`📊 Total processed: ${records.length}`)
}

async function main() {
  console.log('🚀 Starting Pineward Perfumes import...')
  
  try {
    await importPinewardPerfumesData()
    console.log('✅ Pineward Perfumes import completed!')
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
