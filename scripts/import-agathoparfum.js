#!/usr/bin/env node
/**
 * Import Agatho Parfum perfumes to database
 * Handles duplicates by appending house name
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
      type: 'indie' // Agatho is an indie house
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

async function importAgathoParfumData() {
  const csvFile = 'perfumes_agathoparfum.csv'
  const filePath = path.join(__dirname, '../csv', csvFile)

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${csvFile}`)
    return
  }

  console.log(`📁 Reading ${csvFile}...`)
  const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
  const records = parse(content, { columns: true, skip_empty_lines: true })

  console.log(`📊 Found ${records.length} records to import`)

  // Create or get Agatho house
  const perfumeHouse = await createOrGetPerfumeHouse('Agatho')
  console.log(`🏠 Perfume house: ${perfumeHouse.name} (${perfumeHouse.id})`)

  let imported = 0
  let skipped = 0
  let duplicates = 0

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

      // Check if perfume already exists
      let existingPerfume = await prisma.perfume.findFirst({
        where: { name: originalName }
      })

      // If exists, append house name
      if (existingPerfume) {
        finalName = `${originalName} - Agatho`
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
        
        console.log(`🔄 Duplicate found: "${originalName}" -> "${finalName}"`)
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
  console.log(`🔄 Duplicates handled: ${duplicates}`)
  console.log(`⚠️  Skipped: ${skipped}`)
  console.log(`📊 Total processed: ${records.length}`)
}

async function main() {
  console.log('🚀 Starting Agatho Parfum import...')
  
  try {
    await importAgathoParfumData()
    console.log('✅ Agatho Parfum import completed!')
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
