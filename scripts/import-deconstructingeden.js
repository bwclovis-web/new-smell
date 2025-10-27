#!/usr/bin/env node
/**
 * Import Deconstructing Eden perfumes to database
 * Handles duplicates by keeping the one with most data within same house
 * Appends house name for duplicates from other houses
 * Reuses existing notes when possible
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

function calculateDataScore(perfume) {
  let score = 0
  if (perfume.description && perfume.description.trim() !== '') score += 1
  if (perfume.image && perfume.image.trim() !== '') score += 1
  // Add score for notes (we'll calculate this when we have the notes data)
  return score
}

async function createOrGetPerfumeHouse(houseName) {
  if (!houseName || houseName.trim() === '') {
    return null
  }

  const existingHouse = await prisma.perfumeHouse.findUnique({
    where: { name: houseName.trim() }
  })

  if (existingHouse) {
    return existingHouse
  }

  return await prisma.perfumeHouse.create({
    data: {
      name: houseName.trim(),
      slug: houseName.trim().toLowerCase().replace(/\s+/g, '-'),
      type: 'indie' // Deconstructing Eden is an indie house
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
    where: { name: cleanNoteName }
  })

  if (existingNote) {
    // Connect to existing note
    const updateData = {}
    switch (noteType) {
      case 'open':
        updateData.perfumeOpenId = perfumeId
        break
      case 'heart':
        updateData.perfumeHeartId = perfumeId
        break
      case 'base':
        updateData.perfumeCloseId = perfumeId
        break
    }

    return await prisma.perfumeNotes.update({
      where: { id: existingNote.id },
      data: updateData
    })
  } else {
    // Create new note
    const noteData = {
      name: cleanNoteName
    }

    // Set the appropriate perfume relationship based on note type
    switch (noteType) {
      case 'open':
        noteData.perfumeOpenId = perfumeId
        break
      case 'heart':
        noteData.perfumeHeartId = perfumeId
        break
      case 'base':
        noteData.perfumeCloseId = perfumeId
        break
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

async function importDeconstructingEdenData() {
  const csvFile = 'perfumes_deconstructingeden.csv'
  const filePath = path.join(__dirname, '../csv', csvFile)

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${csvFile}`)
    return
  }

  console.log(`📁 Reading ${csvFile}...`)
  
  // Read file manually to handle JSON arrays in CSV
  const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
  const lines = content.split('\n').filter(line => line.trim() !== '')
  const headers = lines[0].split(',')
  
  const records = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const record = {}
    
    // Simple CSV parsing that handles quoted fields with JSON arrays
    let currentField = ''
    let inQuotes = false
    let fieldIndex = 0
    let j = 0
    
    while (j < line.length && fieldIndex < headers.length) {
      const char = line[j]
      
      if (char === '"' && !inQuotes) {
        inQuotes = true
      } else if (char === '"' && inQuotes) {
        // Check if this is an escaped quote
        if (j + 1 < line.length && line[j + 1] === '"') {
          currentField += '"'
          j++ // Skip the next quote
        } else {
          inQuotes = false
        }
      } else if (char === ',' && !inQuotes) {
        record[headers[fieldIndex]] = currentField.trim()
        currentField = ''
        fieldIndex++
      } else {
        currentField += char
      }
      j++
    }
    
    // Add the last field
    if (fieldIndex < headers.length) {
      record[headers[fieldIndex]] = currentField.trim()
    }
    
    records.push(record)
  }

  console.log(`📊 Found ${records.length} records to import`)

  // Create or get Deconstructing Eden house
  const perfumeHouse = await createOrGetPerfumeHouse('Deconstructing Eden')
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

      // Check if perfume already exists with the same name
      let existingPerfume = await prisma.perfume.findFirst({
        where: { name: originalName },
        include: { perfumeHouse: true }
      })

      if (existingPerfume) {
        // If it's from the same house, check which has more data
        if (existingPerfume.perfumeHouseId === perfumeHouse.id) {
          const currentDataScore = calculateDataScore(data)
          const existingDataScore = calculateDataScore(existingPerfume)
          
          // Add notes score
          const currentNotesCount = parseNotes(data.openNotes || '').length + 
                                   parseNotes(data.heartNotes || '').length + 
                                   parseNotes(data.baseNotes || '').length
          
          // Get existing notes count
          const existingNotesCount = await prisma.perfumeNotes.count({
            where: {
              OR: [
                { perfumeOpenId: existingPerfume.id },
                { perfumeHeartId: existingPerfume.id },
                { perfumeCloseId: existingPerfume.id }
              ]
            }
          })
          
          const currentTotalScore = currentDataScore + currentNotesCount
          const existingTotalScore = existingDataScore + existingNotesCount
          
          if (currentTotalScore > existingTotalScore) {
            // Update existing perfume with better data
            await prisma.perfume.update({
              where: { id: existingPerfume.id },
              data: {
                description: data.description || existingPerfume.description,
                image: data.image || existingPerfume.image
              }
            })
            
            // Clear existing notes and add new ones
            await prisma.perfumeNotes.updateMany({
              where: {
                OR: [
                  { perfumeOpenId: existingPerfume.id },
                  { perfumeHeartId: existingPerfume.id },
                  { perfumeCloseId: existingPerfume.id }
                ]
              },
              data: {
                perfumeOpenId: null,
                perfumeHeartId: null,
                perfumeCloseId: null
              }
            })
            
            console.log(`🔄 Updated existing perfume with better data: ${originalName}`)
            updated++
            
            // Process notes for the updated perfume
            const openNotes = parseNotes(data.openNotes || '')
            const heartNotes = parseNotes(data.heartNotes || '')
            const baseNotes = parseNotes(data.baseNotes || '')

            // Create open notes
            for (const noteName of openNotes) {
              await createOrGetPerfumeNote(noteName, existingPerfume.id, 'open')
            }

            // Create heart notes
            for (const noteName of heartNotes) {
              await createOrGetPerfumeNote(noteName, existingPerfume.id, 'heart')
            }

            // Create base notes
            for (const noteName of baseNotes) {
              await createOrGetPerfumeNote(noteName, existingPerfume.id, 'base')
            }
            
            continue
          } else {
            console.log(`⚠️  Skipping "${originalName}" - existing version has more data`)
            skipped++
            continue
          }
        } else {
          // Different house - append house name
          finalName = `${originalName} - Deconstructing Eden`
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
          
          console.log(`🔄 Duplicate from different house: "${originalName}" -> "${finalName}"`)
          duplicates++
        }
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

      // Process notes
      const openNotes = parseNotes(data.openNotes || '')
      const heartNotes = parseNotes(data.heartNotes || '')
      const baseNotes = parseNotes(data.baseNotes || '')

      // Create open notes
      for (const noteName of openNotes) {
        await createOrGetPerfumeNote(noteName, perfume.id, 'open')
      }

      // Create heart notes
      for (const noteName of heartNotes) {
        await createOrGetPerfumeNote(noteName, perfume.id, 'heart')
      }

      // Create base notes
      for (const noteName of baseNotes) {
        await createOrGetPerfumeNote(noteName, perfume.id, 'base')
      }

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
  console.log('🚀 Starting Deconstructing Eden import...')
  
  try {
    await importDeconstructingEdenData()
    console.log('✅ Deconstructing Eden import completed!')
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
