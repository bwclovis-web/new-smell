#!/usr/bin/env node
/**
 * Import Zoologist Perfumes to database
 * Handles duplicates by appending house name
 * Reuses existing notes when possible
 * Only creates new notes when needed
 * Updates existing perfumes with missing information
 * Ensures no duplicate names within the same house
 */

import { PrismaClient } from "@prisma/client"
import { parse } from "csv-parse/sync"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const prisma = new PrismaClient()

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseNotes(notesString) {
  if (!notesString || notesString.trim() === "" || notesString === "[]") {
    return []
  }

  try {
    // The CSV library returns the value as-is, so we just need to parse JSON
    const parsed = JSON.parse(notesString)
    return Array.isArray(parsed)
      ? parsed.filter(note => note && note.trim())
      : []
  } catch (error) {
    console.log(`  ⚠️  Failed to parse notes: ${notesString}`)
    // If JSON parsing fails, try to split by comma
    return notesString
      .split(",")
      .map(note => note.trim().replace(/^"|"$/g, ""))
      .filter(note => note.length > 0)
  }
}

function createUrlSlug(name) {
  if (!name || typeof name !== "string") {
    return ""
  }

  return (
    name
      // First decode any URL-encoded characters
      .replace(/%20/g, " ")
      // Normalize Unicode characters (NFD = Canonical Decomposition)
      .normalize("NFD")
      // Remove diacritics/accents
      .replace(/[\u0300-\u036f]/g, "")
      // Replace common Unicode punctuation with ASCII equivalents
      .replace(/[\u2013\u2014]/g, "-") // en dash, em dash → hyphen
      .replace(/[\u2018\u2019]/g, "'") // smart single quotes
      .replace(/[\u201C\u201D]/g, '"') // smart double quotes
      .replace(/[\u2026]/g, "...") // ellipsis
      // Remove any remaining non-ASCII characters
      .replace(/[^\x00-\x7F]/g, "")
      // Replace spaces with hyphens
      .replace(/\s+/g, "-")
      // Replace underscores with hyphens
      .replace(/_/g, "-")
      // Remove any non-alphanumeric characters except hyphens
      .replace(/[^a-zA-Z0-9-]/g, "")
      // Remove multiple consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Convert to lowercase
      .toLowerCase()
  )
}

function calculateDataScore(data) {
  let score = 0
  if (data.description && data.description.trim()) score += 10
  if (data.image && data.image.trim()) score += 5
  const openNotes = parseNotes(data.openNotes || "")
  const heartNotes = parseNotes(data.heartNotes || "")
  const baseNotes = parseNotes(data.baseNotes || "")
  score += openNotes.length * 2
  score += heartNotes.length * 2
  score += baseNotes.length * 2
  return score
}

function calculatePerfumeDataScore(perfume) {
  let score = 0
  if (perfume.description && perfume.description.trim()) score += 10
  if (perfume.image && perfume.image.trim()) score += 5
  
  // Count notes (we need to fetch them to count)
  // For now, assume 0 if we can't count them easily
  return score
}

async function createOrGetPerfumeHouse(houseName) {
  if (!houseName || houseName.trim() === "") {
    return null
  }

  const existingHouse = await prisma.perfumeHouse.findFirst({
    where: {
      name: {
        equals: houseName.trim(),
        mode: "insensitive",
      },
    },
  })

  if (existingHouse) {
    return existingHouse
  }

  return await prisma.perfumeHouse.create({
    data: {
      name: houseName.trim(),
      slug: createUrlSlug(houseName.trim()),
      type: "niche", // Zoologist is a niche house
    },
  })
}

async function createOrGetPerfumeNote(noteName) {
  if (!noteName || noteName.trim() === "") {
    return null
  }

  const cleanNoteName = noteName.trim().toLowerCase()

  // First, try to find existing note with the same name (case-insensitive)
  const existingNote = await prisma.perfumeNotes.findFirst({
    where: {
      name: {
        equals: cleanNoteName,
        mode: "insensitive",
      },
    },
  })

  if (existingNote) {
    // Return existing note - it will be reused
    return existingNote
  }

  // Create new note only if it doesn't exist
  return await prisma.perfumeNotes.create({
    data: {
      name: cleanNoteName,
    },
  })
}

