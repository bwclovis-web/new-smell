// Import script for Paintbox Soapworks perfumes
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
  const openNotes = parseNotes(data.openNotes || "")
  const heartNotes = parseNotes(data.heartNotes || "")
  const baseNotes = parseNotes(data.baseNotes || "")
  score += openNotes.length * 2
  score += heartNotes.length * 2
  score += baseNotes.length * 2
  return score
}

function parseNotes(notesString: string): string[] {
  if (!notesString || notesString.trim() === "" || notesString === "[]") {
    return []
  }

  try {
    // Try to parse as JSON array first
    const parsed = JSON.parse(notesString)
    return Array.isArray(parsed) ? parsed.map((n: any) => String(n).trim().toLowerCase()).filter((n: string) => n.length > 0) : []
  } catch {
    // If JSON parsing fails, try to split by comma
    return notesString
      .split(",")
      .map(note => note.trim().toLowerCase())
      .filter(note => note.length > 0)
  }
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

  // Try to find existing note
  let note = await prisma.perfumeNotes.findUnique({
    where: { name: trimmedNoteName },
  })

  // If note doesn't exist, create it
  if (!note) {
    note = await prisma.perfumeNotes.create({
      data: {
        name: trimmedNoteName,
      },
    })
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

async function importPaintboxSoapworks() {
  const csvFile = "perfumes_paintboxsoapworks.csv"
  const filePath = path.join(__dirname, "../csv", csvFile)

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${csvFile}`)
    return
  }

  console.log(`📁 Reading ${csvFile}...`)
  const content = fs.readFileSync(filePath, { encoding: "utf-8" })
  const records = parse(content, { columns: true, skip_empty_lines: true })

  console.log(`📊 Found ${records.length} records to import`)

  // Create or get Paintbox Soapworks house
  const perfumeHouse = await createOrGetPerfumeHouse("Paintbox Soapworks")
  console.log(`🏠 Perfume house: ${perfumeHouse.name} (${perfumeHouse.id})`)

  let imported = 0
  let updated = 0
  let skipped = 0
  let duplicatesRemoved = 0
  let renamed = 0

  for (let i = 0; i < records.length; i++) {
    const data = records[i]

    // Skip if name is empty
    if (!data.name || data.name.trim() === "") {
      skipped++
      continue
    }

    const perfumeName = data.name.trim()
    const houseId = perfumeHouse.id

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
        const bestExisting = scoredPerfumes.reduce((best, current) => 
          current.score > best.score ? current : best
        )
        
        const newScore = calculateDataCompleteness(data)
        
        // If we have duplicates, delete the ones with less data
        if (sameHousePerfumes.length > 1) {
          console.log(`Found ${sameHousePerfumes.length} duplicates in same house for "${perfumeName}"`)
          for (const { perfume: p } of scoredPerfumes) {
            if (p.id !== bestExisting.perfume.id) {
              console.log(`  Deleting duplicate perfume with less data: ${p.id}`)
              await prisma.perfume.delete({ where: { id: p.id } })
              duplicatesRemoved++
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
            updated++
          }
        } else {
          // Existing has more data, keep it but still process notes to add any missing ones
          perfume = bestExisting.perfume
          console.log(`  Keeping existing perfume (has more data), but will add any missing notes`)
          updated++
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
          continue
        }
        
        console.log(`Renaming "${perfumeName}" to "${newName}" (different house)`)
        
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
            description: data.description || null,
            image: data.image || null,
            perfumeHouseId: houseId,
            slug: finalSlug,
          },
        })
        imported++
        renamed++
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
          description: data.description || null,
          image: data.image || null,
          perfumeHouseId: houseId,
          slug: finalSlug,
        },
      })
      imported++
    }

    // Process notes - use existing notes from database
    const openNotes = parseNotes(data.openNotes || "")
    const heartNotes = parseNotes(data.heartNotes || "")
    const baseNotes = parseNotes(data.baseNotes || "")

    // Create note relations using existing notes (only create new notes if they don't exist)
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

    if ((i + 1) % 10 === 0) {
      console.log(`  Processed ${i + 1} of ${records.length} records`)
    }
  }

  console.log("\n✅ Import completed!")
  console.log(`📊 Summary:`)
  console.log(`   - Imported: ${imported}`)
  console.log(`   - Updated: ${updated}`)
  console.log(`   - Renamed (different house): ${renamed}`)
  console.log(`   - Duplicates removed: ${duplicatesRemoved}`)
  console.log(`   - Skipped: ${skipped}`)
}

async function main() {
  console.log("🚀 Starting Paintbox Soapworks import...")
  try {
    await importPaintboxSoapworks()
  } catch (error) {
    console.error("❌ Error during import:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log("✅ Script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Script failed:", error)
    process.exit(1)
  })

