#!/usr/bin/env node
/**
 * Import Maison des Animaux Fragrances (MDA Frags) Perfumes to database
 * Handles duplicates by appending house name
 * Reuses existing notes when possible
 * Only creates new notes when needed
 * Updates existing perfumes in same house with missing information
 */

import { PrismaClient, PerfumeNoteType } from "@prisma/client"
import { parse } from "csv-parse/sync"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const prisma = new PrismaClient()

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseNotes(notesString: string): string[] {
  if (!notesString || notesString.trim() === "" || notesString === "[]") {
    return []
  }

  try {
    // Try to parse as JSON array first
    const parsed = JSON.parse(notesString)
    return Array.isArray(parsed) ? parsed.filter(note => note && note.trim()) : []
  } catch (error) {
    console.log(`  ⚠️  Failed to parse notes: ${notesString}`)
    // If JSON parsing fails, try to split by comma
    return notesString
      .split(",")
      .map(note => note.trim())
      .filter(note => note.length > 0)
  }
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-+|-+$/g, "")
}

function calculateDataScore(data: {
  description?: string | null
  image?: string | null
  openNotes?: string
  heartNotes?: string
  baseNotes?: string
}): number {
  let score = 0
  if (data.description && data.description.trim() && data.description !== "not available at this time") {
    score += 10
  }
  if (data.image && data.image.trim()) {
    score += 10
  }
  const openNotes = parseNotes(data.openNotes || "")
  const heartNotes = parseNotes(data.heartNotes || "")
  const baseNotes = parseNotes(data.baseNotes || "")
  score += openNotes.length * 2
  score += heartNotes.length * 2
  score += baseNotes.length * 2
  return score
}

async function createOrGetPerfumeHouse(houseName: string) {
  if (!houseName || houseName.trim() === "") {
    return null
  }

  const trimmedName = houseName.trim()
  
  const existingHouse = await prisma.perfumeHouse.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: "insensitive",
      },
    },
  })

  if (existingHouse) {
    return existingHouse
  }

  const slug = createSlug(trimmedName)
  
  // Check if slug exists, if so, append a number
  let finalSlug = slug
  let counter = 1
  while (await prisma.perfumeHouse.findFirst({ where: { slug: finalSlug } })) {
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
    note = await prisma.perfumeNotes.create({
      data: {
        name: trimmedNoteName,
      },
    })
    console.log(`  ✨ Created new note: ${trimmedNoteName}`)
  } else {
    console.log(`  ♻️  Reusing existing note: ${trimmedNoteName}`)
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

  if (existing) {
    return existing
  }

  return await prisma.perfumeNoteRelation.create({
    data: {
      perfumeId,
      noteId,
      noteType,
    },
  })
}

async function checkForDuplicateInSameHouse(perfumeName: string, houseId: string) {
  return await prisma.perfume.findFirst({
    where: {
      name: perfumeName,
      perfumeHouseId: houseId,
    },
    include: {
      perfumeNoteRelations: {
        include: {
          note: true,
        },
      },
    },
  })
}

async function checkForDuplicateInOtherHouses(perfumeName: string, houseId: string) {
  return await prisma.perfume.findFirst({
    where: {
      name: perfumeName,
      perfumeHouseId: {
        not: houseId,
      },
    },
    include: {
      perfumeHouse: true,
    },
  })
}

