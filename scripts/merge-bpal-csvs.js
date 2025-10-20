#!/usr/bin/env node
/**
 * Merge perfumes_blackphoenixalchemylab.csv into bpal_enhanced_progress_1450.csv
 * Keeps bpal_enhanced_progress_1450.csv as source of truth
 * Only adds new perfumes from blackphoenixalchemylab that don't exist yet
 */

import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function normalizeForComparison(name) {
  return name.toLowerCase().trim().replace(/[^\w]/g, '')
}

function parseNotes(openNotes, heartNotes, baseNotes) {
  const notes = []
  
  // Helper to parse and add notes
  const addNotes = (notesString) => {
    if (!notesString || notesString.trim() === '' || notesString === '[]') {
      return
    }
    try {
      const parsed = JSON.parse(notesString)
      if (Array.isArray(parsed)) {
        notes.push(...parsed)
      }
    } catch {
      // If not valid JSON, skip
    }
  }

  addNotes(openNotes)
  addNotes(heartNotes)
  addNotes(baseNotes)

  // Remove duplicates and return as JSON string
  const uniqueNotes = [...new Set(notes)]
  return JSON.stringify(uniqueNotes)
}

async function mergeBpalCsvs() {
  console.log('🚀 Starting BPAL CSV merge...\n')

  const enhancedPath = path.join(__dirname, '../csv/bpal_enhanced_progress_1450.csv')
  const blackPhoenixPath = path.join(__dirname, '../csv/perfumes_blackphoenixalchemylab.csv')

  if (!fs.existsSync(enhancedPath)) {
    console.error('❌ Enhanced CSV file not found:', enhancedPath)
    process.exit(1)
  }

  if (!fs.existsSync(blackPhoenixPath)) {
    console.error('❌ Black Phoenix CSV file not found:', blackPhoenixPath)
    process.exit(1)
  }

  // Read both CSVs
  console.log('📖 Reading enhanced CSV...')
  const enhancedContent = fs.readFileSync(enhancedPath, { encoding: 'utf-8' })
  const enhancedRecords = parse(enhancedContent, { columns: true, skip_empty_lines: true })
  console.log(`   Found ${enhancedRecords.length} perfumes in enhanced CSV`)

  console.log('📖 Reading Black Phoenix CSV...')
  const blackPhoenixContent = fs.readFileSync(blackPhoenixPath, { encoding: 'utf-8' })
  const blackPhoenixRecords = parse(blackPhoenixContent, { columns: true, skip_empty_lines: true })
  console.log(`   Found ${blackPhoenixRecords.length} perfumes in Black Phoenix CSV\n`)

  // Create a map of existing perfumes by normalized name
  const existingPerfumes = new Map()
  for (const record of enhancedRecords) {
    if (record.name && record.name.trim()) {
      existingPerfumes.set(normalizeForComparison(record.name), record)
    }
  }

  console.log(`📊 ${existingPerfumes.size} unique perfumes in enhanced CSV\n`)

  // Find new perfumes to add
  const newPerfumes = []
  let duplicates = 0

  for (const record of blackPhoenixRecords) {
    if (!record.name || record.name.trim() === '') {
      continue
    }

    const normalizedName = normalizeForComparison(record.name)
    
    if (!existingPerfumes.has(normalizedName)) {
      // Convert schema from openNotes/heartNotes/baseNotes to notes
      const convertedRecord = {
        name: record.name,
        description: record.description || '',
        image: record.image || '',
        perfumeHouse: record.perfumeHouse || 'Black Phoenix Alchemy Lab',
        notes: parseNotes(record.openNotes || '', record.heartNotes || '', record.baseNotes || ''),
        detailURL: record.detailURL || ''
      }
      
      newPerfumes.push(convertedRecord)
      console.log(`✨ New perfume found: ${record.name}`)
    } else {
      duplicates++
    }
  }

  console.log(`\n📊 Merge Summary:`)
  console.log(`   - Existing perfumes (kept): ${enhancedRecords.length}`)
  console.log(`   - Duplicates (skipped): ${duplicates}`)
  console.log(`   - New perfumes (added): ${newPerfumes.length}`)
  console.log(`   - Total after merge: ${enhancedRecords.length + newPerfumes.length}\n`)

  // Merge: enhanced records + new perfumes
  const mergedRecords = [...enhancedRecords, ...newPerfumes]

  // Write merged CSV back to enhanced file
  console.log('💾 Writing merged data...')
  
  // Manually create CSV output
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }
  
  const columns = ['name', 'description', 'image', 'perfumeHouse', 'notes', 'detailURL']
  const csvLines = [columns.join(',')]
  
  for (const record of mergedRecords) {
    const line = columns.map(col => escapeCSV(record[col])).join(',')
    csvLines.push(line)
  }
  
  const csvOutput = csvLines.join('\n')
  fs.writeFileSync(enhancedPath, csvOutput, { encoding: 'utf-8' })
  console.log(`   ✅ Merged CSV written to: ${enhancedPath}`)

  console.log('\n✅ Merge completed successfully!')
  console.log(`\n📝 Next steps:`)
  console.log(`   1. Review the merged file: ${enhancedPath}`)
  console.log(`   2. Import to database (will be done automatically)`)
  console.log(`   3. Delete the old file (will be done automatically)`)
}

mergeBpalCsvs()
  .catch(e => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })

