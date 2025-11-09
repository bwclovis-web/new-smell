// Clean and import script for perfumes_strangers-parfumerie.csv
// Handles duplicates intelligently:
// - Same house: update existing with missing info
// - Different house: append "-house name"
// - Uses existing notes from database
// - Only creates new notes when needed
// - Cleans invalid note entries (JSON schema data, descriptive text, etc.)

import { PerfumeNoteType, PrismaClient } from "@prisma/client"
import { parse } from "csv-parse/sync"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const prisma = new PrismaClient()

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Slug creation function
const createUrlSlug = (name: string): string => {
  if (!name || typeof name !== "string") {
    return ""
  }

  return (
    name
      .replace(/%20/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2026]/g, "...")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/\s+/g, "-")
      .replace(/_/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
  )
}

// Calculate data completeness score
function calculateDataCompleteness(data: any): number {
  let score = 0
  if (data.description && data.description.trim()) {
 score += 10 
}
  if (data.image && data.image.trim()) {
 score += 10 
}
  const openNotes = parseAndCleanNotes(data.openNotes || "")
  const heartNotes = parseAndCleanNotes(data.heartNotes || "")
  const baseNotes = parseAndCleanNotes(data.baseNotes || "")
  score += openNotes.length * 2
  score += heartNotes.length * 2
  score += baseNotes.length * 2
  return score
}

// Clean note name - remove invalid characters, JSON schema data, etc.
function cleanNoteName(noteName: string): string | null {
  if (!noteName || typeof noteName !== "string") {
    return null
  }

  let cleaned = noteName.trim()

  // Skip if it's clearly JSON schema data
  if (
    cleaned.includes('"@type"') ||
    cleaned.includes('"@context"') ||
    cleaned.includes('"sku"') ||
    cleaned.includes('"price"') ||
    cleaned.includes('"availability"') ||
    cleaned.includes('"seller"') ||
    cleaned.includes('"offers"') ||
    cleaned.includes('"name"') ||
    cleaned.includes('"url"') ||
    cleaned.includes("\\r\\n") ||
    cleaned.includes("nbsp") ||
    cleaned.startsWith("{") ||
    cleaned.startsWith("[{")
  ) {
    return null
  }

  // Skip if it's descriptive text (too long or contains sentence-like patterns)
  if (
    cleaned.length > 50 ||
    cleaned.includes(":") ||
    cleaned.includes("Top:") ||
    cleaned.includes("Heart:") ||
    cleaned.includes("Base:") ||
    cleaned.includes("In ") ||
    cleaned.includes("When ") ||
    cleaned.includes("As ") ||
    cleaned.includes("the ") ||
    cleaned.includes("this ") ||
    cleaned.includes("that ") ||
    cleaned.includes("where ") ||
    cleaned.includes("known as") ||
    cleaned.includes("transports you") ||
    cleaned.includes("painting a") ||
    cleaned.includes("embraces") ||
    cleaned.includes("emphasizes") ||
    cleaned.includes("particularly") ||
    cleaned.includes("\\r\\n") ||
    cleaned.includes("\\u00a0")
  ) {
    return null
  }

  // Remove common prefixes/suffixes that are not note names
  cleaned = cleaned
    .replace(/^Top:\s*/i, "")
    .replace(/^Heart:\s*/i, "")
    .replace(/^Base:\s*/i, "")
    .replace(/^Note:\s*/i, "")
    .replace(/\s*\(.*?\)\s*$/, "") // Remove parenthetical notes
    .trim()

  // Skip if empty or too short after cleaning
  if (cleaned.length === 0 || cleaned.length < 2) {
    return null
  }

  return cleaned.toLowerCase()
}

function parseAndCleanNotes(notesString: string): string[] {
  if (!notesString || notesString.trim() === "" || notesString === "[]") {
    return []
  }

  let parsed: string[] = []

  try {
    const jsonParsed = JSON.parse(notesString)
    parsed = Array.isArray(jsonParsed) ? jsonParsed : []
  } catch {
    // If not valid JSON, try splitting by comma
    parsed = notesString
      .split(",")
      .map(note => note.trim())
      .filter(note => note.length > 0)
  }

  // Clean and filter notes
  const cleanedNotes = parsed
    .map(cleanNoteName)
    .filter((note): note is string => note !== null && note.length > 0)

  // Remove duplicates
  return [...new Set(cleanedNotes)]
}