async function importMdafragsPerfumesData() {
  const csvFile = "perfumes_mdafrags.csv"
  const filePath = path.join(__dirname, "../csv", csvFile)

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${csvFile}`)
    return
  }

  console.log(`📁 Reading ${csvFile}...`)
  const content = fs.readFileSync(filePath, { encoding: "utf-8" })

  // Use csv-parse library for proper CSV parsing
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    escape: '"',
    quote: '"',
  })

  console.log(`📊 Found ${records.length} records to import`)

  // Create or get Maison des Animaux Fragrances house
  const perfumeHouse = await createOrGetPerfumeHouse("Maison des Animaux Fragrances")
  console.log(`🏠 Perfume house: ${perfumeHouse.name} (${perfumeHouse.id})`)

  let imported = 0
  let skipped = 0
  let duplicates = 0
  let updated = 0

  for (let i = 0; i < records.length; i++) {
    const data = records[i]

    try {
      // Skip if name is empty
      if (!data.name || data.name.trim() === "") {
        console.log(`⚠️  Skipping record ${i + 1}: No name`)
        skipped++
        continue
      }

      const originalName = data.name.trim()
      let finalName = originalName
      let slug = createSlug(originalName)

      console.log(`\n🔍 Processing: ${originalName}`)

      // Check for duplicate in same house
      const duplicateInSameHouse = await checkForDuplicateInSameHouse(
        originalName,
        perfumeHouse.id
      )

      if (duplicateInSameHouse) {
        // Check which has more data
        const currentDataScore = calculateDataScore({
          description: data.description,
          image: data.image,
          openNotes: data.openNotes,
          heartNotes: data.heartNotes,
          baseNotes: data.baseNotes,
        })

        const existingDataScore = calculateDataScore({
          description: duplicateInSameHouse.description,
          image: duplicateInSameHouse.image,
          openNotes: JSON.stringify(
            duplicateInSameHouse.perfumeNoteRelations
              .filter(r => r.noteType === "open")
              .map(r => r.note.name)
          ),
          heartNotes: JSON.stringify(
            duplicateInSameHouse.perfumeNoteRelations
              .filter(r => r.noteType === "heart")
              .map(r => r.note.name)
          ),
          baseNotes: JSON.stringify(
            duplicateInSameHouse.perfumeNoteRelations
              .filter(r => r.noteType === "base")
              .map(r => r.note.name)
          ),
        })

        if (currentDataScore > existingDataScore) {
          // Update existing perfume with better data
          const updateData: any = {}
          if (!duplicateInSameHouse.description && data.description && data.description !== "not available at this time") {
            updateData.description = data.description.trim()
          }
          if (!duplicateInSameHouse.image && data.image) {
            updateData.image = data.image.trim()
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.perfume.update({
              where: { id: duplicateInSameHouse.id },
              data: updateData,
            })
            console.log(`🔄 Updated existing perfume with better data: ${originalName}`)
          }

          // Process and add notes
          const openNotes = parseNotes(data.openNotes || "")
          const heartNotes = parseNotes(data.heartNotes || "")
          const baseNotes = parseNotes(data.baseNotes || "")

          // Get existing note IDs for this perfume
          const existingNoteIds = new Set(
            duplicateInSameHouse.perfumeNoteRelations.map(r => r.noteId)
          )

          // Process open notes
          for (const noteName of openNotes) {
            const note = await getOrCreateNote(noteName)
            if (note && !existingNoteIds.has(note.id)) {
              await createPerfumeNoteRelation(duplicateInSameHouse.id, note.id, "open")
            }
          }

          // Process heart notes
          for (const noteName of heartNotes) {
            const note = await getOrCreateNote(noteName)
            if (note && !existingNoteIds.has(note.id)) {
              await createPerfumeNoteRelation(duplicateInSameHouse.id, note.id, "heart")
            }
          }

          // Process base notes
          for (const noteName of baseNotes) {
            const note = await getOrCreateNote(noteName)
            if (note && !existingNoteIds.has(note.id)) {
              await createPerfumeNoteRelation(duplicateInSameHouse.id, note.id, "base")
            }
          }

          updated++
        } else {
          console.log(`⚠️  Perfume "${originalName}" already exists in same house with equal or better data, skipping...`)
          skipped++
        }
        continue
      }

      // Check for duplicate in other houses
      const duplicateInOtherHouse = await checkForDuplicateInOtherHouses(
        originalName,
        perfumeHouse.id
      )

      if (duplicateInOtherHouse) {
        finalName = `${originalName} - ${perfumeHouse.name}`
        slug = createSlug(finalName)

        // Check if the modified name also exists
        const modifiedExists = await prisma.perfume.findFirst({
          where: { name: finalName },
        })

        if (modifiedExists) {
          console.log(`⚠️  Perfume "${originalName}" already exists with house suffix, skipping...`)
          skipped++
          continue
        }

        console.log(`🔄 Duplicate found in other house (${duplicateInOtherHouse.perfumeHouse?.name}): "${originalName}" -> "${finalName}"`)
        duplicates++
      }

      // Create the perfume
      const perfume = await prisma.perfume.create({
        data: {
          name: finalName,
          slug: slug,
          description: data.description && data.description !== "not available at this time" ? data.description.trim() : null,
          image: data.image ? data.image.trim() : null,
          perfumeHouseId: perfumeHouse.id,
        },
      })

      console.log(`✅ Created: ${finalName}`)

      // Process notes
      const openNotes = parseNotes(data.openNotes || "")
      const heartNotes = parseNotes(data.heartNotes || "")
      const baseNotes = parseNotes(data.baseNotes || "")

      // Process open notes
      for (const noteName of openNotes) {
        const note = await getOrCreateNote(noteName)
        if (note) {
          await createPerfumeNoteRelation(perfume.id, note.id, "open")
        }
      }

      // Process heart notes
      for (const noteName of heartNotes) {
        const note = await getOrCreateNote(noteName)
        if (note) {
          await createPerfumeNoteRelation(perfume.id, note.id, "heart")
        }
      }

      // Process base notes
      for (const noteName of baseNotes) {
        const note = await getOrCreateNote(noteName)
        if (note) {
          await createPerfumeNoteRelation(perfume.id, note.id, "base")
        }
      }

      imported++
    } catch (error) {
      console.error(`❌ Error processing record ${i + 1}:`, error)
      console.error("Record data:", data)
      skipped++
    }
  }

  console.log("\n📈 Import Summary:")
  console.log(`✅ Imported: ${imported}`)
  console.log(`🔄 Updated existing: ${updated}`)
  console.log(`🔄 Duplicates handled: ${duplicates}`)
  console.log(`⚠️  Skipped: ${skipped}`)
  console.log(`📊 Total processed: ${records.length}`)
}

async function main() {
  console.log("🚀 Starting Maison des Animaux Fragrances import...")

  try {
    await importMdafragsPerfumesData()
    console.log("✅ Maison des Animaux Fragrances import completed!")
  } catch (error) {
    console.error("❌ Import failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()


