import { PrismaClient } from '@prisma/client'
import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const prisma = new PrismaClient()
const readdir = promisify(fs.readdir)

// Track notes that have been processed to avoid duplicates
const processedNotes = new Set()

async function findHouse(houseName) {
  if (!houseName) {
    return null
  }
  
  try {
    // Try to find the house first
    const house = await prisma.perfumeHouse.findUnique({ 
      where: { name: houseName } 
    })
    
    // If house exists, return its ID
    if (house) {
      return house.id
    }
    
    // If house doesn't exist, create it
    console.log(`Creating perfume house: ${houseName}`)
    const newHouse = await prisma.perfumeHouse.create({
      data: { name: houseName }
    })
    
    return newHouse.id
  } catch (error) {
    console.error(`Error with house ${houseName}:`, error.message)
    return null
  }
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
    // Find or create the perfume house
    const houseId = await findHouse(perfume.perfumeHouse)
    
    if (!houseId) {
      console.log(`Skipping ${perfume.name}: couldn't create perfume house`)
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
        // Try to parse the notes field as JSON
        if (typeof perfume.notes === 'string') {
          try {
            allNotes = JSON.parse(perfume.notes)
          } catch (error) {
            // If it's not valid JSON, it might be a comma-separated string
            if (perfume.notes.includes(',')) {
              allNotes = perfume.notes.split(',').map(note => note.trim())
            } else {
              // Treat as single note
              allNotes = [perfume.notes]
            }
          }
        } else if (Array.isArray(perfume.notes)) {
          allNotes = perfume.notes
        }
      } catch (error) {
        console.error(`Error processing notes for ${perfume.name}:`, error.message)
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
      let openNotes = []; let heartNotes = []; let baseNotes = []
      
      // Process open notes
      if (perfume.openNotes) {
        try {
          if (typeof perfume.openNotes === 'string') {
            try {
              openNotes = JSON.parse(perfume.openNotes)
            } catch (jsonError) {
              // If it's not valid JSON, try comma-separated format
              openNotes = perfume.openNotes.split(',').map(note => note.trim())
            }
          } else if (Array.isArray(perfume.openNotes)) {
            openNotes = perfume.openNotes
          }
        } catch (error) {
          console.error(`Error parsing open notes for ${perfume.name}`)
        }
      }
      
      // Process heart notes
      if (perfume.heartNotes) {
        try {
          if (typeof perfume.heartNotes === 'string') {
            try {
              heartNotes = JSON.parse(perfume.heartNotes)
            } catch (jsonError) {
              // If it's not valid JSON, try comma-separated format
              heartNotes = perfume.heartNotes.split(',').map(note => note.trim())
            }
          } else if (Array.isArray(perfume.heartNotes)) {
            heartNotes = perfume.heartNotes
          }
        } catch (error) {
          console.error(`Error parsing heart notes for ${perfume.name}`)
        }
      }
      
      // Process base notes
      if (perfume.baseNotes) {
        try {
          if (typeof perfume.baseNotes === 'string') {
            try {
              baseNotes = JSON.parse(perfume.baseNotes)
            } catch (jsonError) {
              // If it's not valid JSON, try comma-separated format
              baseNotes = perfume.baseNotes.split(',').map(note => note.trim())
            }
          } else if (Array.isArray(perfume.baseNotes)) {
            baseNotes = perfume.baseNotes
          }
        } catch (error) {
          console.error(`Error parsing base notes for ${perfume.name}`)
        }
      }
      
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

// Read perfumes from a CSV file
function readPerfumesFromFile(csvFilePath) {
  return new Promise((resolve, reject) => {
    const perfumes = []
    console.log(`Reading from: ${csvFilePath}`)
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', row => perfumes.push(row))
      .on('error', error => {
        console.error(`Error reading ${csvFilePath}:`, error)
        reject(error)
      })
      .on('end', () => {
        console.log(`Read ${perfumes.length} perfumes from ${path.basename(csvFilePath)}`)
        resolve(perfumes)
      })
  })
}

// Process a list of perfumes from a single file
async function processPerfumeList(perfumes, fileName) {
  console.log(`Processing ${perfumes.length} perfumes from ${fileName}`)
  
  // Process perfumes sequentially to avoid race conditions
  for (const perfume of perfumes) {
    await processPerfume(perfume)
  }
  
  console.log(`Completed processing ${fileName}`)
}

// Get list of CSV files to process
async function getCSVFilesToProcess() {
  // If a specific file is provided, only process that file
  if (process.argv[2]) {
    const csvFilePath = path.isAbsolute(process.argv[2]) 
      ? process.argv[2] 
      : path.join(process.cwd(), process.argv[2])
    
    return [csvFilePath]
  } 
  
  // Otherwise, process all CSV files in the csv directory
  const csvDir = path.join(process.cwd(), 'csv')
  const files = await readdir(csvDir)
  const csvFiles = files
    .filter(file => file.endsWith('.csv'))
    .map(file => path.join(csvDir, file))
  
  console.log(`Found ${csvFiles.length} CSV files to process`)
  return csvFiles
}

// Main import function
async function importAllPerfumes() {
  try {
    const csvFiles = await getCSVFilesToProcess()
    
    // Process each CSV file sequentially
    for (const csvFile of csvFiles) {
      const fileName = path.basename(csvFile)
      const perfumes = await readPerfumesFromFile(csvFile)
      await processPerfumeList(perfumes, fileName)
    }
    
    console.log('All imports complete.')
  } catch (error) {
    console.error('Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importAllPerfumes()
