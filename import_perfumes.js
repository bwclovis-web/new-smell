import { PrismaClient } from '@prisma-app/client'
import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Get CSV file path from command line argument or use default
const csvFileName = process.argv[2] || 'csv/perfumes_4160tuesdays_updated.csv'
const csvFilePath = path.isAbsolute(csvFileName) ? csvFileName : path.join(process.cwd(), csvFileName)

console.log(`Importing from: ${csvFilePath}`)

// Track notes that have been processed to avoid duplicates
const processedNotes = new Set()

async function findHouse(houseName) {
  if (!houseName) {
    return null
  }
  
  const house = await prisma.perfumeHouse.findUnique({ 
    where: { name: houseName } 
  })
  
  if (!house) {
    console.warn(`Warning: Perfume house '${houseName}' not found. Please create it first.`)
    return null
  }
  
  return house.id
}

// Find a note by name or create it if it doesn't exist
async function findOrCreateNote(noteName) {
  if (!noteName || processedNotes.has(noteName)) {
    return null
  }
  
  try {
    let note = await prisma.perfumeNotes.findUnique({ 
      where: { name: noteName } 
    })
    
    if (!note) {
      note = await prisma.perfumeNotes.create({
        data: { name: noteName }
      })
    }
    
    // Mark this note as processed
    processedNotes.add(noteName)
    return note.id
  } catch (error) {
    console.error(`Error with note ${noteName}:`, error.message)
    return null
  }
}

// Connect a note to a perfume
async function connectNoteToPerfume(noteId, noteType, perfumeId) {
  if (!noteId) {
    return
  }
  
  try {
    const updateData = {}
    
    if (noteType === 'open') {
      updateData.perfumeOpenId = perfumeId
    } else if (noteType === 'heart') {
      updateData.perfumeHeartId = perfumeId
    } else if (noteType === 'base') {
      updateData.perfumeCloseId = perfumeId
    }
    
    await prisma.perfumeNotes.update({
      where: { id: noteId },
      data: updateData
    })
  } catch (error) {
    console.error(`Error connecting note ${noteId} to perfume:`, error.message)
  }
}

// Process a single perfume
async function processPerfume(perfume) {
  try {
    // Find the perfume house (must already exist)
    const houseId = await findHouse(perfume.perfumeHouse)
    
    if (!houseId) {
      console.log(`Skipping ${perfume.name}: perfume house not found`)
      return
    }
      // Check if perfume already exists
    const existingPerfume = await prisma.perfume.findUnique({
      where: { name: perfume.name }
    })
    
    let created
    if (existingPerfume) {
      // Update existing perfume with new data
      created = await prisma.perfume.update({
        where: { id: existingPerfume.id },
        data: {
          description: perfume.description,
          image: perfume.image,
          perfumeHouseId: houseId
        }
      })
      console.log(`Updated: ${perfume.name}`)
    } else {
      // Create new perfume
      created = await prisma.perfume.create({
        data: {
          name: perfume.name,
          description: perfume.description,
          image: perfume.image,
          perfumeHouseId: houseId
        }
      })
      console.log(`Created: ${perfume.name}`)
    }
      // Process notes - handle different CSV structures
    let allNotes = []
    
    // Check if this is a Poesie-style CSV (single notes field) or 4160 Tuesdays style (separate fields)
    if (perfume.notes && !perfume.openNotes) {
      // Poesie style - single notes field
      try {
        allNotes = JSON.parse(perfume.notes)
      } catch (error) {
        console.error(`Error parsing notes for ${perfume.name}:`, error.message)
        allNotes = []
      }
      
      // For Poesie perfumes, add all notes as general notes (not categorized)
      for (const note of allNotes) {
        const noteId = await findOrCreateNote(note)
        if (noteId) {
          // Since Poesie doesn't categorize notes, we'll add them as heart notes
          await connectNoteToPerfume(noteId, 'heart', created.id)
        }
      }
    } else {
      // 4160 Tuesdays style - separate note fields
      const openNotes = perfume.openNotes ? JSON.parse(perfume.openNotes) : []
      const heartNotes = perfume.heartNotes ? JSON.parse(perfume.heartNotes) : []
      const baseNotes = perfume.baseNotes ? JSON.parse(perfume.baseNotes) : []
      
      // Process each note type
      for (const note of openNotes) {
        const noteId = await findOrCreateNote(note)
        if (noteId) {
          await connectNoteToPerfume(noteId, 'open', created.id)
        }
      }
      
      for (const note of heartNotes) {
        const noteId = await findOrCreateNote(note)
        if (noteId) {
          await connectNoteToPerfume(noteId, 'heart', created.id)
        }
      }
      
      for (const note of baseNotes) {
        const noteId = await findOrCreateNote(note)
        if (noteId) {
          await connectNoteToPerfume(noteId, 'base', created.id)
        }
      }
    }
    
    console.log(`Imported: ${perfume.name}`)
  } catch (error) {
    console.error(`Error importing ${perfume.name}:`, error.message)
  }
}

// Main import function
async function importPerfumes() {
  const perfumes = []
  
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', row => perfumes.push(row))
    .on('end', async () => {
      // Process perfumes sequentially to avoid race conditions
      for (const perfume of perfumes) {
        await processPerfume(perfume)
      }
      
      await prisma.$disconnect()
      console.log('Import complete.')
    })
}

importPerfumes()