async function importCsv(
  filePath: string,
  importFunction: (data: any) => Promise<void>
) {
  const content = fs.readFileSync(filePath, { encoding: "utf-8" })
  const records = parse(content, { columns: true, skip_empty_lines: true })

  console.log(`Importing ${records.length} records from ${path.basename(filePath)}`)

  for (let i = 0; i < records.length; i++) {
    try {
      await importFunction(records[i])
      if ((i + 1) % 50 === 0) {
        console.log(`  Processed ${i + 1} of ${records.length} records`)
      }
    } catch (error) {
      console.error(`Error processing record ${i + 1}:`, error)
      console.error("Record data:", records[i])
    }
  }
  console.log(`✅ Completed importing ${records.length} records from ${path.basename(filePath)}`)
}

async function createOrGetPerfumeHouse(houseName: string) {
  if (!houseName || houseName.trim() === "") {
    return null
  }

  const trimmedName = houseName.trim()
  
  const existingHouse = await prisma.perfumeHouse.findUnique({
    where: { name: trimmedName },
  })

  if (existingHouse) {
    return existingHouse
  }

  const slug = createUrlSlug(trimmedName)
  
  // Check if slug exists, if so, append a number
  let finalSlug = slug
  let counter = 1
  while (await prisma.perfumeHouse.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${counter}`
    counter++
  }

  return await prisma.perfumeHouse.create({
    data: {
      name: trimmedName,
      slug: finalSlug,
      type: "indie",
    },
  })
}

async function getOrCreateNote(noteName: string) {
  if (!noteName || noteName.trim() === "") {
    return null
  }

  const trimmedNoteName = noteName.trim().toLowerCase()

  // Try to find existing note (case-insensitive)
  let note = await prisma.perfumeNotes.findFirst({
    where: {
      name: {
        equals: trimmedNoteName,
        mode: "insensitive",
      },
    },
  })

  // If note doesn't exist, create it
  if (!note) {
    try {
      note = await prisma.perfumeNotes.create({
        data: {
          name: trimmedNoteName,
        },
      })
    } catch (error: any) {
      // Handle race condition - if note was created by another process, find it
      if (error.code === "P2002") {
        note = await prisma.perfumeNotes.findFirst({
          where: {
            name: {
              equals: trimmedNoteName,
              mode: "insensitive",
            },
          },
        })
      } else {
        throw error
      }
    }
  }

  return note
}

async function createPerfumeNoteRelation(
  perfumeId: string,
  noteId: string,
  noteType: PerfumeNoteType
) {
  // Check if relation already exists
  const existing = await prisma.perfumeNoteRelation.findUnique({
    where: {
      perfumeId_noteId_noteType: {
        perfumeId,
        noteId,
        noteType,
      },
    },
  })

  if (!existing) {
    await prisma.perfumeNoteRelation.create({
      data: {
        perfumeId,
        noteId,
        noteType,
      },
    })
  }
}

async function importPerfumeData(csvFiles: string[]) {
  let created = 0
  let updated = 0
  let skipped = 0
  let duplicatesRenamed = 0

  for (const csvFile of csvFiles) {
    const filePath = path.join(__dirname, "../csv_noir", csvFile)

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${csvFile}`)
      continue
    }

    await importCsv(filePath, async data => {
      // Skip if name is empty
      if (!data.name || data.name.trim() === "") {
        skipped++
        return
      }

      // Clean perfume name - remove trailing periods and spaces
      let perfumeName = data.name.trim().replace(/\.+$/, "").trim()
      
      // Skip if name is empty after cleaning
      if (!perfumeName) {
        skipped++
        return
      }

      // Create or get perfume house
      let perfumeHouse = null
      if (data.perfumeHouse) {
        perfumeHouse = await createOrGetPerfumeHouse(data.perfumeHouse.trim())
      }

      const houseId = perfumeHouse?.id || null

      // Check for existing perfumes with the same name
      const existingPerfumes = await prisma.perfume.findMany({
        where: {
          name: perfumeName,
        },
        include: {
          perfumeNoteRelations: {
            include: {
              note: true,
            },
          },
          perfumeHouse: true,
        },
      })

      let perfume
      
      if (existingPerfumes.length > 0) {
        // Check if any existing perfumes are from the same house
        const sameHousePerfumes = existingPerfumes.filter(p => p.perfumeHouseId === houseId)

        if (sameHousePerfumes.length > 0) {
          // Same house - check for duplicates and keep the one with most data
          // Calculate scores for all existing perfumes
          const scoredPerfumes = sameHousePerfumes.map(p => {
            const score = calculateDataCompleteness({
              description: p.description,
              image: p.image,
              openNotes: JSON.stringify(p.perfumeNoteRelations
                  .filter(r => r.noteType === "open")
                  .map(r => r.note.name)),
              heartNotes: JSON.stringify(p.perfumeNoteRelations
                  .filter(r => r.noteType === "heart")
                  .map(r => r.note.name)),
              baseNotes: JSON.stringify(p.perfumeNoteRelations
                  .filter(r => r.noteType === "base")
                  .map(r => r.note.name)),
            })
            return { perfume: p, score }
          })
          
          // Find the one with the highest score
          const bestExisting = scoredPerfumes.reduce((best, current) => current.score > best.score ? current : best)
          
          const newScore = calculateDataCompleteness(data)
          
          // If we have duplicates, delete the ones with less data
          if (sameHousePerfumes.length > 1) {
            console.log(`Found ${sameHousePerfumes.length} duplicates in same house for "${perfumeName}"`)
            for (const { perfume: p } of scoredPerfumes) {
              if (p.id !== bestExisting.perfume.id) {
                console.log(`  Deleting duplicate perfume with less data: ${p.id}`)
                await prisma.perfume.delete({ where: { id: p.id } })
              }
            }
          }
          
          // Update or keep the best existing one
          if (newScore > bestExisting.score) {
            console.log(`Updating existing perfume "${perfumeName}" from same house (new data has more info)`)
            
            const updateData: any = {}
            if (!bestExisting.perfume.description && data.description) {
              updateData.description = data.description.trim() || null
            }
            if (!bestExisting.perfume.image && data.image) {
              updateData.image = data.image.trim() || null
            }
            
            if (Object.keys(updateData).length > 0) {
              perfume = await prisma.perfume.update({
                where: { id: bestExisting.perfume.id },
                data: updateData,
              })
              updated++
            } else {
              perfume = bestExisting.perfume
            }
          } else {
            // Existing has more data, keep it but still process notes to add any missing ones
            perfume = bestExisting.perfume
            console.log(`  Keeping existing perfume (has more data), but will add any missing notes`)
          }
        } else {
          // Different house - append house name
          const houseName = data.perfumeHouse ? data.perfumeHouse.trim() : "Unknown"
          const newName = `${perfumeName} - ${houseName}`
          
          // Check if the renamed version already exists
          const renamedExists = await prisma.perfume.findFirst({
            where: { name: newName },
          })
          
          if (renamedExists) {
            console.log(`Renamed perfume "${newName}" already exists, skipping...`)
            skipped++
            return
          }
          
          console.log(`Renaming "${perfumeName}" to "${newName}" (different house)`)
          duplicatesRenamed++
          
          const slug = createUrlSlug(newName)
          let finalSlug = slug
          let counter = 1
          while (await prisma.perfume.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${slug}-${counter}`
            counter++
          }
          
          perfume = await prisma.perfume.create({
            data: {
              name: newName,
              description: data.description ? data.description.trim() : null,
              image: data.image ? data.image.trim() : null,
              perfumeHouseId: houseId,
              slug: finalSlug,
            },
          })
          created++
        }
      } else {
        // No existing perfume - create new one
        const slug = createUrlSlug(perfumeName)
        let finalSlug = slug
        let counter = 1
        while (await prisma.perfume.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${counter}`
          counter++
        }
        
        perfume = await prisma.perfume.create({
          data: {
            name: perfumeName,
            description: data.description ? data.description.trim() : null,
            image: data.image ? data.image.trim() : null,
            perfumeHouseId: houseId,
            slug: finalSlug,
          },
        })
        created++
      }

      // Process notes
      const openNotes = parseAndCleanNotes(data.openNotes || "")
      const heartNotes = parseAndCleanNotes(data.heartNotes || "")
      const baseNotes = parseAndCleanNotes(data.baseNotes || "")

      // Create note relations
      for (const noteName of openNotes) {
        const note = await getOrCreateNote(noteName)
        if (note) {
          await createPerfumeNoteRelation(perfume.id, note.id, "open")
        }
      }

      for (const noteName of heartNotes) {
        const note = await getOrCreateNote(noteName)
        if (note) {
          await createPerfumeNoteRelation(perfume.id, note.id, "heart")
        }
      }

      for (const noteName of baseNotes) {
        const note = await getOrCreateNote(noteName)
        if (note) {
          await createPerfumeNoteRelation(perfume.id, note.id, "base")
        }
      }
    })
  }

  console.log("\n📊 Import Summary:")
  console.log(`  Created: ${created}`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Renamed (duplicates from other houses): ${duplicatesRenamed}`)
  console.log(`  Skipped: ${skipped}`)
}

async function main() {
  console.log("🚀 Starting CSV import from csv_noir...")

  // Get CSV file name from command line argument
  const csvFileName = process.argv[2] || "perfumes_strangers-parfumerie.csv"

  const csvFiles = [csvFileName]
  console.log(`Importing CSV file: ${csvFileName}`)

  await importPerfumeData(csvFiles)

  console.log("✅ CSV import completed!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

