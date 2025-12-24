// Import script for Aroma Kaz CSV file
// Handles duplicates intelligently:
// - Same house: update existing with missing info
// - Different house: append "-house name"
// - Uses existing notes from database
// - Only creates new notes when needed

import { PerfumeNoteType, PrismaClient } from "@prisma/client"
import { parse } from "csv-parse/sync"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

import { createUrlSlug } from "~/utils/slug"

const prisma = new PrismaClient()

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    const parsed = JSON.parse(notesString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // If JSON parsing fails, try comma-separated
    return notesString
      .split(",")
      .map(note => note.trim().replace(/^["']|["']$/g, ""))
      .filter(note => note.length > 0)
  }
}

function parseDescription(descriptionString: string | null | undefined): { description: string | null; extractedNotes: string[] } {
  if (!descriptionString || descriptionString.trim() === "") {
    return { description: null, extractedNotes: [] }
  }

  const trimmed = descriptionString.trim()
  
  // Check if it's a JSON object with cleaned_description
  if (trimmed.startsWith("{") || trimmed.startsWith("{{")) {
    try {
      // Remove extra braces if present
      const cleaned = trimmed.replace(/^\{+|\}+$/g, "")
      const parsed = JSON.parse(cleaned)
      const description = parsed.cleaned_description ? parsed.cleaned_description.trim() : null
      const extractedNotes = Array.isArray(parsed.extracted_notes) ? parsed.extracted_notes : []
      return { description, extractedNotes }
    } catch {
      // If JSON parsing fails, return as-is
    }
  }
  
  return { description: trimmed, extractedNotes: [] }
}

function fixImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || imageUrl.trim() === "") {
    return null
  }

  let url = imageUrl.trim()
  
  // Fix URLs that start with //
  if (url.startsWith("//")) {
    url = "https:" + url
  }
  
  // Fix URLs that start with /
  if (url.startsWith("/") && !url.startsWith("http")) {
    url = "https://aromakaz.com" + url
  }

  return url
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

async function importPerfumeData(csvFile: string, baseDir: string) {
  const resolvedBaseDir = path.isAbsolute(baseDir)
    ? baseDir
    : path.join(__dirname, "..", baseDir.replace(/^\.\//, ""))

  const filePath = path.join(resolvedBaseDir, csvFile)

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${csvFile}`)
    return
  }

  await importCsv(filePath, async data => {
    // Skip if name is empty
    if (!data.name || data.name.trim() === "") {
      return
    }

    // Create or get perfume house
    let perfumeHouse = null
    if (data.perfumeHouse) {
      perfumeHouse = await createOrGetPerfumeHouse(data.perfumeHouse)
    }

    const perfumeName = data.name.trim()
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
            }
          }
        }
        
        // Update with missing information
        const updateData: any = {}
        const { description: parsedDescription, extractedNotes: descriptionNotes } = parseDescription(data.description)
        if (parsedDescription) {
          const currentDescription = bestExisting.perfume.description?.trim()
          if (!currentDescription || currentDescription !== parsedDescription) {
            updateData.description = parsedDescription
          }
        }
        if (data.image) {
          const newImage = fixImageUrl(data.image)
          const currentImage = bestExisting.perfume.image?.trim()
          if (!currentImage || (newImage && currentImage !== newImage)) {
            updateData.image = newImage || null
          }
        }

        if (Object.keys(updateData).length > 0) {
          console.log(`Updating existing perfume "${perfumeName}" from same house with missing data`)
          perfume = await prisma.perfume.update({
            where: { id: bestExisting.perfume.id },
            data: updateData,
          })
        } else {
          // Existing remains the same, but still add any missing notes
          perfume = bestExisting.perfume
          console.log(`  Existing perfume "${perfumeName}" already up to date; checking notes`)
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
          return
        }
        
        console.log(`Renaming "${perfumeName}" to "${newName}" (different house)`)
        
        const slug = createUrlSlug(newName)
        let finalSlug = slug
        let counter = 1
        while (await prisma.perfume.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${counter}`
          counter++
        }
        
        const { description: parsedDescription } = parseDescription(data.description)
        perfume = await prisma.perfume.create({
          data: {
            name: newName,
            description: parsedDescription,
            image: fixImageUrl(data.image),
            perfumeHouseId: houseId,
            slug: finalSlug,
          },
        })
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
      
      const { description: parsedDescription } = parseDescription(data.description)
      perfume = await prisma.perfume.create({
        data: {
          name: perfumeName,
          description: parsedDescription,
          image: fixImageUrl(data.image),
          perfumeHouseId: houseId,
          slug: finalSlug,
        },
      })
    }

    // Process notes
    let openNotes = parseNotes(data.openNotes || "")
    const heartNotes = parseNotes(data.heartNotes || "")
    const baseNotes = parseNotes(data.baseNotes || "")
    
    // If openNotes is empty, check if description has extracted_notes
    if (openNotes.length === 0) {
      const { extractedNotes: descriptionNotes } = parseDescription(data.description)
      if (descriptionNotes.length > 0) {
        openNotes = descriptionNotes
      }
    }

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

async function main() {
  console.log("🚀 Starting CSV import for Aroma Kaz...")

  // Get CSV file name from command line argument
  const args = process.argv.slice(2)
  const dirArgIndex = args.findIndex(arg => arg.startsWith("--dir="))
  let baseDir = "../csv"

  if (dirArgIndex !== -1) {
    baseDir = args[dirArgIndex].replace("--dir=", "") || baseDir
    args.splice(dirArgIndex, 1)
  }

  const csvFileName = args[0] || "perfumes_aromakaz_cleaned_20251221_132436.csv"

  console.log(`Importing CSV file: ${csvFileName} from directory ${baseDir}`)

  await importPerfumeData(csvFileName, baseDir)

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

