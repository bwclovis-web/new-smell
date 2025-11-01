#!/usr/bin/env node
/**
 * Clean up Andrea Maack perfumes from database
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function cleanup() {
  console.log("🧹 Cleaning up Andrea Maack perfumes...")

  try {
    // Find Andrea Maack house
    const house = await prisma.perfumeHouse.findFirst({
      where: {
        name: {
          equals: "Andrea Maack",
          mode: "insensitive",
        },
      },
    })

    if (!house) {
      console.log("ℹ️  Andrea Maack house not found, nothing to clean up")
      return
    }

    // Delete all perfumes from Andrea Maack
    const result = await prisma.perfume.deleteMany({
      where: {
        perfumeHouseId: house.id,
      },
    })

    console.log(`✅ Deleted ${result.count} perfumes from Andrea Maack`)

    // Clean up orphaned notes (notes not connected to any perfume)
    const orphanedNotes = await prisma.perfumeNotes.findMany({
      where: {
        AND: [
          { perfumeOpenId: null },
          { perfumeHeartId: null },
          { perfumeCloseId: null },
        ],
      },
    })

    if (orphanedNotes.length > 0) {
      await prisma.perfumeNotes.deleteMany({
        where: {
          AND: [
            { perfumeOpenId: null },
            { perfumeHeartId: null },
            { perfumeCloseId: null },
          ],
        },
      })
      console.log(`🗑️  Cleaned up ${orphanedNotes.length} orphaned notes`)
    }

    console.log("✅ Cleanup completed!")
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanup()
