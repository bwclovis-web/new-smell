#!/usr/bin/env node
/**
 * Update existing Fzotic perfumes with film noir enriched data from csv_noir
 * This script updates descriptions and notes for existing perfumes
 * Note: Due to Prisma schema limitations, notes are one-to-one with perfumes
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

async function createOrGetPerfumeNote(noteName, perfumeId, noteType) {
  if (!noteName || noteName.trim() === '') {
    return null
  }

  const trimmedNoteName = noteName.trim().toLowerCase()

  // Check if note exists
  const existingNote = await prisma.perfumeNotes.findUnique({
    where: { name: trimmedNoteName },
  })

  const noteData = {
    name: trimmedNoteName,
  }

  // Set the appropriate perfume relationship based on note type
  if (noteType === 'open') {
    noteData.perfumeOpenId = perfumeId
  } else if (noteType === 'heart') {
    noteData.perfumeHeartId = perfumeId
  } else if (noteType === 'base') {
    noteData.perfumeCloseId = perfumeId
  }

  // If note exists, update it to point to this perfume
  // Note: This overwrites the previous relationship, which is the intended behavior
  // with the current schema where notes can only belong to one perfume
  if (existingNote) {
    return await prisma.perfumeNotes.update({
      where: { id: existingNote.id },
      data: noteData,
    })
  }

  // Create new note
  return await prisma.perfumeNotes.create({
    data: noteData,
  })
}

async function updateFzoticPerfumes() {
  const csvFile = 'csv_noir/perfumes_fzotic.csv'
  const filePath = path.join(__dirname, '..', csvFile)

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

  console.log(`📊 Found ${records.length} records to update`)

  // Get Fzotic house
  const perfumeHouse = await prisma.perfumeHouse.findFirst({
    where: {
      name: {
        equals: 'Fzotic',
        mode: 'insensitive'
      }
    }
  })

  if (!perfumeHouse) {
    console.log('❌ Fzotic house not found in database')
    return
  }

  console.log(`🏠 Perfume house: ${perfumeHouse.name} (${perfumeHouse.id})`)

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (let i = 0; i < records.length; i++) {
    const data = records[i]
    
    try {
      // Skip if name is empty
      if (!data.name || data.name.trim() === '') {
        console.log(`⚠️  Skipping record ${i + 1}: No name`)
        skipped++
        continue
      }

      const perfumeName = data.name.trim()
      console.log(`\n🔍 Processing: ${perfumeName}`)

      // Find existing perfume by name in Fzotic house
      const existingPerfume = await prisma.perfume.findFirst({
        where: {
          name: perfumeName,
          perfumeHouseId: perfumeHouse.id
        }
      })
      
      if (!existingPerfume) {
        console.log(`⚠️  Perfume "${perfumeName}" not found in database, skipping...`)
        notFound++
        continue
      }

      // First, delete old notes for this perfume
      await prisma.perfumeNotes.deleteMany({
        where: {
          OR: [
            { perfumeOpenId: existingPerfume.id },
            { perfumeHeartId: existingPerfume.id },
            { perfumeCloseId: existingPerfume.id }
          ]
        }
      })

      // Process notes from CSV
      const openNotes = parseNotes(data.openNotes || '')
      const heartNotes = parseNotes(data.heartNotes || '')
      const baseNotes = parseNotes(data.baseNotes || '')

      // Process open notes
      for (const noteName of openNotes) {
        await createOrGetPerfumeNote(noteName, existingPerfume.id, 'open')
      }

      // Process heart notes
      for (const noteName of heartNotes) {
        await createOrGetPerfumeNote(noteName, existingPerfume.id, 'heart')
      }

      // Process base notes
      for (const noteName of baseNotes) {
        await createOrGetPerfumeNote(noteName, existingPerfume.id, 'base')
      }

      // Update the perfume with new description
      await prisma.perfume.update({
        where: { id: existingPerfume.id },
        data: {
          description: data.description || null
        }
      })

      console.log(`✅ Updated: ${perfumeName}`)
      updated++

    } catch (error) {
      console.error(`❌ Error processing record ${i + 1}:`, error.message)
      console.error('Record data:', data)
      skipped++
    }
  }

  console.log('\n📈 Update Summary:')
  console.log(`✅ Updated: ${updated}`)
  console.log(`⚠️  Not found: ${notFound}`)
  console.log(`⚠️  Skipped: ${skipped}`)
  console.log(`📊 Total processed: ${records.length}`)
}

async function main() {
  console.log('🚀 Starting Fzotic perfumes update with noir data...')
  
  try {
    await updateFzoticPerfumes()
    console.log('✅ Fzotic perfumes update completed!')
  } catch (error) {
    console.error('❌ Update failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

