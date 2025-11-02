#!/usr/bin/env node
/**
 * Import Lovesick Witchery Perfumes to database
 * - Uses existing notes from database (no duplicates)
 * - Only creates new notes when needed
 * - Updates existing perfumes with missing information (same house, same name)
 * - Ensures no duplicate names within the same house (keeps one with most data)
 * - Appends house name if duplicate found in different house
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
    const parsed = JSON.parse(notesString)
    return Array.isArray(parsed)
      ? parsed.filter(note => note && note.trim())
      : []
  } catch (error) {
    console.log(`  ⚠️  Failed to parse notes: ${notesString}`)
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

async function calculatePerfumeDataScore(perfume) {
  let score = 0
  if (perfume.description && perfume.description.trim()) score += 10
  if (perfume.image && perfume.image.trim()) score += 5
  
  // Count notes
  const openCount = perfume.perfumeNotesOpen?.length || 0
  const heartCount = perfume.perfumeNotesHeart?.length || 0
  const closeCount = perfume.perfumeNotesClose?.length || 0
  score += openCount * 2
  score += heartCount * 2
  score += closeCount * 2
  
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
      type: "indie", // Lovesick Witchery is an indie house
    },
  })
}

async function createOrGetPerfumeNote(noteName) {
  if (!noteName || noteName.trim() === "") {
    return null
  }

  const cleanNoteName = noteName.trim().toLowerCase()

  // Find existing note (case-insensitive)
  const existingNote = await prisma.perfumeNotes.findFirst({
    where: {
      name: {
        equals: cleanNoteName,
        mode: "insensitive",
      },
    },
  })

  if (existingNote) {
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

async function importLovesickWitcheryPerfumesData() {
  const csvFile = "perfumes_lovesickwitchery.csv"
  const filePath = path.join(__dirname, "../csv", csvFile)

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${csvFile}`)
    return
  }

  console.log(`📁 Reading ${csvFile}...`)
  const content = fs.readFileSync(filePath, { encoding: "utf-8" })

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
      
      // Calculate data scores
      const currentDataScore = calculateDataScore(data)
      const existingDataScore = await calculatePerfumeDataScore(duplicateInSameHouse)

      console.log(
        `  📊 Current data score: ${currentDataScore}, Existing score: ${existingDataScore}`
      )

      // Determine which has more data
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

        // Process notes - add missing ones (reuse existing notes)
        const openNotes = parseNotes(data.openNotes || "")
        const heartNotes = parseNotes(data.heartNotes || "")
        const baseNotes = parseNotes(data.baseNotes || "")

        // Get existing note IDs
        const existingOpenNoteIds = duplicateInSameHouse.perfumeNotesOpen.map(
          n => n.id
        )
        const existingHeartNoteIds =
          duplicateInSameHouse.perfumeNotesHeart.map(n => n.id)
        const existingCloseNoteIds =
          duplicateInSameHouse.perfumeNotesClose.map(n => n.id)

        const noteConnections = {
          perfumeNotesOpen: { connect: [] },
          perfumeNotesHeart: { connect: [] },
          perfumeNotesClose: { connect: [] },
        }

        // Process open notes - reuse existing notes, create new ones only if needed
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
        // Existing has equal or more data, but we can still add missing notes/info
        const updateData = {}
        
        // Update description if existing doesn't have one
        if (
          data.description &&
          data.description.trim() &&
          (!duplicateInSameHouse.description ||
            !duplicateInSameHouse.description.trim())
        ) {
          updateData.description = data.description.trim()
        }

        // Update image if existing doesn't have one
        if (
          data.image &&
          data.image.trim() &&
          (!duplicateInSameHouse.image || !duplicateInSameHouse.image.trim())
        ) {
          updateData.image = data.image.trim()
        }

        // Process notes - add missing ones
        const openNotes = parseNotes(data.openNotes || "")
        const heartNotes = parseNotes(data.heartNotes || "")
        const baseNotes = parseNotes(data.baseNotes || "")

        const existingOpenNoteIds = duplicateInSameHouse.perfumeNotesOpen.map(
          n => n.id
        )
        const existingHeartNoteIds =
          duplicateInSameHouse.perfumeNotesHeart.map(n => n.id)
        const existingCloseNoteIds =
          duplicateInSameHouse.perfumeNotesClose.map(n => n.id)

        const noteConnections = {
          perfumeNotesOpen: { connect: [] },
          perfumeNotesHeart: { connect: [] },
          perfumeNotesClose: { connect: [] },
        }

        for (const noteName of openNotes) {
          const note = await createOrGetPerfumeNote(noteName)
          if (note && !existingOpenNoteIds.includes(note.id)) {
            noteConnections.perfumeNotesOpen.connect.push({ id: note.id })
          }
        }

        for (const noteName of heartNotes) {
          const note = await createOrGetPerfumeNote(noteName)
          if (note && !existingHeartNoteIds.includes(note.id)) {
            noteConnections.perfumeNotesHeart.connect.push({ id: note.id })
          }
        }

        for (const noteName of baseNotes) {
          const note = await createOrGetPerfumeNote(noteName)
          if (note && !existingCloseNoteIds.includes(note.id)) {
            noteConnections.perfumeNotesClose.connect.push({ id: note.id })
          }
        }

        // Update if there are changes
        if (
          Object.keys(updateData).length > 0 ||
          noteConnections.perfumeNotesOpen.connect.length > 0 ||
          noteConnections.perfumeNotesHeart.connect.length > 0 ||
          noteConnections.perfumeNotesClose.connect.length > 0
        ) {
          const allUpdates = { ...updateData, ...noteConnections }
          await prisma.perfume.update({
            where: { id: duplicateInSameHouse.id },
            data: allUpdates,
          })
          console.log(`  ✅ Updated existing perfume with missing information`)
          updated++
        } else {
          console.log(`  ⚠️  Existing perfume has all data, skipping`)
          skipped++
        }
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

    // Process notes - reuse existing notes, create new ones only if needed
    const openNotes = parseNotes(data.openNotes || "")
    const heartNotes = parseNotes(data.heartNotes || "")
    const baseNotes = parseNotes(data.baseNotes || "")

    const noteConnections = {
      perfumeNotesOpen: { connect: [] },
      perfumeNotesHeart: { connect: [] },
      perfumeNotesClose: { connect: [] },
    }

    // Process open notes - reuse existing notes
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
importLovesickWitcheryPerfumesData()
  .then(async () => {
    await prisma.$disconnect()
    console.log("✅ Import completed successfully!")
  })
  .catch(async e => {
    console.error("❌ Error during import:", e)
    await prisma.$disconnect()
    process.exit(1)
  })

