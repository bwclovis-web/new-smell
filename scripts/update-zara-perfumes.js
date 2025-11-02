// Script to update Zara perfumes with descriptions and notes from CSV
import { PrismaClient } from "@prisma/client"
import { parse } from "csv-parse/sync"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const prisma = new PrismaClient()

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper function to sanitize text (matching the pattern from perfume.server.ts)
const sanitizeText = (text) => {
  if (!text) {
    return ""
  }

  return text
    .normalize("NFD") // Normalize Unicode
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[\u2013\u2014]/g, "-") // en dash, em dash → hyphen
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/[\u2026]/g, "...") // ellipsis
}

// Helper function to find or create a perfume note
async function findOrCreateNote(noteName) {
  if (!noteName || noteName.trim() === "") {
    return null
  }

  const trimmedNoteName = noteName.trim().toLowerCase()

  // Check if note already exists
  let note = await prisma.perfumeNotes.findUnique({
    where: { name: trimmedNoteName },
  })

  // If note doesn't exist, create it (without perfume relationships for now)
  if (!note) {
    note = await prisma.perfumeNotes.create({
      data: {
        name: trimmedNoteName,
      },
    })
  }

  return note
}

// Helper function to parse JSON array string from CSV
function parseNotesArray(notesString) {
  if (!notesString || notesString.trim() === "") {
    return []
  }

  try {
    const parsed = JSON.parse(notesString)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn(`Failed to parse notes: ${notesString}`, error.message)
    return []
  }
}

async function updateZaraPerfumes() {
  try {
    console.log("🚀 Starting Zara perfume update...")

    const csvFilePath = path.join(__dirname, "../csv_noir/perfumes_zara.csv")

    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ File not found: ${csvFilePath}`)
      return
    }

    const content = fs.readFileSync(csvFilePath, { encoding: "utf-8" })
    const records = parse(content, { columns: true, skip_empty_lines: true })

    console.log(`📖 Found ${records.length} records in CSV`)

    for (const record of records) {
      const perfumeName = record.name?.trim()

      if (!perfumeName) {
        console.log("⚠️  Skipping record with no name")
        continue
      }

      console.log(`\n🔍 Processing: ${perfumeName}`)

      // Find perfume by name (case-insensitive)
      const perfume = await prisma.perfume.findFirst({
        where: {
          name: {
            equals: perfumeName,
            mode: "insensitive",
          },
        },
        include: {
          perfumeNotesOpen: true,
          perfumeNotesHeart: true,
          perfumeNotesClose: true,
        },
      })

      if (!perfume) {
        console.log(`❌ Perfume not found: ${perfumeName}`)
        continue
      }

      console.log(`✅ Found perfume: ${perfume.name} (ID: ${perfume.id})`)

      // Parse notes from CSV
      const openNotes = parseNotesArray(record.openNotes)
      const heartNotes = parseNotesArray(record.heartNotes)
      const baseNotes = parseNotesArray(record.baseNotes)

      console.log(`📝 Notes - Open: ${openNotes.join(", ") || "none"}`)
      console.log(`📝 Notes - Heart: ${heartNotes.join(", ") || "none"}`)
      console.log(`📝 Notes - Base: ${baseNotes.join(", ") || "none"}`)

      // Find or create all notes and collect their IDs
      const openNoteIds = []
      for (const noteName of openNotes) {
        const note = await findOrCreateNote(noteName)
        if (note) {
          openNoteIds.push(note.id)
        }
      }

      const heartNoteIds = []
      for (const noteName of heartNotes) {
        const note = await findOrCreateNote(noteName)
        if (note) {
          heartNoteIds.push(note.id)
        }
      }

      const baseNoteIds = []
      for (const noteName of baseNotes) {
        const note = await findOrCreateNote(noteName)
        if (note) {
          baseNoteIds.push(note.id)
        }
      }

      // Update perfume with description and notes
      const description = sanitizeText(record.description) || null

      console.log(`💾 Updating perfume with description and notes...`)

      await prisma.perfume.update({
        where: { id: perfume.id },
        data: {
          description,
          perfumeNotesOpen: {
            set: openNoteIds.map(id => ({ id })),
          },
          perfumeNotesHeart: {
            set: heartNoteIds.map(id => ({ id })),
          },
          perfumeNotesClose: {
            set: baseNoteIds.map(id => ({ id })),
          },
        },
      })

      console.log(`✅ Successfully updated: ${perfumeName}`)
    }

    console.log("\n🎉 Update completed successfully!")
  } catch (error) {
    console.error("❌ Error updating perfumes:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
updateZaraPerfumes()



