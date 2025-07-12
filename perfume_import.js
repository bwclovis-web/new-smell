import { PrismaClient } from '@prisma/client'
import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const stats = {
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  houses: 0,
  notes: 0,
}

function validatePerfume(perfume) {
  const issues = []
  if (!perfume.name) {
    issues.push('Missing name')
  }
  if (!perfume.perfumeHouse) {
    issues.push('Missing perfumeHouse')
  }
  // Add more validation rules as needed
  return {
    valid: issues.length === 0,
    issues,
  }
}

async function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', () => resolve(results))
      .on('error', error => reject(error))
  })
}

// Find or create a perfume house
async function findOrCreateHouse(houseName) {
  if (!houseName) {
    stats.errors++
    return null
  }

  let house = await prisma.perfumeHouse.findFirst({
    where: { name: { equals: houseName, mode: 'insensitive' } },
  })

  if (!house) {
    house = await prisma.perfumeHouse.create({
      data: { name: houseName },
    })
    stats.houses++
  }
  return house.id
}

// Find or create a perfume note
async function findOrCreateNote(noteName) {
  if (!noteName) {
    return null
  }

  let note = await prisma.perfumeNotes.findFirst({
    where: { name: { equals: noteName, mode: 'insensitive' } },
  })

  if (!note) {
    note = await prisma.perfumeNotes.create({
      data: { name: noteName },
    })
    stats.notes++
  }
  return note.id
}

// Check if a note is already connected to a perfume
async function isNoteConnected(noteId, perfumeId) {
  const existingConnection = await prisma.perfumeNotes.findFirst({
    where: {
      id: noteId,
      OR: [
        { perfumeOpenId: perfumeId },
        { perfumeHeartId: perfumeId },
        { perfumeCloseId: perfumeId },
      ],
    },
  })
  return !!existingConnection
}

// Connect a note to a perfume
async function connectNoteToPerfume(noteId, noteType, perfumeId) {
  if (!noteId || (await isNoteConnected(noteId, perfumeId))) {
    return
  }

  const updateData = {}
  if (noteType === 'open') {
    updateData.perfumeOpenId = perfumeId
  } else if (noteType === 'heart') {
    updateData.perfumeHeartId = perfumeId
  } else if (noteType === 'base') {
    updateData.perfumeCloseId = perfumeId
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.perfumeNotes.update({
      where: { id: noteId },
      data: updateData,
    })
  }
}

// Process a single note for a perfume
async function processSingleNote(perfumeId, noteName, noteType) {
  const noteId = await findOrCreateNote(noteName.trim())
  if (noteId) {
    await connectNoteToPerfume(noteId, noteType, perfumeId)
  }
}

// Process all notes for a given perfume
async function processNotesForPerfume(perfumeId, notes) {
  const noteTypes = ['open', 'heart', 'base']
  for (const noteType of noteTypes) {
    if (notes[noteType]) {
      for (const noteName of notes[noteType]) {
        await processSingleNote(perfumeId, noteName, noteType)
      }
    }
  }
}

// Find an existing perfume and merge data if necessary
async function findAndMergePerfume(perfume, houseId) {
  const existingPerfumes = await prisma.perfume.findMany({
    where: {
      OR: [
        {
          name: {
            equals: perfume.name,
            mode: 'insensitive',
          },
        },
        {
          AND: [
            {
              name: {
                contains: perfume.name,
                mode: 'insensitive',
              },
            },
            {
              perfumeHouseId: houseId,
            },
          ],
        },
      ],
    },
  })

  if (existingPerfumes.length > 0) {
    return handleExistingPerfume(existingPerfumes, perfume)
  }
  return null
}

// Handle cases where a perfume might already exist
async function handleExistingPerfume(existingPerfumes, perfume) {
  const exactMatch = existingPerfumes.find(existing => existing.name.toLowerCase() === perfume.name.toLowerCase(),)

  if (exactMatch) {
    const notes = parseNotes(perfume)
    const needsNotes = await checkIfPerfumeNeedsNotes(exactMatch.id, notes)
    if (needsNotes) {
      return exactMatch // Return so notes can be processed
    }
    stats.skipped++
    return null // Skip if no new notes are needed
  }
  return null
}

