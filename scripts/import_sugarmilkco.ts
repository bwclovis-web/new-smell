import { PrismaClient } from "@prisma/client"
import { parse } from "csv-parse/sync"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const prisma = new PrismaClient()

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function createUrlSlug(name: string): string {
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

function parseNotes(notesString: string): string[] {
  if (!notesString || notesString.trim() === "" || notesString === "[]") {
    return []
  }

  try {
    // Try to parse as JSON array first
    const parsed = JSON.parse(notesString)
    if (Array.isArray(parsed)) {
      // Handle array of strings or array of arrays
      return parsed.flatMap(item => {
        if (typeof item === "string") {
          return item.trim()
        }
        if (Array.isArray(item)) {
          return item.filter(n => typeof n === "string").map(n => n.trim())
        }
        return []
      }).filter(note => note.length > 0)
    }
    return []
  } catch {
    // If JSON parsing fails, try to split by comma
    return notesString
      .split(",")
      .map(note => note.trim())
      .filter(note => note.length > 0)
  }
}

function countDataFields(perfume: any): number {
  let count = 0
  if (perfume.description && perfume.description.trim() !== "") count++
  if (perfume.image && perfume.image.trim() !== "") count++
  if (perfume.perfumeHouseId) count++
  
  // Count notes
  const openNotes = perfume.perfumeNotesOpen?.length || 0
  const heartNotes = perfume.perfumeNotesHeart?.length || 0
  const baseNotes = perfume.perfumeNotesClose?.length || 0
  
  return count + openNotes + heartNotes + baseNotes
}

async function createOrGetPerfumeHouse(houseName: string) {
  if (!houseName || houseName.trim() === "") {
    return null
  }

  const existingHouse = await prisma.perfumeHouse.findUnique({
    where: { name: houseName.trim() },
  })

  if (existingHouse) {
    return existingHouse
  }

  return await prisma.perfumeHouse.create({
    data: {
      name: houseName.trim(),
      slug: createUrlSlug(houseName.trim()),
      type: "indie",
    },
  })
}

async function getOrCreateNote(
  noteName: string,
  perfumeId: string,
  noteType: "open" | "heart" | "base"
): Promise<string | null> {
  if (!noteName || noteName.trim() === "") {
    return null
  }

  const trimmedNoteName = noteName.trim().toLowerCase()

  // Check if note already exists
  const existingNote = await prisma.perfumeNotes.findUnique({
    where: { name: trimmedNoteName },
  })

  // If note exists and is not linked to a different perfume, reuse it
  // Otherwise, since name is unique, we need to update the existing note's link
  // This means moving it from the old perfume to the new one
  if (existingNote) {
    // Check current link
    let isLinkedToDifferentPerfume = false
    switch (noteType) {
      case "open":
        isLinkedToDifferentPerfume = existingNote.perfumeOpenId !== null && existingNote.perfumeOpenId !== perfumeId
        break
      case "heart":
        isLinkedToDifferentPerfume = existingNote.perfumeHeartId !== null && existingNote.perfumeHeartId !== perfumeId
        break
      case "base":
        isLinkedToDifferentPerfume = existingNote.perfumeCloseId !== null && existingNote.perfumeCloseId !== perfumeId
        break
    }

    // If not linked or linked to same perfume, we can use it
    if (!isLinkedToDifferentPerfume) {
      // Update the note to link to this perfume if not already linked
      const updateData: any = {}
      switch (noteType) {
        case "open":
          if (!existingNote.perfumeOpenId) {
            updateData.perfumeOpenId = perfumeId
          }
          break
        case "heart":
          if (!existingNote.perfumeHeartId) {
            updateData.perfumeHeartId = perfumeId
          }
          break
        case "base":
          if (!existingNote.perfumeCloseId) {
            updateData.perfumeCloseId = perfumeId
          }
          break
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.perfumeNotes.update({
          where: { id: existingNote.id },
          data: updateData,
        })
      }

      return existingNote.id
    }
    // If linked to different perfume, we can't reuse it - name is unique
    // Return null and let the caller handle it (for now we'll skip)
    return null
  }

  // Create new note with initial perfume link
  const noteData: any = {
    name: trimmedNoteName,
  }

  switch (noteType) {
    case "open":
      noteData.perfumeOpenId = perfumeId
      break
    case "heart":
      noteData.perfumeHeartId = perfumeId
      break
    case "base":
      noteData.perfumeCloseId = perfumeId
      break
  }

  const newNote = await prisma.perfumeNotes.create({
    data: noteData,
  })

  return newNote.id
}

async function importSugarmilkco() {
  const csvFile = path.join(__dirname, "../csv/perfumes_sugarmilkco.csv")

  if (!fs.existsSync(csvFile)) {
    console.log(`⚠️  File not found: ${csvFile}`)
    return
  }

  const content = fs.readFileSync(csvFile, { encoding: "utf-8" })
  const records = parse(content, { columns: true, skip_empty_lines: true })

  console.log(`📦 Importing ${records.length} perfumes from sugarmilkco.csv`)

  let created = 0
  let updated = 0
  let skipped = 0
  let renamed = 0

  for (let i = 0; i < records.length; i++) {
    const data = records[i]
    
    try {
      // Skip if name is empty
      if (!data.name || data.name.trim() === "") {
        skipped++
        continue
      }

      const perfumeName = data.name.trim()
      
      // Create or get perfume house
      let perfumeHouse = null
      if (data.perfumeHouse) {
        perfumeHouse = await createOrGetPerfumeHouse(data.perfumeHouse)
      }

      // Check for existing perfume with same name and house
      const existingPerfumeSameHouse = await prisma.perfume.findFirst({
        where: {
          name: perfumeName,
          perfumeHouseId: perfumeHouse?.id || null,
        },
        include: {
          perfumeNotesOpen: true,
          perfumeNotesHeart: true,
          perfumeNotesClose: true,
        },
      })

      if (existingPerfumeSameHouse) {
        // Same name and house - update with missing info if new data has more
        const existingDataCount = countDataFields(existingPerfumeSameHouse)
        const newDataCount = countDataFields({
          description: data.description,
          image: data.image,
          perfumeHouseId: perfumeHouse?.id,
          perfumeNotesOpen: data.openNotes ? parseNotes(data.openNotes) : [],
          perfumeNotesHeart: data.heartNotes ? parseNotes(data.heartNotes) : [],
          perfumeNotesClose: data.baseNotes ? parseNotes(data.baseNotes) : [],
        })

        // Only update if new data has more fields
        if (newDataCount > existingDataCount) {
          // Update perfume with new data
          const updateData: any = {}
          
          if (data.description && (!existingPerfumeSameHouse.description || existingPerfumeSameHouse.description.trim() === "")) {
            updateData.description = data.description
          }
          
          if (data.image && (!existingPerfumeSameHouse.image || existingPerfumeSameHouse.image.trim() === "")) {
            updateData.image = data.image
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.perfume.update({
              where: { id: existingPerfumeSameHouse.id },
              data: updateData,
            })
          }

          // Update notes
          const openNotes = parseNotes(data.openNotes || "")
          const heartNotes = parseNotes(data.heartNotes || "")
          const baseNotes = parseNotes(data.baseNotes || "")

          // Get existing note IDs
          const existingOpenIds = existingPerfumeSameHouse.perfumeNotesOpen.map(n => n.id)
          const existingHeartIds = existingPerfumeSameHouse.perfumeNotesHeart.map(n => n.id)
          const existingBaseIds = existingPerfumeSameHouse.perfumeNotesClose.map(n => n.id)

          // Get or create new note IDs (reuse existing notes when possible)
          const newOpenIds = (await Promise.all(
            openNotes.map(n => getOrCreateNote(n, existingPerfumeSameHouse.id, "open"))
          )).filter(id => id !== null) as string[]
          const newHeartIds = (await Promise.all(
            heartNotes.map(n => getOrCreateNote(n, existingPerfumeSameHouse.id, "heart"))
          )).filter(id => id !== null) as string[]
          const newBaseIds = (await Promise.all(
            baseNotes.map(n => getOrCreateNote(n, existingPerfumeSameHouse.id, "base"))
          )).filter(id => id !== null) as string[]

          // Combine existing and new, remove duplicates
          const allOpenIds = [...new Set([...existingOpenIds, ...newOpenIds])]
          const allHeartIds = [...new Set([...existingHeartIds, ...newHeartIds])]
          const allBaseIds = [...new Set([...existingBaseIds, ...newBaseIds])]

          // Update note relationships
          await prisma.perfume.update({
            where: { id: existingPerfumeSameHouse.id },
            data: {
              perfumeNotesOpen: {
                set: allOpenIds.map(id => ({ id })),
              },
              perfumeNotesHeart: {
                set: allHeartIds.map(id => ({ id })),
              },
              perfumeNotesClose: {
                set: allBaseIds.map(id => ({ id })),
              },
            },
          })

          updated++
          console.log(`  ✓ Updated: ${perfumeName}`)
        } else {
          skipped++
          console.log(`  ⊘ Skipped: ${perfumeName} (existing has more data)`)
        }
        continue
      }

      // Check for existing perfume with same name but different house (or no house)
      const existingPerfumeDifferentHouse = await prisma.perfume.findFirst({
        where: {
          name: perfumeName,
          NOT: {
            perfumeHouseId: perfumeHouse?.id || null,
          },
        },
      })

      let finalPerfumeName = perfumeName
      if (existingPerfumeDifferentHouse) {
        // Different house - append house name
        const houseName = perfumeHouse?.name || "Unknown"
        finalPerfumeName = `${perfumeName} - ${houseName}`
        renamed++
        console.log(`  ↻ Renamed: "${perfumeName}" → "${finalPerfumeName}"`)
      }

      // Check if the final name (possibly renamed) already exists
      const finalNameExists = await prisma.perfume.findFirst({
        where: { name: finalPerfumeName },
      })

      if (finalNameExists) {
        skipped++
        console.log(`  ⊘ Skipped: ${finalPerfumeName} (already exists)`)
        continue
      }

      // Create new perfume
      const slug = createUrlSlug(finalPerfumeName)
      let uniqueSlug = slug
      let slugCounter = 1

      // Ensure slug is unique
      while (await prisma.perfume.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${slugCounter}`
        slugCounter++
      }

      const perfume = await prisma.perfume.create({
        data: {
          name: finalPerfumeName,
          slug: uniqueSlug,
          description: data.description || null,
          image: data.image || null,
          perfumeHouseId: perfumeHouse?.id || null,
        },
      })

      // Process notes
      const openNotes = parseNotes(data.openNotes || "")
      const heartNotes = parseNotes(data.heartNotes || "")
      const baseNotes = parseNotes(data.baseNotes || "")

      // Get or create note IDs (reuse existing notes when possible)
      const openNoteIds = (await Promise.all(
        openNotes.map(n => getOrCreateNote(n, perfume.id, "open"))
      )).filter(id => id !== null) as string[]
      const heartNoteIds = (await Promise.all(
        heartNotes.map(n => getOrCreateNote(n, perfume.id, "heart"))
      )).filter(id => id !== null) as string[]
      const baseNoteIds = (await Promise.all(
        baseNotes.map(n => getOrCreateNote(n, perfume.id, "base"))
      )).filter(id => id !== null) as string[]

      // Connect notes to perfume
      // getOrCreateNote already handles the linking via foreign keys
      // But we also need to connect via the relation arrays
      if (openNoteIds.length > 0 || heartNoteIds.length > 0 || baseNoteIds.length > 0) {
        await prisma.perfume.update({
          where: { id: perfume.id },
          data: {
            perfumeNotesOpen: {
              connect: openNoteIds.map(id => ({ id })),
            },
            perfumeNotesHeart: {
              connect: heartNoteIds.map(id => ({ id })),
            },
            perfumeNotesClose: {
              connect: baseNoteIds.map(id => ({ id })),
            },
          },
        })
      }

      created++
      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${records.length}`)
      }
    } catch (error) {
      console.error(`  ✗ Error processing "${data.name}":`, error)
    }
  }

  console.log("\n✅ Import completed!")
  console.log(`  Created: ${created}`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Renamed: ${renamed}`)
  console.log(`  Skipped: ${skipped}`)
}

async function main() {
  console.log("🚀 Starting Sugar Milk Co. import...\n")
  await importSugarmilkco()
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

