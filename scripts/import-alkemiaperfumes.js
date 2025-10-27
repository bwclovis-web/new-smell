#!/usr/bin/env node
/**
 * Import Alkemia Perfumes to database
 * Handles duplicates by appending house name
 * Reuses existing notes when possible
 * Ensures no duplicate names within the same house
 * Keeps the perfume with the most data when duplicates are found
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
      type: 'indie' // Alkemia is an indie house
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

function calculateDataScore(perfume) {
  let score = 0
  if (perfume.description && perfume.description.trim() !== '') score += 1
  if (perfume.image && perfume.image.trim() !== '') score += 1
  if (perfume.detailURL && perfume.detailURL.trim() !== '') score += 1
  
  // Count notes
  const openNotes = parseNotes(perfume.openNotes || '')
  const heartNotes = parseNotes(perfume.heartNotes || '')
  const baseNotes = parseNotes(perfume.baseNotes || '')
  score += openNotes.length + heartNotes.length + baseNotes.length
  
  return score
}

async function importAlkemiaPerfumesData() {
  const csvFile = 'perfumes_alkemiaperfumes.csv'
  const filePath = path.join(__dirname, '../csv', csvFile)

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${csvFile}`)
    return
  }

  console.log(`📁 Reading ${csvFile}...`)
  const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
  const records = parse(content, { columns: true, skip_empty_lines: true })

  console.log(`📊 Found ${records.length} records to import`)

  // Create or get Alkemia Perfumes house
  const perfumeHouse = await createOrGetPerfumeHouse('Alkemia Perfumes')
  console.log(`🏠 Perfume house: ${perfumeHouse.name} (${perfumeHouse.id})`)

  let imported = 0
  let skipped = 0
  let duplicates = 0
  let sameHouseDuplicates = 0

  // Track perfumes by name to handle duplicates within the same house
  const perfumeMap = new Map()

  // First pass: group perfumes by name and find the best one
  for (let i = 0; i < records.length; i++) {
    const data = records[i]
    
    if (!data.name || data.name.trim() === '') {
      continue
    }

    const cleanName = data.name.trim()
    
    if (!perfumeMap.has(cleanName)) {
      perfumeMap.set(cleanName, [])
    }
    
    perfumeMap.get(cleanName).push({
      ...data,
      index: i,
      score: calculateDataScore(data)
    })
  }

  // Second pass: process perfumes, handling duplicates
  for (const [perfumeName, perfumeVariants] of perfumeMap) {
    try {
      // If multiple variants of the same name, keep the one with most data
      let bestPerfume = perfumeVariants[0]
      if (perfumeVariants.length > 1) {
        bestPerfume = perfumeVariants.reduce((best, current) => 
          current.score > best.score ? current : best
        )
        console.log(`🔄 Found ${perfumeVariants.length} variants of "${perfumeName}", keeping the one with most data (score: ${bestPerfume.score})`)
        sameHouseDuplicates += perfumeVariants.length - 1
      }

      const originalName = bestPerfume.name.trim()
      let finalName = originalName
      let slug = await createSlug(originalName)

      // Check if perfume already exists in database
      let existingPerfume = await prisma.perfume.findFirst({
        where: { 
          name: originalName,
          perfumeHouseId: perfumeHouse.id
        }
      })

      // If exists in the same house, skip (no duplicates within same house)
      if (existingPerfume) {
        console.log(`⚠️  Perfume "${originalName}" already exists in ${perfumeHouse.name}, skipping...`)
        skipped++
        continue
      }

      // Check if perfume exists in a different house
      let crossHouseDuplicate = await prisma.perfume.findFirst({
        where: { 
          name: originalName,
          perfumeHouseId: { not: perfumeHouse.id }
        }
      })

      // If exists in different house, append house name
      if (crossHouseDuplicate) {
        finalName = `${originalName} - Alkemia Perfumes`
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
        
        console.log(`🔄 Cross-house duplicate found: "${originalName}" -> "${finalName}"`)
        duplicates++
      }

      // Create the perfume
      const perfume = await prisma.perfume.create({
        data: {
          name: finalName,
          slug: slug,
          description: bestPerfume.description || null,
          image: bestPerfume.image || null,
          perfumeHouseId: perfumeHouse.id
        }
      })

      console.log(`✅ Created: ${finalName}`)

      // Process notes (though Alkemia perfumes have empty notes as requested)
      const openNotes = parseNotes(bestPerfume.openNotes || '')
      const heartNotes = parseNotes(bestPerfume.heartNotes || '')
      const baseNotes = parseNotes(bestPerfume.baseNotes || '')

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
      console.error(`❌ Error processing perfume "${perfumeName}":`, error.message)
      skipped++
    }
  }

  console.log('\n📈 Import Summary:')
  console.log(`✅ Imported: ${imported}`)
  console.log(`🔄 Cross-house duplicates handled: ${duplicates}`)
  console.log(`🔄 Same-house duplicates handled: ${sameHouseDuplicates}`)
  console.log(`⚠️  Skipped: ${skipped}`)
  console.log(`📊 Total processed: ${records.length}`)
}

async function main() {
  console.log('🚀 Starting Alkemia Perfumes import...')
  
  try {
    await importAlkemiaPerfumesData()
    console.log('✅ Alkemia Perfumes import completed!')
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