// Create a new perfume entry
async function createNewPerfume(perfume, houseId) {
  try {
    const newPerfume = await prisma.perfume.create({
      data: {
        name: perfume.name,
        perfumeHouseId: houseId,
        image: perfume.image,
        concentration: perfume.concentration,
        gender: perfume.gender,
        perfumer: perfume.perfumer,
        description: perfume.description,
        year: perfume.year,
        tags: perfume.tags,
      },
    })
    stats.created++
    return newPerfume
  } catch (error) {
    if (error.code === 'P2002') {
      // Unique constraint violation - perfume already exists
      const existingPerfume = await prisma.perfume.findFirst({
        where: { 
          name: { equals: perfume.name, mode: 'insensitive' } 
        },
      })
      if (existingPerfume) {
        stats.skipped++
        return existingPerfume
      }
    }
    throw error
  }
}

// Parse the notes field from the CSV
function parseNotes(perfume) {
  const notes = {}
  const noteFields = {
    openNotes: 'open',
    heartNotes: 'heart',
    baseNotes: 'base',
  }

  let hasNewNoteFormat = false
  for (const [field, type] of Object.entries(noteFields)) {
    if (perfume[field]) {
      hasNewNoteFormat = true
      try {
        notes[type] = JSON.parse(perfume[field])
      } catch (e) {
        notes[type] = perfume[field].split(',').map(n => n.trim())
      }
    }
  }

  if (hasNewNoteFormat) {
    return notes
  }

  // Fallback for old format with single 'notes' field
  if (perfume.notes) {
    try {
      // Handles JSON object in 'notes' field
      return JSON.parse(perfume.notes)
    } catch (e) {
      // Handles comma-separated string in 'notes' field
      return { base: perfume.notes.split(',').map(note => note.trim()) }
    }
  }

  return {}
}

// Check if a perfume in the database needs its notes updated
async function checkIfPerfumeNeedsNotes(perfumeId, expectedNotes = {}) {
  try {
    const existingNotes = await prisma.perfumeNotes.findMany({
      where: {
        OR: [
          { perfumeOpenId: perfumeId },
          { perfumeHeartId: perfumeId },
          { perfumeCloseId: perfumeId },
        ],
      },
    })

    const existingNoteNames = new Set(existingNotes.map(note => note.name))
    const expectedNoteNames = new Set([
      ...(expectedNotes.open || []),
      ...(expectedNotes.heart || []),
      ...(expectedNotes.base || []),
    ])

    if (existingNoteNames.size >= expectedNoteNames.size) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

async function processPerfumeRecord(perfume, houseId) {
  let perfumeRecord = await findAndMergePerfume(perfume, houseId)

  if (!perfumeRecord) {
    perfumeRecord = await createNewPerfume(perfume, houseId)
  }
  return perfumeRecord
}

// Process a single perfume record from the CSV
async function processPerfume(perfume) {
  const validation = validatePerfume(perfume)
  if (!validation.valid) {
    stats.skipped++
    return
  }

  const houseId = await findOrCreateHouse(perfume.perfumeHouse)
  if (!houseId) {
    stats.skipped++
    return
  }

  const perfumeRecord = await processPerfumeRecord(perfume, houseId)

  if (!perfumeRecord) {
    return
  }

  const notes = parseNotes(perfume)
  if (notes) {
    await processNotesForPerfume(perfumeRecord.id, notes)
  }
}

// Main function to orchestrate the import process
async function main() {
  const fileNames = process.argv.slice(2)
  if (fileNames.length === 0) {
    console.log('No CSV file specified. Usage: node perfume_import.js <csv-file>')
    return
  }

  for (const fileName of fileNames) {
    const csvFilePath = path.resolve(fileName)
    console.log(`Starting import from: ${csvFilePath}`)
    
    try {
      const perfumes = await readCsv(csvFilePath)
      console.log(`Found ${perfumes.length} perfumes to process`)
      
      for (const perfume of perfumes) {
        try {
          await processPerfume(perfume)
        } catch (error) {
          console.error(`Error processing perfume ${perfume.name}:`, error)
          stats.errors++
        }
      }
      
      console.log('\nImport completed!')
      console.log('Statistics:', stats)
      
    } catch (error) {
      console.error('Error reading CSV file:', error)
      stats.errors++
    }
  }
}

main()
  .catch(() => {
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