async function checkForDuplicateInSameHouse(perfumeName, houseId) {
  return await prisma.perfume.findFirst({
    where: {
      name: perfumeName,
      perfumeHouseId: houseId,
    },
    include: {
      perfumeNotesOpen: true,
      perfumeNotesHeart: true,
      perfumeNotesClose: true,
    },
  })
}

async function checkForDuplicateInOtherHouses(perfumeName, houseId) {
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

async function importZoologistPerfumesData() {
  const csvFile = "perfumes_zoologist.csv"
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
  })

  console.log(`📊 Found ${records.length} records to process\n`)

  let created = 0
  let updated = 0
  let skipped = 0
  let duplicates = 0

  for (let i = 0; i < records.length; i++) {
    const data = records[i]

    // Skip if name is empty
    if (!data.name || data.name.trim() === "") {
      console.log(`⚠️  Skipping record ${i + 1}: empty name`)
      skipped++
      continue
    }

    const originalName = data.name.trim()
    console.log(`\n${i + 1}/${records.length}: Processing "${originalName}"`)

    // Create or get perfume house
    let perfumeHouse = null
    if (data.perfumeHouse) {
      perfumeHouse = await createOrGetPerfumeHouse(data.perfumeHouse.trim())
      console.log(`  🏠 House: ${perfumeHouse.name}`)
    }

    if (!perfumeHouse) {
      console.log(`  ⚠️  No house specified, skipping...`)
      skipped++
      continue
    }

    // Check for duplicate in the same house
    const duplicateInSameHouse = await checkForDuplicateInSameHouse(
      originalName,
      perfumeHouse.id
    )

    if (duplicateInSameHouse) {
      console.log(`  🔄 Found existing perfume in same house`)
      
      // Calculate data scores to determine which has more data
      const currentDataScore = calculateDataScore(data)
      const existingDataScore =
        calculatePerfumeDataScore(duplicateInSameHouse) +
        duplicateInSameHouse.perfumeNotesOpen.length * 2 +
        duplicateInSameHouse.perfumeNotesHeart.length * 2 +
        duplicateInSameHouse.perfumeNotesClose.length * 2

      console.log(
        `  📊 Current data score: ${currentDataScore}, Existing score: ${existingDataScore}`
      )

      if (currentDataScore > existingDataScore) {
        // Update existing perfume with better data
        const updateData = {}
        
        // Update description if current is better or existing is missing
        if (
          (data.description && data.description.trim()) &&
          (!duplicateInSameHouse.description ||
            !duplicateInSameHouse.description.trim())
        ) {
          updateData.description = data.description.trim()
        } else if (
          data.description &&
          data.description.trim() &&
          data.description.trim().length >
            (duplicateInSameHouse.description?.length || 0)
        ) {
          updateData.description = data.description.trim()
        }

        // Update image if current has one and existing doesn't
        if (
          data.image &&
          data.image.trim() &&
          (!duplicateInSameHouse.image || !duplicateInSameHouse.image.trim())
        ) {
          updateData.image = data.image.trim()
        }

        // Update slug if name changed
        if (Object.keys(updateData).length > 0) {
          await prisma.perfume.update({
            where: { id: duplicateInSameHouse.id },
            data: updateData,
          })
        }

        // Process notes - add missing ones
        const openNotes = parseNotes(data.openNotes || "")
        const heartNotes = parseNotes(data.heartNotes || "")
        const baseNotes = parseNotes(data.baseNotes || "")

        const noteConnections = {
          perfumeNotesOpen: { connect: [] },
          perfumeNotesHeart: { connect: [] },
          perfumeNotesClose: { connect: [] },
        }

        // Get existing note IDs
        const existingOpenNoteIds = duplicateInSameHouse.perfumeNotesOpen.map(
          n => n.id
        )
        const existingHeartNoteIds =
          duplicateInSameHouse.perfumeNotesHeart.map(n => n.id)
        const existingCloseNoteIds =
          duplicateInSameHouse.perfumeNotesClose.map(n => n.id)

        // Process open notes
        for (const noteName of openNotes) {
          const note = await createOrGetPerfumeNote(noteName)
          if (note && !existingOpenNoteIds.includes(note.id)) {
            noteConnections.perfumeNotesOpen.connect.push({ id: note.id })
          }
        }

        // Process heart notes
        for (const noteName of heartNotes) {
          const note = await createOrGetPerfumeNote(noteName)
          if (note && !existingHeartNoteIds.includes(note.id)) {
            noteConnections.perfumeNotesHeart.connect.push({ id: note.id })
          }
        }

        // Process base notes
        for (const noteName of baseNotes) {
          const note = await createOrGetPerfumeNote(noteName)
          if (note && !existingCloseNoteIds.includes(note.id)) {
            noteConnections.perfumeNotesClose.connect.push({ id: note.id })
          }
        }

        // Update perfume with note connections only if there are new notes
        if (
          noteConnections.perfumeNotesOpen.connect.length > 0 ||
          noteConnections.perfumeNotesHeart.connect.length > 0 ||
          noteConnections.perfumeNotesClose.connect.length > 0
        ) {
          await prisma.perfume.update({
            where: { id: duplicateInSameHouse.id },
            data: noteConnections,
          })
        }

        console.log(`  ✅ Updated existing perfume with better data`)
        updated++
      } else {
        console.log(
          `  ⚠️  Existing perfume has equal or better data, skipping update`
        )
        skipped++
      }
      continue
    }

    // Check for duplicate in other houses
    let finalName = originalName
    let slug = createUrlSlug(finalName)
    const duplicateInOtherHouse = await checkForDuplicateInOtherHouses(
      originalName,
      perfumeHouse.id
    )

    if (duplicateInOtherHouse) {
      finalName = `${originalName} - ${perfumeHouse.name}`
      slug = createUrlSlug(finalName)

      // Check if the modified name also exists
      const modifiedExists = await prisma.perfume.findFirst({
        where: { name: finalName },
      })

      if (modifiedExists) {
        console.log(
          `  ⚠️  Perfume "${originalName}" already exists with house suffix, skipping...`
        )
        skipped++
        continue
      }

      console.log(
        `  🔄 Duplicate found in other house (${duplicateInOtherHouse.perfumeHouse?.name}): "${originalName}" -> "${finalName}"`
      )
      duplicates++
    }

    // Create the perfume
    const perfume = await prisma.perfume.create({
      data: {
        name: finalName,
        slug: slug,
        description: data.description ? data.description.trim() : null,
        image: data.image ? data.image.trim() : null,
        perfumeHouseId: perfumeHouse.id,
      },
    })

    // Process notes
    const openNotes = parseNotes(data.openNotes || "")
    const heartNotes = parseNotes(data.heartNotes || "")
    const baseNotes = parseNotes(data.baseNotes || "")

    const noteConnections = {
      perfumeNotesOpen: { connect: [] },
      perfumeNotesHeart: { connect: [] },
      perfumeNotesClose: { connect: [] },
    }

    // Process open notes
    for (const noteName of openNotes) {
      const note = await createOrGetPerfumeNote(noteName)
      if (note) {
        noteConnections.perfumeNotesOpen.connect.push({ id: note.id })
      }
    }

    // Process heart notes
    for (const noteName of heartNotes) {
      const note = await createOrGetPerfumeNote(noteName)
      if (note) {
        noteConnections.perfumeNotesHeart.connect.push({ id: note.id })
      }
    }

    // Process base notes
    for (const noteName of baseNotes) {
      const note = await createOrGetPerfumeNote(noteName)
      if (note) {
        noteConnections.perfumeNotesClose.connect.push({ id: note.id })
      }
    }

    // Update perfume with note connections
    if (
      noteConnections.perfumeNotesOpen.connect.length > 0 ||
      noteConnections.perfumeNotesHeart.connect.length > 0 ||
      noteConnections.perfumeNotesClose.connect.length > 0
    ) {
      await prisma.perfume.update({
        where: { id: perfume.id },
        data: noteConnections,
      })
    }

    console.log(`  ✅ Created perfume: ${finalName}`)
    created++
  }

  console.log(`\n\n📊 Import Summary:`)
  console.log(`  ✅ Created: ${created}`)
  console.log(`  🔄 Updated: ${updated}`)
  console.log(`  🔄 Duplicates (renamed): ${duplicates}`)
  console.log(`  ⚠️  Skipped: ${skipped}`)
  console.log(`  📦 Total processed: ${records.length}\n`)
}

// Run the import
importZoologistPerfumesData()
  .then(async () => {
    await prisma.$disconnect()
    console.log("✅ Import completed successfully!")
  })
  .catch(async e => {
    console.error("❌ Error during import:", e)
    await prisma.$disconnect()
    process.exit(1)
  })



