#!/usr/bin/env node
/**
 * Verify Fzotic Perfumes import
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function verifyImport() {
  // Get Fzotic house
  const fzoticHouse = await prisma.perfumeHouse.findFirst({
    where: {
      name: {
        equals: "Fzotic",
        mode: "insensitive",
      },
    },
  })

  if (!fzoticHouse) {
    console.log("❌ Fzotic house not found!")
    return
  }

  console.log(`🏠 Fzotic House: ${fzoticHouse.name} (${fzoticHouse.id})`)

  // Get all Fzotic perfumes
  const perfumes = await prisma.perfume.findMany({
    where: {
      perfumeHouseId: fzoticHouse.id,
    },
    include: {
      perfumeNotesOpen: true,
      perfumeNotesHeart: true,
      perfumeNotesClose: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  console.log(`\n📊 Found ${perfumes.length} Fzotic perfumes:\n`)

  for (const perfume of perfumes) {
    console.log(`✅ ${perfume.name}`)
    console.log(`   Slug: ${perfume.slug}`)
    console.log(`   Image: ${perfume.image ? "✓" : "✗"}`)
    console.log(`   Description: ${
        perfume.description ? perfume.description.substring(0, 50) + "..." : "✗"
      }`)
    console.log(`   Open Notes (${perfume.perfumeNotesOpen.length}): ${
        perfume.perfumeNotesOpen.map(n => n.name).join(", ") || "none"
      }`)
    console.log(`   Heart Notes (${perfume.perfumeNotesHeart.length}): ${
        perfume.perfumeNotesHeart.map(n => n.name).join(", ") || "none"
      }`)
    console.log(`   Base Notes (${perfume.perfumeNotesClose.length}): ${
        perfume.perfumeNotesClose.map(n => n.name).join(", ") || "none"
      }`)
    console.log("")
  }

  // Summary
  const withDescriptions = perfumes.filter(p => p.description).length
  const withImages = perfumes.filter(p => p.image).length
  const withNotes = perfumes.filter(p => p.perfumeNotesOpen.length > 0 ||
      p.perfumeNotesHeart.length > 0 ||
      p.perfumeNotesClose.length > 0).length

  console.log(`\n📈 Summary:`)
  console.log(`   Total Perfumes: ${perfumes.length}`)
  console.log(`   With Descriptions: ${withDescriptions}`)
  console.log(`   With Images: ${withImages}`)
  console.log(`   With Notes: ${withNotes}`)
}

async function main() {
  console.log("🔍 Verifying Fzotic import...\n")

  try {
    await verifyImport()
    console.log("\n✅ Verification complete!")
  } catch (error) {
    console.error("❌ Verification failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
