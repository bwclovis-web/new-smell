#!/usr/bin/env node

/**
 * Cleanup Duplicate Notes Script
 * Removes duplicate perfume notes, keeping the first occurrence of each unique name
 * Run with: node scripts/cleanup-duplicate-notes.js
 */

import { PrismaClient } from "@prisma/client"
import dotenv from "dotenv"
import { join } from "path"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, "..")

// Load environment variables
process.env.DOTENV_CONFIG_QUIET = "true"
dotenv.config({ path: join(projectRoot, ".env") })

const prisma = new PrismaClient()

async function cleanupDuplicateNotes() {
  try {
    console.log("🔍 Finding duplicate perfume notes...")

    // Get all notes grouped by name
    const allNotes = await prisma.perfumeNotes.findMany({
      orderBy: { createdAt: "asc" }, // Keep the oldest one
    })

    // Group by normalized name (lowercase, trimmed)
    const notesByName = new Map()
    const duplicates = []

    for (const note of allNotes) {
      const normalizedName = note.name.trim().toLowerCase()
      
      if (!notesByName.has(normalizedName)) {
        notesByName.set(normalizedName, note)
      } else {
        // Found a duplicate
        const original = notesByName.get(normalizedName)
        duplicates.push({
          original,
          duplicate: note,
          normalizedName,
        })
      }
    }

    if (duplicates.length === 0) {
      console.log("✅ No duplicate notes found!")
      return
    }

    console.log(`\n📊 Found ${duplicates.length} duplicate note(s):`)
    duplicates.forEach((dup, index) => {
      console.log(`  ${index + 1}. "${dup.normalizedName}"`)
      console.log(`     Original: ${dup.original.id} (created: ${dup.original.createdAt})`)
      console.log(`     Duplicate: ${dup.duplicate.id} (created: ${dup.duplicate.createdAt})`)
    })

    console.log("\n⚠️  This will delete duplicate notes. The original (oldest) note will be kept.")
    console.log("   If duplicates have different perfume links, those will be lost.")
    console.log("   Make sure you have a backup before proceeding!\n")

    // In a real scenario, you might want to:
    // 1. Merge perfume relationships before deleting
    // 2. Ask for confirmation
    // 3. Create a backup first

    let deletedCount = 0
    for (const dup of duplicates) {
      try {
        // Optionally merge relationships (if schema allowed)
        // For now, we just delete the duplicate
        await prisma.perfumeNotes.delete({
          where: { id: dup.duplicate.id },
        })
        deletedCount++
        console.log(`✅ Deleted duplicate: ${dup.duplicate.id} (${dup.normalizedName})`)
      } catch (error) {
        console.error(`❌ Error deleting ${dup.duplicate.id}:`, error.message)
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate note(s).`)
  } catch (error) {
    console.error("❌ Error during cleanup:", error.message)
    throw error
  }
}

async function main() {
  try {
    await cleanupDuplicateNotes()
  } catch (error) {
    console.error("Failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith("cleanup-duplicate-notes.js")) {
  main()
}

export { cleanupDuplicateNotes }



