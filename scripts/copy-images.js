#!/usr/bin/env node

/**
 * Script to copy images from app/images to public/images for build
 * Optionally converts PNG files to WebP format
 */

import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sourceDir = join(__dirname, "../app/images")
const targetDir = join(__dirname, "../public/images")

// Check if PNG to WebP conversion is enabled via environment variable
const CONVERT_PNG_TO_WEBP = process.env.CONVERT_PNG_TO_WEBP === "true"

async function copyImages() {
  try {
    // Create target directory if it doesn't exist
    if (!statSync(targetDir, { throwIfNoEntry: false })) {
      mkdirSync(targetDir, { recursive: true })
      console.log("✅ Created public/images directory")
    }

    // Read source directory
    const files = readdirSync(sourceDir)

    let copiedCount = 0
    let convertedCount = 0

    // Process PNG files first if conversion is enabled
    const pngFiles = files.filter((file) => file.toLowerCase().endsWith(".png"))
    const otherFiles = files.filter((file) =>
      file.match(/\.(webp|jpg|jpeg|svg|gif|ico)$/i)
    )

    if (CONVERT_PNG_TO_WEBP && pngFiles.length > 0) {
      console.log(`🔄 Converting ${pngFiles.length} PNG files to WebP...`)

      try {
        // Dynamic import to avoid loading Sharp if not needed
        const { convertPngToWebP, getOptimizedOptions } = await import(
          "../app/utils/imageConversion.js"
        )

        for (const file of pngFiles) {
          const sourcePath = join(sourceDir, file)
          const webpFileName = file.replace(/\.png$/i, ".webp")
          const targetPath = join(targetDir, webpFileName)

          const result = await convertPngToWebP(
            sourcePath,
            targetPath,
            getOptimizedOptions("web")
          )

          if (result.success) {
            convertedCount++
            console.log(
              `🔄 Converted: ${file} → ${webpFileName} (${result.compressionRatio.toFixed(
                1
              )}% smaller)`
            )
          } else {
            console.log(
              `⚠️  Failed to convert ${file}, copying original: ${result.error}`
            )
            copyFileSync(sourcePath, join(targetDir, file))
            copiedCount++
          }
        }
      } catch (error) {
        console.log(
          `⚠️  WebP conversion failed, falling back to copying PNG files: ${error.message}`
        )
        // Fallback: copy PNG files as-is
        for (const file of pngFiles) {
          const sourcePath = join(sourceDir, file)
          const targetPath = join(targetDir, file)
          copyFileSync(sourcePath, targetPath)
          copiedCount++
          console.log(`📁 Copied: ${file}`)
        }
      }
    } else {
      // Copy PNG files normally if conversion is disabled
      for (const file of pngFiles) {
        const sourcePath = join(sourceDir, file)
        const targetPath = join(targetDir, file)
        copyFileSync(sourcePath, targetPath)
        copiedCount++
        console.log(`📁 Copied: ${file}`)
      }
    }

    // Copy other image files
    for (const file of otherFiles) {
      const sourcePath = join(sourceDir, file)
      const targetPath = join(targetDir, file)

      copyFileSync(sourcePath, targetPath)
      copiedCount++
      console.log(`📁 Copied: ${file}`)
    }

    const totalProcessed = copiedCount + convertedCount
    if (convertedCount > 0) {
      console.log(
        `✅ Successfully processed ${totalProcessed} image files (${convertedCount} converted to WebP, ${copiedCount} copied)`
      )
    } else {
      console.log(`✅ Successfully copied ${copiedCount} image files`)
    }
  } catch (error) {
    console.error("❌ Error copying images:", error.message)
    process.exit(1)
  }
}

copyImages()
