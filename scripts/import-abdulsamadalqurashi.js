#!/usr/bin/env node
/**
 * Import Abdul Samad Al Qurashi perfumes from CSV
 * Maps CSV notes (openNotes, heartNotes, baseNotes) to Prisma schema
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

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function parseNotes(notesString) {
  if (!notesString || notesString.trim() === '' || notesString === '[]') {
    return []
  }

  try {
    // Parse as JSON array
    const parsed = JSON.parse(notesString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // If JSON parsing fails, try to split by comma
    return notesString.split(',').map(note => note.trim()).filter(note => note.length > 0)
  }
}

async function createOrGetPerfumeHouse(houseName) {
  const existingHouse = await prisma.perfumeHouse.findUnique({
    where: { name: houseName }
  })

  if (existingHouse) {
    console.log(`Found existing house: ${houseName}`)
    // Update the house to refresh updatedAt timestamp
    return await prisma.perfumeHouse.update({
      where: { id: existingHouse.id },
      data: {
        updatedAt: new Date()
      }
    })
  }

  console.log(`Creating new house: ${houseName}`)
  return await prisma.perfumeHouse.create({
    data: {
      name: houseName,
      slug: createSlug(houseName),
      type: 'niche'
    }
  })
}

async function createPerfumeNote(noteName, perfumeId, noteType) {
  if (!noteName || noteName.trim() === '') {
    return null
  }

  const normalizedName = noteName.trim().toLowerCase()
  
  // Check if a note with this name already exists
  const existingNote = await prisma.perfumeNotes.findUnique({
    where: { name: normalizedName }
  })

  if (existingNote) {
    // Note already exists - just return it (notes are shared across perfumes)
    // The schema has a unique constraint on name, so we can't create duplicates
    return existingNote
  }

  // Create new note with the perfume relationship
  const noteData = {
    name: normalizedName
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

  try {
    return await prisma.perfumeNotes.create({
      data: noteData
    })
  } catch (error) {
    // If creation fails due to unique constraint, just return null
    // This can happen with race conditions
    console.log(`     Note "${normalizedName}" already exists, skipping`)
    return null
  }
}

async function importAbdulSamadAlQurashiPerfumes() {
  console.log('🚀 Starting Abdul Samad Al Qurashi import...\n')

  const csvPath = path.join(__dirname, '../csv/perfumes_abdulsamadalqurashi.csv')

  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found:', csvPath)
    process.exit(1)
  }

  const content = fs.readFileSync(csvPath, { encoding: 'utf-8' })
  const records = parse(content, { columns: true, skip_empty_lines: true })

  console.log(`Found ${records.length} perfumes to import\n`)

  // Create or get the Abdul Samad Al Qurashi house
  const house = await createOrGetPerfumeHouse('Abdul Samad Al Qurashi')
  console.log('')

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const record of records) {
    try {
      // Skip if name is empty
      if (!record.name || record.name.trim() === '') {
        console.log('⚠️  Skipping record with no name')
        skipped++
        continue
      }

      const perfumeName = record.name.trim()

      // Check if perfume already exists
      const existingPerfume = await prisma.perfume.findUnique({
        where: { name: perfumeName }
      })

      if (existingPerfume) {
        console.log(`⏭️  Skipping "${perfumeName}" (already exists)`)
        skipped++
        continue
      }

      console.log(`📦 Importing: ${perfumeName}`)

      // Create the perfume
      const perfume = await prisma.perfume.create({
        data: {
          name: perfumeName,
          slug: createSlug(perfumeName),
          description: record.description || null,
          image: record.image || null,
          perfumeHouseId: house.id
        }
      })

      // Parse notes from CSV
      const openNotes = parseNotes(record.openNotes || '')
      const heartNotes = parseNotes(record.heartNotes || '')
      const baseNotes = parseNotes(record.baseNotes || '')

      console.log(`   - Open notes: ${openNotes.length}`)
      console.log(`   - Heart notes: ${heartNotes.length}`)
      console.log(`   - Base notes: ${baseNotes.length}`)

      // Create open notes
      for (const noteName of openNotes) {
        await createPerfumeNote(noteName, perfume.id, 'open')
      }

      // Create heart notes
      for (const noteName of heartNotes) {
        await createPerfumeNote(noteName, perfume.id, 'heart')
      }

      // Create base notes
      for (const noteName of baseNotes) {
        await createPerfumeNote(noteName, perfume.id, 'base')
      }

      console.log(`   ✅ Successfully imported "${perfumeName}"\n`)
      imported++

    } catch (error) {
      console.error(`❌ Error importing "${record.name}":`, error.message)
      errors++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Import Summary:')
  console.log(`   Imported: ${imported}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log('='.repeat(50))
  console.log('\n✅ Import completed!')
}

importAbdulSamadAlQurashiPerfumes()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Fatal error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

