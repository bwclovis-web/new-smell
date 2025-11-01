// filepath: prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import { parse } from "csv-parse/sync"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const prisma = new PrismaClient()

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

function parseNotes(notesString: string): string[] {
  if (!notesString || notesString.trim() === "" || notesString === "[]") {
    return []
  }

  try {
    // Try to parse as JSON array first
    const parsed = JSON.parse(notesString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // If JSON parsing fails, try to split by comma
    return notesString
      .split(",")
      .map(note => note.trim())
      .filter(note => note.length > 0)
  }
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
      type: "indie", // Default to indie, you can adjust this
    },
  })
}

async function createPerfumeNote(
  noteName: string,
  perfumeId: string,
  noteType: "open" | "heart" | "base"
) {
  if (!noteName || noteName.trim() === "") {
    return null
  }

  const trimmedNoteName = noteName.trim().toLowerCase()

  // Check if note already exists
  const existingNote = await prisma.perfumeNotes.findUnique({
    where: { name: trimmedNoteName },
  })

  const noteData: any = {
    name: trimmedNoteName,
  }

  // Set the appropriate perfume relationship based on note type
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
    default:
      return null
  }

  // If note exists, just update the relationship
  if (existingNote) {
    return await prisma.perfumeNotes.update({
      where: { id: existingNote.id },
      data: noteData,
    })
  }

  // Create new note
  return await prisma.perfumeNotes.create({
    data: noteData,
  })
}

async function importPerfumeData(csvFiles: string[]) {
  for (const csvFile of csvFiles) {
    const filePath = path.join(__dirname, "../csv", csvFile)

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${csvFile}`)
      continue
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

      // Check if perfume already exists
      let perfumeName = data.name.trim()
      const existingPerfume = await prisma.perfume.findUnique({
        where: { name: perfumeName },
      })

      if (existingPerfume) {
        // If duplicate found, append house name
        const houseName = data.perfumeHouse ? data.perfumeHouse.trim() : "Unknown"
        perfumeName = `${perfumeName} - ${houseName}`
        console.log(`Perfume "${data.name}" already exists, renaming to "${perfumeName}"`)

        // Check if the renamed version also exists
        const renamedExists = await prisma.perfume.findUnique({
          where: { name: perfumeName },
        })

        if (renamedExists) {
          console.log(`Renamed perfume "${perfumeName}" also exists, skipping...`)
          return
        }
      }

      // Create the perfume
      const perfume = await prisma.perfume.create({
        data: {
          name: perfumeName,
          description: data.description || null,
          image: data.image || null,
          perfumeHouseId: perfumeHouse?.id || null,
        },
      })

      // Process notes
      const openNotes = parseNotes(data.openNotes || "")
      const heartNotes = parseNotes(data.heartNotes || "")
      const baseNotes = parseNotes(data.baseNotes || "")

      // Create open notes
      for (const noteName of openNotes) {
        await createPerfumeNote(noteName, perfume.id, "open")
      }

      // Create heart notes
      for (const noteName of heartNotes) {
        await createPerfumeNote(noteName, perfume.id, "heart")
      }

      // Create base notes
      for (const noteName of baseNotes) {
        await createPerfumeNote(noteName, perfume.id, "base")
      }
    })
  }
}

async function main() {
  console.log("🚀 Starting database seeding...")

  // List of all your CSV files
  const csvFiles = [
    "perfumes_4160tuesdays_updated.csv",
    "perfumes_akro_updated.csv",
    "perfumes_blackcliff.csv",
    "perfumes_cocoapink.csv",
    "perfumes_lucky9.csv",
    "perfumes_luvmilk.csv",
    "perfumes_navitus_updated.csv",
    "perfumes_pnicolai.csv",
    "perfumes_poesieperfume_updated.csv",
    "perfumes_possets.csv",
    "perfumes_sagegoddess.csv",
    "perfumes_sarahbaker.csv",
    "perfumes_scentsofwood_fixed.csv",
    "perfumes_shopsorce_updated.csv",
    "perfumes_strangesouth_updated.csv",
    "perfumes_thoo.csv",
    "perfumes_tiziana_terenzi.csv",
    "perfumes_xerjoff.csv",
    "bpal_enhanced_progress_1450.csv",
  ]

  await importPerfumeData(csvFiles)

  console.log("✅ Database seeding completed!")
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
