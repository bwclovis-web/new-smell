#!/usr/bin/env node

/**
 * Script to copy images from app/images to public/images for build
 */

import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sourceDir = join(__dirname, '../app/images')
const targetDir = join(__dirname, '../public/images')

function copyImages() {
  try {
    // Create target directory if it doesn't exist
    if (!statSync(targetDir, { throwIfNoEntry: false })) {
      mkdirSync(targetDir, { recursive: true })
      console.log('✅ Created public/images directory')
    }

    // Read source directory
    const files = readdirSync(sourceDir)
    
    // Copy each image file
    let copiedCount = 0
    files.forEach(file => {
      if (file.match(/\.(webp|png|jpg|jpeg|svg|gif|ico)$/i)) {
        const sourcePath = join(sourceDir, file)
        const targetPath = join(targetDir, file)
        
        copyFileSync(sourcePath, targetPath)
        copiedCount++
        console.log(`📁 Copied: ${file}`)
      }
    })

    console.log(`✅ Successfully copied ${copiedCount} image files`)
  } catch (error) {
    console.error('❌ Error copying images:', error.message)
    process.exit(1)
  }
}

copyImages()
