// Script to fix existing slugs in the database
// This will update all perfume houses and perfumes with properly formatted slugs

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const createUrlSlug = (name) => {
  if (!name || typeof name !== "string") {
    return ""
  }

  return (
    name
      // First decode any URL-encoded characters
      .replace(/%20/g, " ")
      // Replace spaces with hyphens
      .replace(/\s+/g, "-")
      // Replace underscores with hyphens
      .replace(/_/g, "-")
      // Remove multiple consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Convert to lowercase
      .toLowerCase()
  )
}

async function fixSlugs() {
  try {
    console.log("Starting slug fix process...")

    // Fix perfume house slugs
    console.log("Fixing perfume house slugs...")
    const houses = await prisma.perfumeHouse.findMany({
      select: { id: true, name: true, slug: true },
    })

    for (const house of houses) {
      const newSlug = createUrlSlug(house.name)
      if (newSlug !== house.slug) {
        console.log(
          `Updating house "${house.name}": "${house.slug}" -> "${newSlug}"`
        )
        try {
          await prisma.perfumeHouse.update({
            where: { id: house.id },
            data: { slug: newSlug },
          })
        } catch (error) {
          if (error.code === "P2002") {
            console.log(
              `  Skipping "${house.name}" - slug "${newSlug}" already exists`
            )
          } else {
            console.error(`  Error updating "${house.name}":`, error.message)
          }
        }
      }
    }

    // Fix perfume slugs
    console.log("Fixing perfume slugs...")
    const perfumes = await prisma.perfume.findMany({
      select: { id: true, name: true, slug: true },
    })

    for (const perfume of perfumes) {
      const newSlug = createUrlSlug(perfume.name)
      if (newSlug !== perfume.slug) {
        console.log(
          `Updating perfume "${perfume.name}": "${perfume.slug}" -> "${newSlug}"`
        )
        try {
          await prisma.perfume.update({
            where: { id: perfume.id },
            data: { slug: newSlug },
          })
        } catch (error) {
          if (error.code === "P2002") {
            console.log(
              `  Skipping "${perfume.name}" - slug "${newSlug}" already exists`
            )
          } else {
            console.error(`  Error updating "${perfume.name}":`, error.message)
          }
        }
      }
    }

    console.log("Slug fix process completed!")
  } catch (error) {
    console.error("Error during slug fix process:", error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSlugs()
