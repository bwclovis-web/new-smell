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

// Cache for performance optimization
const houseCache = new Map()
const noteCache = new Map()

function validatePerfume(perfume) {
  const issues = []
  if (!perfume.name || perfume.name.trim() === '') {
    issues.push('Missing name')
  }
  if (!perfume.perfumeHouse || perfume.perfumeHouse.trim() === '') {
    issues.push('Missing perfumeHouse')
  }
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

async function createHouse(houseName) {
  const house = await prisma.perfumeHouse.create({
    data: { name: houseName },
  })
  stats.houses++
  return house.id
}

async function findOrCreateHouse(houseName) {
  if (!houseName || houseName.trim() === '') {
    stats.errors++
    return null
  }

  const normalizedName = houseName.trim()
  if (houseCache.has(normalizedName)) {
    return houseCache.get(normalizedName)
  }

  const house = await prisma.perfumeHouse.findFirst({
    where: { name: { equals: normalizedName, mode: 'insensitive' } },
  })

  const houseId = house ? house.id : await createHouse(normalizedName)
  houseCache.set(normalizedName, houseId)
  return houseId
}

async function createNote(noteName) {
  const note = await prisma.perfumeNotes.create({
    data: { name: noteName },
  })
  stats.notes++
  return note.id
}

async function findOrCreateNote(noteName) {
  if (!noteName || noteName.trim() === '') {
    return null
  }

  const normalizedName = noteName.trim()
  if (noteCache.has(normalizedName)) {
    return noteCache.get(normalizedName)
  }

  const note = await prisma.perfumeNotes.findFirst({
    where: { name: { equals: normalizedName, mode: 'insensitive' } },
  })

  const noteId = note ? note.id : await createNote(normalizedName)
  noteCache.set(normalizedName, noteId)
  return noteId
}

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

async function connectNoteToPerfume(noteId, noteType, perfumeId) {
  if (!noteId || (await isNoteConnected(noteId, perfumeId))) {
    return
  }

  const updateData = {}
  const fieldMap = {
    open: 'perfumeOpenId',
    heart: 'perfumeHeartId',
    base: 'perfumeCloseId',
  }

  if (fieldMap[noteType]) {
    updateData[fieldMap[noteType]] = perfumeId
    await prisma.perfumeNotes.update({
      where: { id: noteId },
      data: updateData,
    })
  }
}

async function processSingleNote(perfumeId, noteName, noteType) {
  const noteId = await findOrCreateNote(noteName.trim())
  if (noteId) {
    await connectNoteToPerfume(noteId, noteType, perfumeId)
  }
}

async function processNotesForPerfume(perfumeId, notes) {
  const noteTypes = ['open', 'heart', 'base']
  for (const noteType of noteTypes) {
    if (notes[noteType]) {
      const noteList = notes[noteType]
      for (const noteName of noteList) {
        await processSingleNote(perfumeId, noteName, noteType)
      }
    }
  }
}

async function findExistingPerfumes(perfume, houseId) {
  return await prisma.perfume.findMany({
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
}

async function findAndMergePerfume(perfume, houseId) {
  const existingPerfumes = await findExistingPerfumes(perfume, houseId)

  if (existingPerfumes.length > 0) {
    return handleExistingPerfume(existingPerfumes, perfume)
  }
  return null
}

async function handleExistingPerfume(existingPerfumes, perfume) {
  const exactMatch = existingPerfumes.find(existing => existing.name.toLowerCase() === perfume.name.toLowerCase())

  if (exactMatch) {
    const notes = parseNotes(perfume)
    const needsNotes = await checkIfPerfumeNeedsNotes(exactMatch.id, notes)
    if (needsNotes) {
      return exactMatch
    }
    stats.skipped++
    return null
  }
  return null
}

async function createNewPerfume(perfume, houseId) {
  try {
    const newPerfume = await prisma.perfume.create({
      data: {
        name: perfume.name,
        perfumeHouseId: houseId,
        image: perfume.image,
        description: perfume.description,
      },
    })
    stats.created++
    return newPerfume
  } catch (error) {
    return handlePerfumeCreationError(error, perfume)
  }
}

async function handlePerfumeCreationError(error, perfume) {
  if (error.code === 'P2002') {
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

function parseNoteField(perfume, field) {
  try {
    return JSON.parse(perfume[field])
  } catch {
    return perfume[field].split(',').map(note => note.trim())
  }
}

function parseNotesFromFields(perfume) {
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
      notes[type] = parseNoteField(perfume, field)
    }
  }

  return { notes, hasNewNoteFormat }
}

function parseNotesLegacy(perfume) {
  if (perfume.notes) {
    try {
      return JSON.parse(perfume.notes)
    } catch {
      return { base: perfume.notes.split(',').map(note => note.trim()) }
    }
  }
  return {}
}

function parseNotes(perfume) {
  const { notes, hasNewNoteFormat } = parseNotesFromFields(perfume)
  
  if (hasNewNoteFormat) {
    return notes
  }

  return parseNotesLegacy(perfume)
}

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

    return existingNoteNames.size < expectedNoteNames.size
  } catch {
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

async function processFile(fileName) {
  const csvFilePath = path.resolve(fileName)
  // eslint-disable-next-line no-console
  console.log(`Starting import from: ${csvFilePath}`)
  
  const perfumes = await readCsv(csvFilePath)
  // eslint-disable-next-line no-console
  console.log(`Found ${perfumes.length} perfumes to process`)
  
  for (const perfume of perfumes) {
    try {
      await processPerfume(perfume)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error processing perfume ${perfume.name}:`, error)
      stats.errors++
    }
  }
}

async function main() {
  const fileNames = process.argv.slice(2)
  if (fileNames.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No CSV file specified. Usage: node perfume_import.js <csv-file>')
    return
  }

  for (const fileName of fileNames) {
    try {
      await processFile(fileName)
      
      // eslint-disable-next-line no-console
      console.log('\nImport completed!')
      // eslint-disable-next-line no-console
      console.log('Statistics:', stats)
      
    } catch (error) {
      // eslint-disable-next-line no-console
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
