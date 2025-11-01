#!/usr/bin/env node
/**
 * Import Andrea Maack Perfumes to database
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
    // The CSV library returns the value as-is, so we just need to parse JSON
    const parsed = JSON.parse(notesString)
    return Array.isArray(parsed) ? parsed.filter(note => note && note.trim()) : []
  } catch (error) {
    console.log(`  ⚠️  Failed to parse notes: ${notesString}`)
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
      type: 'niche' // Andrea Maack is a niche house
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
    console.log(`  ♻️  Reusing existing note: ${cleanNoteName}`)
    // Connect to existing note - don't update the note itself, just connect via perfume
    return existingNote
  } else {
    // Create new note
    const noteData = {
      name: cleanNoteName
    }

    console.log(`  ✨ Creating new note: ${cleanNoteName}`)
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

async function importAndreaMaackPerfumesData() {
  const csvFile = 'perfumes_andreamaack.csv'
  const filePath = path.join(__dirname, '../csv', csvFile)

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${csvFile}`)
    return
  }

  console.log(`📁 Reading ${csvFile}...`)
  const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
  
  // Use csv-parse library for proper CSV parsing
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    escape: '"',
    quote: '"'
  })

  console.log(`📊 Found ${records.length} records to import`)

  // Create or get Andrea Maack house
  const perfumeHouse = await createOrGetPerfumeHouse('Andrea Maack')
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

      console.log(`\n🔍 Processing: ${originalName}`)

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
          
          // Process and update notes
          const openNotes = parseNotes(data.openNotes || '')
          const heartNotes = parseNotes(data.heartNotes || '')
          const baseNotes = parseNotes(data.baseNotes || '')

          const noteConnections = {
            perfumeNotesOpen: { connect: [] },
            perfumeNotesHeart: { connect: [] },
            perfumeNotesClose: { connect: [] }
          }

          // Process open notes
          for (const noteName of openNotes) {
            const note = await createOrGetPerfumeNote(noteName, duplicateInSameHouse.id, 'open')
            if (note) {
              noteConnections.perfumeNotesOpen.connect.push({ id: note.id })
            }
          }

          // Process heart notes
          for (const noteName of heartNotes) {
            const note = await createOrGetPerfumeNote(noteName, duplicateInSameHouse.id, 'heart')
            if (note) {
              noteConnections.perfumeNotesHeart.connect.push({ id: note.id })
            }
          }

          // Process base notes
          for (const noteName of baseNotes) {
            const note = await createOrGetPerfumeNote(noteName, duplicateInSameHouse.id, 'base')
            if (note) {
              noteConnections.perfumeNotesClose.connect.push({ id: note.id })
            }
          }

          // Update perfume with note connections
          await prisma.perfume.update({
            where: { id: duplicateInSameHouse.id },
            data: noteConnections
          })

          updated++
        } else {
          console.log(`⚠️  Perfume "${originalName}" already exists in same house with equal or better data, skipping...`)
          skipped++
        }
        continue
      }

      // Check for duplicate in other houses
      const duplicateInOtherHouse = await checkForDuplicateInOtherHouses(originalName, perfumeHouse.id)
      
      if (duplicateInOtherHouse) {
        finalName = `${originalName} - ${perfumeHouse.name}`
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
        
        console.log(`🔄 Duplicate found in other house (${duplicateInOtherHouse.perfumeHouse.name}): "${originalName}" -> "${finalName}"`)
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

      // Process notes
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
  console.log('🚀 Starting Andrea Maack Perfumes import...')
  
  try {
    await importAndreaMaackPerfumesData()
    console.log('✅ Andrea Maack Perfumes import completed!')
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

