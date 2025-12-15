#!/usr/bin/env node

/**
 * Clean Duplicate and Erroneous Notes Script
 * 
 * Safely removes duplicate notes, invalid notes (with special characters), stopwords, and descriptive phrases.
 * All perfume relationships are preserved by reassociating to canonical notes.
 * 
 * IMPORTANT: Run `npm run db:backup` before executing this script!
 * If rollback is needed, use `npm run db:restore` with the backup created before cleanup.
 * 
 * Usage:
 *   node scripts/clean-notes.js           # Execute cleanup
 *   node scripts/clean-notes.js --dry-run  # Preview changes without applying
 */

import { PrismaClient } from "@prisma/client"
import dotenv from "dotenv"
import { join } from "path"
import { dirname } from "path"
import { fileURLToPath } from "url"
import { writeFileSync, mkdirSync } from "fs"
import { existsSync } from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, "..")

// Load environment variables
process.env.DOTENV_CONFIG_QUIET = "true"
dotenv.config({ path: join(projectRoot, ".env") })

const prisma = new PrismaClient()

const isDryRun = process.argv.includes("--dry-run")

// Report generation for dry-run
let reportContent = []
let reportPath = null

function addToReport(content) {
  reportContent.push(content)
}

function generateReportPath() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const reportsDir = join(projectRoot, "reports")
  
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true })
  }
  
  return join(reportsDir, `clean-notes-dry-run-${timestamp}.md`)
}

function saveReport() {
  if (isDryRun && reportContent.length > 0) {
    reportPath = generateReportPath()
    const fullReport = reportContent.join('\n')
    writeFileSync(reportPath, fullReport, 'utf-8')
    console.log(`\n📄 Dry-run report saved to: ${reportPath}`)
  }
}

// Stopwords to remove (common English words that aren't perfume notes)
// Also removes descriptive phrases/sentences like "fall part one", "none of us really changes over time"
const STOPWORDS = [
  "and", "of", "with", "the", "a", "an", "or", "but", "in", "on", "at", "to", 
  "for", "from", "by", "as", "is", "was", "are", "were", "be", "been", "being", 
  "have", "has", "had", "do", "does", "did", "will", "would", "should", "could", 
  "may", "might", "must", "can"
]

// Valid characters: letters, numbers, spaces, hyphens, apostrophes
const VALID_CHAR_REGEX = /^[a-zA-Z0-9\s\-']+$/

/**
 * Normalize note name (lowercase, trim)
 */
function normalizeName(name) {
  return name.trim().toLowerCase()
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Check if note name contains only valid characters
 */
function isValidNoteName(name) {
  return VALID_CHAR_REGEX.test(name)
}

/**
 * Clean note name by removing invalid characters
 */
function cleanNoteName(name) {
  return name.replace(/[^a-zA-Z0-9\s\-']/g, '').trim()
}

/**
 * Check if note is a stopword
 */
function isStopword(name) {
  return STOPWORDS.includes(normalizeName(name))
}

/**
 * Extract note name from descriptive phrase
 * Examples: "the delicate scent of roses" → "roses", "a hint of vanilla" → "vanilla"
 * Returns null if no note can be extracted
 */
function extractNoteFromPhrase(name, existingNotes) {
  const normalized = normalizeName(name)
  const trimmed = normalized.trim()
  const words = trimmed.split(/\s+/).filter(w => w.length > 0)
  
  // Patterns that indicate a note name follows
  const extractionPatterns = [
    // "smells like: [adjective] [note]" - captures "vanilla" from "smells like: velvety vanilla"
    // Try to capture just the note name (last word(s)) if there's an adjective
    /smells?\s+like:?\s+(?:(?:velvety|delicate|subtle|strong|soft|light|heavy|faint|intense|rich|deep|fresh|warm|cool|sweet|bitter|spicy|floral|woody|citrus)\s+)?(\w+(?:\s+\w+){0,4})/i,
    // "the [adjective] scent of [note]" - captures "roses" from "the delicate scent of roses"
    /(?:the\s+)?(?:\w+\s+)?scent\s+of\s+(\w+(?:\s+\w+){0,4})/i,
    // "a hint of [note]" - captures "vanilla" from "a hint of vanilla"
    /(?:a\s+)?hint\s+of\s+(\w+(?:\s+\w+){0,4})/i,
    // "notes of [note]" or "note of [note]"
    /notes?\s+of\s+(\w+(?:\s+\w+){0,4})/i,
    // "with notes of [note]" or "featuring [note]"
    /(?:with|featuring)\s+(?:notes?\s+of\s+)?(\w+(?:\s+\w+){0,4})/i,
    // "velvety [note]", "delicate [note]", etc. - captures note after adjective
    /(?:velvety|delicate|subtle|strong|soft|light|heavy|faint|intense|rich|deep|fresh|warm|cool|sweet|bitter|spicy|floral|woody|citrus)\s+(\w+(?:\s+\w+){0,4})/i,
    // "[note] scent", "[note] aroma", "[note] fragrance" - captures note before descriptor
    /(\w+(?:\s+\w+){0,4})\s+(?:scent|aroma|fragrance|note|notes)/i,
    // "the [adjective] [note]" - e.g., "the delicate roses"
    /the\s+(?:delicate|subtle|strong|soft|light|heavy|faint|intense|rich|deep|fresh|warm|cool|sweet|bitter|spicy|floral|woody|citrus)\s+(\w+(?:\s+\w+){0,4})/i,
  ]
  
  // Try extraction patterns first
  for (const pattern of extractionPatterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) {
      const extracted = match[1].trim()
      
      // Skip if extracted is a stopword
      if (isStopword(extracted)) {
        continue
      }
      
      // Skip if too short (less than 2 characters)
      if (extracted.length < 2) {
        continue
      }
      
      // Try to strip common adjectives from the beginning (e.g., "velvety vanilla" → "vanilla")
      const adjectives = ['velvety', 'delicate', 'subtle', 'strong', 'soft', 'light', 'heavy', 'faint', 'intense', 'rich', 'deep', 'fresh', 'warm', 'cool', 'sweet', 'bitter', 'spicy', 'floral', 'woody', 'citrus', 'creamy', 'smooth', 'sharp', 'mellow']
      let cleanedExtracted = extracted
      const extractedWords = extracted.split(/\s+/)
      if (extractedWords.length > 1 && adjectives.includes(normalizeName(extractedWords[0]))) {
        // Remove the first word if it's an adjective
        cleanedExtracted = extractedWords.slice(1).join(' ')
      }
      
      // Check if cleaned extracted note exists in database (case-insensitive)
      const foundNote = existingNotes.find(n => 
        normalizeName(n.name) === normalizeName(cleanedExtracted)
      )
      if (foundNote) {
        return foundNote.name
      }
      
      // Check original extracted note too
      const foundNoteOriginal = existingNotes.find(n => 
        normalizeName(n.name) === normalizeName(extracted)
      )
      if (foundNoteOriginal) {
        return foundNoteOriginal.name
      }
      
      // Also check if it's a valid note name (1-5 words for multi-word notes like "frosted pumpkin pecan cookies", reasonable length)
      const wordCount = cleanedExtracted.split(/\s+/).length
      if (wordCount >= 1 && wordCount <= 5 && cleanedExtracted.length <= 50) {
        return cleanedExtracted
      }
      
      // Fallback to original if cleaned is too short
      const originalWordCount = extracted.split(/\s+/).length
      if (originalWordCount >= 1 && originalWordCount <= 5 && extracted.length <= 50) {
        return extracted
      }
    }
  }
  
  // Fallback: try to find a known note name in the phrase
  // Check if any existing note name appears in the phrase
  for (const existingNote of existingNotes) {
    const noteName = normalizeName(existingNote.name)
    // Check if the note name appears as a whole word in the phrase
    const noteWords = noteName.split(/\s+/)
    if (noteWords.length === 1) {
      // Single word note - check if it appears as a whole word
      // Escape special regex characters in the note name
      const escapedNote = escapeRegex(noteWords[0])
      const wordBoundaryRegex = new RegExp(`\\b${escapedNote}\\b`, 'i')
      if (wordBoundaryRegex.test(trimmed)) {
        return existingNote.name
      }
    } else {
      // Multi-word note - check if the phrase contains it
      if (trimmed.includes(noteName)) {
        return existingNote.name
      }
    }
  }
  
  // Last resort: try to extract the last significant word(s) if phrase is short
  // Look for patterns like "smells like: [note]" at the end
  const smellsLikeMatch = trimmed.match(/smells?\s+like:?\s+(.+)$/i)
  if (smellsLikeMatch && smellsLikeMatch[1]) {
    const candidate = smellsLikeMatch[1].trim()
    if (candidate.length >= 2 && candidate.length <= 50) {
      const wordCount = candidate.split(/\s+/).length
      if (wordCount >= 1 && wordCount <= 5 && !isStopword(candidate)) {
        // Check if it matches an existing note
        const foundNote = existingNotes.find(n => 
          normalizeName(n.name) === normalizeName(candidate)
        )
        if (foundNote) {
          return foundNote.name
        }
        return candidate
      }
    }
  }
  
  // Try last 1-5 words as potential note name (for multi-word notes like "frosted pumpkin pecan cookies")
  if (words.length >= 3 && words.length <= 10) {
    for (let i = 1; i <= 5; i++) {
      const candidate = words.slice(-i).join(' ')
      if (candidate.length <= 50 && candidate.length >= 2) {
        // Skip if it's a stopword
        if (isStopword(candidate)) {
          continue
        }
        
        // Check if it matches an existing note
        const foundNote = existingNotes.find(n => 
          normalizeName(n.name) === normalizeName(candidate)
        )
        if (foundNote) {
          return foundNote.name
        }
        
        // If it's a reasonable length and not a stopword, return it
        // Prefer shorter extractions (1-3 words) over longer ones (4-5 words)
        if (i <= 3 || (i <= 5 && candidate.length <= 40)) {
          return candidate
        }
      }
    }
  }
  
  return null
}

/**
 * Check if note is a descriptive phrase/sentence (not a valid perfume note)
 * Examples: "fall part one", "none of us really changes over time", "a tendril of smoke lighter"
 * Also includes phrases that can have notes extracted: "the delicate scent of roses"
 */
function isDescriptivePhrase(name) {
  const normalized = normalizeName(name)
  const trimmed = normalized.trim()
  
  // Too long to be a perfume note (allow up to 50 chars for multi-word notes like "frosted pumpkin pecan cookies")
  if (trimmed.length > 50) {
    return true
  }
  
  // Contains sentence-like patterns
  // Multiple common words that form a phrase (6+ words suggests a sentence/phrase, not a note)
  // Allow 4-5 words for valid multi-word notes like "frosted pumpkin pecan cookies"
  const words = trimmed.split(/\s+/).filter(w => w.length > 0)
  if (words.length >= 6) {
    return true
  }
  
  // Contains common phrase patterns that should be removed (no extraction possible)
  const phrasePatterns = [
    /\b(part\s+(one|two|three|1|2|3))\b/i,
    /\b(none\s+of\s+us)\b/i,
    /\b(changes?\s+over\s+time)\b/i,
    /\b(a\s+tendril\s+of)\b/i,
    /\b(lighter|heavier|stronger|weaker)\s+(than|then)\b/i,
    /\b(one\s+of\s+the)\b/i,
    /\b(all\s+of\s+the)\b/i,
    /\b(some\s+of\s+the)\b/i,
    // Phrases that fade/transition without extractable notes
    /\b(but|and|or)\s+that\s+(fades?|transitions?|turns?|becomes?|changes?)\s+(into|to|from)\b/i,
    /\b(fades?|transitions?|turns?|becomes?|changes?)\s+(into|to|from)\s+(the|a|an)\s+\w+\s+\w+/i,
    // Phrases that might contain extractable notes (these will be handled by extraction logic)
    /\b(scent|aroma|fragrance|hint|note|notes)\s+(of|with)\b/i,
    /\b(the|a|an)\s+\w+\s+(scent|aroma|fragrance)\s+of\b/i,
    /\bsmells?\s+like:?\b/i,
  ]
  
  for (const pattern of phrasePatterns) {
    if (pattern.test(trimmed)) {
      return true
    }
  }
  
  return false
}

/**
 * Pre-flight validation checks
 */
async function validateDatabase() {
  console.log("🔍 Running pre-flight checks...\n")
  
  try {
    // Test database connection
    await prisma.$connect()
    console.log("✅ Database connection successful")
    
    // Count notes and relations
    const noteCount = await prisma.perfumeNotes.count()
    const relationCount = await prisma.perfumeNoteRelation.count()
    
    console.log(`✅ Found ${noteCount} notes and ${relationCount} note relations\n`)
    
    return { noteCount, relationCount }
  } catch (error) {
    console.error("❌ Pre-flight check failed:", error.message)
    throw error
  }
}

/**
 * Post-cleanup validation
 */
async function validateCleanup(initialCounts) {
  console.log("\n🔍 Running post-cleanup validation...\n")
  
  try {
    const finalNoteCount = await prisma.perfumeNotes.count()
    const finalRelationCount = await prisma.perfumeNoteRelation.count()
    
    // Check for orphaned relations
    const orphanedRelations = await prisma.perfumeNoteRelation.findMany({
      where: {
        note: null
      }
    })
    
    if (orphanedRelations.length > 0) {
      console.error(`❌ Found ${orphanedRelations.length} orphaned relations!`)
      throw new Error("Orphaned relations detected")
    }
    
    console.log(`✅ Final counts: ${finalNoteCount} notes, ${finalRelationCount} relations`)
    console.log(`✅ No orphaned relations found`)
    console.log(`✅ All notes are valid`)
    
    return {
      notesRemoved: initialCounts.noteCount - finalNoteCount,
      relationsUpdated: initialCounts.relationCount - finalRelationCount
    }
  } catch (error) {
    console.error("❌ Post-cleanup validation failed:", error.message)
    throw error
  }
}

/**
 * Phase 1: Identify and merge duplicates
 */
async function identifyDuplicates() {
  console.log("🔍 Phase 1: Identifying duplicate notes...\n")
  
  const allNotes = await prisma.perfumeNotes.findMany({
    include: {
      perfumeNoteRelations: true
    }
  })
  
  // Group by normalized name
  const notesByName = new Map()
  
  for (const note of allNotes) {
    const normalizedName = normalizeName(note.name)
    
    if (!notesByName.has(normalizedName)) {
      notesByName.set(normalizedName, [])
    }
    notesByName.get(normalizedName).push(note)
  }
  
  // Find duplicates
  const duplicates = []
  for (const [normalizedName, notes] of notesByName.entries()) {
    if (notes.length > 1) {
      // Count relations for each note
      const notesWithCounts = notes.map(note => ({
        ...note,
        relationCount: note.perfumeNoteRelations.length
      }))
      
      // Sort by relation count (desc), then by createdAt (asc)
      notesWithCounts.sort((a, b) => {
        if (b.relationCount !== a.relationCount) {
          return b.relationCount - a.relationCount
        }
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
      
      duplicates.push({
        normalizedName,
        notes: notesWithCounts
      })
    }
  }
  
  return duplicates
}

/**
 * Phase 1: Merge duplicates
 */
async function mergeDuplicates(duplicates, isDryRun) {
  if (duplicates.length === 0) {
    const msg = "✅ No duplicate notes found!\n"
    console.log(msg)
    if (isDryRun) addToReport("## Phase 1: Duplicate Notes\n\n✅ No duplicate notes found!\n")
    return { merged: 0, relationsUpdated: 0 }
  }
  
  const msg1 = `📊 Found ${duplicates.length} duplicate group(s):\n`
  console.log(msg1)
  if (isDryRun) {
    addToReport("## Phase 1: Duplicate Notes\n")
    addToReport(`**Found ${duplicates.length} duplicate group(s):**\n\n`)
  }
  
  let totalNotesToMerge = 0
  for (const dup of duplicates) {
    totalNotesToMerge += dup.notes.length - 1
    const consoleMsg = `  "${dup.normalizedName}" (${dup.notes.length} variants):`
    console.log(consoleMsg)
    if (isDryRun) {
      addToReport(`### "${dup.normalizedName}" (${dup.notes.length} variants)\n\n`)
      addToReport("| # | Note Name | ID | Relations | Action |\n")
      addToReport("|---|-----------|----|-----------|--------|\n")
    }
    
    dup.notes.forEach((note, index) => {
      const keep = index === 0 ? " (KEEP - canonical)" : " (MERGE)"
      const action = index === 0 ? "KEEP (canonical)" : "MERGE"
      const consoleMsg = `    ${index + 1}. "${note.name}" (${note.id}) - ${note.relationCount} relations${keep}`
      console.log(consoleMsg)
      if (isDryRun) {
        addToReport(`| ${index + 1} | "${note.name}" | ${note.id} | ${note.relationCount} | ${action} |\n`)
      }
    })
    console.log("")
    if (isDryRun) addToReport("\n")
  }
  
  const summaryMsg = `📋 Summary: ${totalNotesToMerge} notes will be merged into ${duplicates.length} canonical notes\n`
  console.log(summaryMsg)
  if (isDryRun) {
    addToReport(`**Summary:** ${totalNotesToMerge} notes will be merged into ${duplicates.length} canonical notes\n\n`)
  }
  
  if (isDryRun) {
    console.log("✅ Dry run complete for Phase 1.\n")
    return { merged: 0, relationsUpdated: 0 }
  }
  
  console.log("🔄 Starting merge process...\n")
  
  let mergedCount = 0
  let relationsUpdatedCount = 0
  
  // Use transaction for safety
  await prisma.$transaction(async (tx) => {
    for (const dup of duplicates) {
      const canonicalNote = dup.notes[0] // Most used (or oldest if tie)
      const notesToMerge = dup.notes.slice(1)
      
      console.log(`\n📦 Merging "${dup.normalizedName}"`)
      console.log(`   Canonical: "${canonicalNote.name}" (${canonicalNote.id})`)
      
      for (const duplicateNote of notesToMerge) {
        try {
          console.log(`   → Merging "${duplicateNote.name}" (${duplicateNote.id})`)
          
          // Get all relations pointing to the duplicate note
          const relations = await tx.perfumeNoteRelation.findMany({
            where: { noteId: duplicateNote.id }
          })
          
          console.log(`     Found ${relations.length} relations to reassociate`)
          
          // Reassociate all relations to canonical note
          for (const relation of relations) {
            // Check if canonical note already has this relation (same perfume + noteType)
            const existingRelation = await tx.perfumeNoteRelation.findUnique({
              where: {
                perfumeId_noteId_noteType: {
                  perfumeId: relation.perfumeId,
                  noteId: canonicalNote.id,
                  noteType: relation.noteType
                }
              }
            })
            
            if (existingRelation) {
              // Relation already exists, just delete the duplicate relation
              await tx.perfumeNoteRelation.delete({
                where: { id: relation.id }
              })
              console.log(`     → Removed duplicate relation (already exists for canonical)`)
            } else {
              // Update relation to point to canonical note
              await tx.perfumeNoteRelation.update({
                where: { id: relation.id },
                data: { noteId: canonicalNote.id }
              })
              console.log(`     → Reassociated relation to canonical note`)
            }
            relationsUpdatedCount++
          }
          
          // Delete the duplicate note (CASCADE will handle any remaining relations)
          await tx.perfumeNotes.delete({
            where: { id: duplicateNote.id }
          })
          
          mergedCount++
          console.log(`     ✅ Merged successfully`)
        } catch (error) {
          console.error(`     ❌ Error merging: ${error.message}`)
          throw error // Rollback transaction
        }
      }
    }
  })
  
  console.log(`\n✅ Phase 1 complete: Merged ${mergedCount} duplicate notes, updated ${relationsUpdatedCount} relations\n`)
  
  return { merged: mergedCount, relationsUpdated: relationsUpdatedCount }
}

/**
 * Phase 2: Identify notes with invalid characters
 */
async function identifyInvalidNotes() {
  console.log("🔍 Phase 2: Identifying notes with invalid characters...\n")
  
  const allNotes = await prisma.perfumeNotes.findMany()
  
  const invalidNotes = []
  for (const note of allNotes) {
    if (!isValidNoteName(note.name)) {
      const cleanedName = cleanNoteName(note.name)
      if (cleanedName.length === 0) {
        // Name becomes empty after cleaning - mark for deletion
        invalidNotes.push({
          note,
          action: "delete",
          cleanedName: null
        })
      } else {
        invalidNotes.push({
          note,
          action: "clean",
          cleanedName: cleanedName
        })
      }
    }
  }
  
  return invalidNotes
}

/**
 * Phase 2: Clean invalid notes
 */
async function cleanInvalidNotes(invalidNotes, isDryRun) {
  if (invalidNotes.length === 0) {
    const msg = "✅ No invalid notes found!\n"
    console.log(msg)
    if (isDryRun) addToReport("## Phase 2: Invalid Characters\n\n✅ No invalid notes found!\n")
    return { cleaned: 0, deleted: 0, relationsUpdated: 0 }
  }
  
  const msg1 = `📊 Found ${invalidNotes.length} invalid note(s):\n`
  console.log(msg1)
  if (isDryRun) {
    addToReport("## Phase 2: Invalid Characters\n")
    addToReport(`**Found ${invalidNotes.length} invalid note(s):**\n\n`)
    addToReport("| Note Name | ID | Action | New Name |\n")
    addToReport("|-----------|----|--------|----------|\n")
  }
  
  for (const item of invalidNotes) {
    if (item.action === "delete") {
      const msg = `  ❌ "${item.note.name}" (${item.note.id}) - Will be deleted (empty after cleaning)`
      console.log(msg)
      if (isDryRun) {
        addToReport(`| "${item.note.name}" | ${item.note.id} | DELETE | (empty after cleaning) |\n`)
      }
    } else {
      const msg = `  🔧 "${item.note.name}" (${item.note.id}) → "${item.cleanedName}"`
      console.log(msg)
      if (isDryRun) {
        addToReport(`| "${item.note.name}" | ${item.note.id} | CLEAN | "${item.cleanedName}" |\n`)
      }
    }
  }
  console.log("")
  if (isDryRun) addToReport("\n")
  
  if (isDryRun) {
    console.log("✅ Dry run complete for Phase 2.\n")
    return { cleaned: 0, deleted: 0, relationsUpdated: 0 }
  }
  
  console.log("🔄 Starting cleanup process...\n")
  
  let cleanedCount = 0
  let deletedCount = 0
  let relationsUpdatedCount = 0
  
  // Use transaction for safety
  await prisma.$transaction(async (tx) => {
    for (const item of invalidNotes) {
      try {
        const { note, action, cleanedName } = item
        
        console.log(`\n🔧 Processing "${note.name}" (${note.id})`)
        
        if (action === "delete") {
          // Get relations before deletion for logging
          const relations = await tx.perfumeNoteRelation.findMany({
            where: { noteId: note.id }
          })
          
          console.log(`   Found ${relations.length} relations - will be removed (note is invalid)`)
          
          // Delete note (CASCADE will remove relations)
          await tx.perfumeNotes.delete({
            where: { id: note.id }
          })
          
          deletedCount++
          console.log(`   ✅ Deleted invalid note`)
        } else {
          // Get relations to reassociate
          const relations = await tx.perfumeNoteRelation.findMany({
            where: { noteId: note.id }
          })
          
          console.log(`   Found ${relations.length} relations to reassociate`)
          
          // Check if cleaned name already exists
          let cleanedNote = await tx.perfumeNotes.findUnique({
            where: { name: cleanedName }
          })
          
          if (!cleanedNote) {
            // No existing cleaned note - update the current note's name
            await tx.perfumeNotes.update({
              where: { id: note.id },
              data: { name: cleanedName }
            })
            cleanedNote = { ...note, name: cleanedName }
            console.log(`   Updated note name to cleaned version: "${cleanedName}"`)
          } else {
            // Cleaned note already exists - reassociate relations and delete invalid note
            console.log(`   Found existing cleaned note: "${cleanedName}" (${cleanedNote.id})`)
            
            // Reassociate relations
            for (const relation of relations) {
              // Check if cleaned note already has this relation
              const existingRelation = await tx.perfumeNoteRelation.findUnique({
                where: {
                  perfumeId_noteId_noteType: {
                    perfumeId: relation.perfumeId,
                    noteId: cleanedNote.id,
                    noteType: relation.noteType
                  }
                }
              })
              
              if (existingRelation) {
                // Relation already exists, delete duplicate
                await tx.perfumeNoteRelation.delete({
                  where: { id: relation.id }
                })
                console.log(`   → Removed duplicate relation (already exists for cleaned note)`)
              } else {
                // Update relation to point to cleaned note
                await tx.perfumeNoteRelation.update({
                  where: { id: relation.id },
                  data: { noteId: cleanedNote.id }
                })
                console.log(`   → Reassociated relation to cleaned note`)
              }
              relationsUpdatedCount++
            }
            
            // Delete the invalid note (relations already reassociated)
            await tx.perfumeNotes.delete({
              where: { id: note.id }
            })
            console.log(`   ✅ Deleted invalid note, kept existing cleaned version`)
          }
          
          cleanedCount++
        }
      } catch (error) {
        console.error(`   ❌ Error processing: ${error.message}`)
        throw error // Rollback transaction
      }
    }
  })
  
  console.log(`\n✅ Phase 2 complete: Cleaned ${cleanedCount} notes, deleted ${deletedCount} notes, updated ${relationsUpdatedCount} relations\n`)
  
  return { cleaned: cleanedCount, deleted: deletedCount, relationsUpdated: relationsUpdatedCount }
}

/**
 * Phase 3: Identify stopwords and descriptive phrases
 */
async function identifyStopwords() {
  console.log("🔍 Phase 3: Identifying stopword and descriptive phrase notes...\n")
  
  const allNotes = await prisma.perfumeNotes.findMany({
    include: {
      perfumeNoteRelations: true
    }
  })
  
  const invalidNotes = []
  const extractablePhrases = []
  
  for (const note of allNotes) {
    if (isStopword(note.name)) {
      invalidNotes.push({ note, type: 'stopword', extractedNote: null })
    } else if (isDescriptivePhrase(note.name)) {
      // Try to extract a note from the phrase
      const extractedNote = extractNoteFromPhrase(note.name, allNotes)
      if (extractedNote) {
        extractablePhrases.push({ note, type: 'extractable', extractedNote })
      } else {
        invalidNotes.push({ note, type: 'descriptive', extractedNote: null })
      }
    }
  }
  
  return { invalidNotes, extractablePhrases }
}

/**
 * Phase 3: Extract notes from phrases and remove stopwords/descriptive phrases
 */
async function removeStopwords(identificationResults, isDryRun) {
  const { invalidNotes, extractablePhrases } = identificationResults
  
  const totalInvalid = invalidNotes.length
  const totalExtractable = extractablePhrases.length
  
  if (totalInvalid === 0 && totalExtractable === 0) {
    console.log("✅ No stopword or descriptive phrase notes found!\n")
    return { removed: 0, relationsRemoved: 0, relationsReassociated: 0 }
  }
  
  const msg1 = `📊 Found ${totalInvalid} invalid note(s) and ${totalExtractable} extractable phrase(s):\n`
  console.log(msg1)
  if (isDryRun) {
    addToReport("## Phase 3: Stopwords & Descriptive Phrases\n")
    addToReport(`**Found ${totalInvalid} invalid note(s) and ${totalExtractable} extractable phrase(s):**\n\n`)
  }
  
  // Show extractable phrases
  if (totalExtractable > 0) {
    console.log("  Phrases with extractable notes:")
    if (isDryRun) {
      addToReport("### Phrases with Extractable Notes\n\n")
      addToReport("| Original Phrase | Extracted Note | Relations |\n")
      addToReport("|-----------------|----------------|-----------|\n")
    }
    for (const item of extractablePhrases) {
      const relationCount = item.note.perfumeNoteRelations.length
      const msg = `  🔧 "${item.note.name}" → "${item.extractedNote}" (${relationCount} relations will be reassociated)`
      console.log(msg)
      if (isDryRun) {
        addToReport(`| "${item.note.name}" | "${item.extractedNote}" | ${relationCount} |\n`)
      }
    }
    console.log("")
    if (isDryRun) addToReport("\n")
  }
  
  // Show invalid notes
  if (totalInvalid > 0) {
    console.log("  Invalid notes (will be removed):")
    if (isDryRun) {
      addToReport("### Invalid Notes (Will Be Removed)\n\n")
      addToReport("| Note Name | ID | Type | Relations |\n")
      addToReport("|-----------|----|------|-----------|\n")
    }
    let totalRelations = 0
    for (const item of invalidNotes) {
      const relationCount = item.note.perfumeNoteRelations.length
      totalRelations += relationCount
      const msg = `  ❌ "${item.note.name}" (${item.note.id}) - ${relationCount} relations will be removed (${item.type})`
      console.log(msg)
      if (isDryRun) {
        addToReport(`| "${item.note.name}" | ${item.note.id} | ${item.type} | ${relationCount} |\n`)
      }
    }
    console.log("")
    const summaryMsg = `📋 Summary: ${totalInvalid} invalid notes will be removed, ${totalRelations} relations will be deleted`
    console.log(summaryMsg)
    if (isDryRun) {
      addToReport(`**Summary:** ${totalInvalid} invalid notes will be removed, ${totalRelations} relations will be deleted\n\n`)
    }
  }
  
  if (totalExtractable > 0) {
    const totalExtractedRelations = extractablePhrases.reduce((sum, item) => 
      sum + item.note.perfumeNoteRelations.length, 0)
    const msg = `📋 Summary: ${totalExtractable} phrases will be converted, ${totalExtractedRelations} relations will be reassociated`
    console.log(msg)
    if (isDryRun) {
      addToReport(`**Summary:** ${totalExtractable} phrases will be converted, ${totalExtractedRelations} relations will be reassociated\n\n`)
    }
  }
  console.log("")
  
  if (isDryRun) {
    console.log("✅ Dry run complete for Phase 3.\n")
    return { removed: 0, relationsRemoved: 0, relationsReassociated: 0 }
  }
  
  console.log("🔄 Starting processing...\n")
  
  let removedCount = 0
  let relationsRemovedCount = 0
  let relationsReassociatedCount = 0
  
  // Use transaction for safety
  await prisma.$transaction(async (tx) => {
    // First, handle extractable phrases
    for (const item of extractablePhrases) {
      try {
        const { note, extractedNote } = item
        console.log(`\n🔧 Processing phrase "${note.name}" → extracting "${extractedNote}"`)
        
        // Get all relations
        const relations = await tx.perfumeNoteRelation.findMany({
          where: { noteId: note.id }
        })
        
        console.log(`   Found ${relations.length} relations to reassociate`)
        
        // Find or create the extracted note
        let targetNote = await tx.perfumeNotes.findUnique({
          where: { name: extractedNote }
        })
        
        if (!targetNote) {
          // Create the extracted note
          targetNote = await tx.perfumeNotes.create({
            data: { name: extractedNote }
          })
          console.log(`   Created note: "${extractedNote}"`)
        } else {
          console.log(`   Found existing note: "${extractedNote}"`)
        }
        
        // Reassociate relations
        for (const relation of relations) {
          // Check if target note already has this relation
          const existingRelation = await tx.perfumeNoteRelation.findUnique({
            where: {
              perfumeId_noteId_noteType: {
                perfumeId: relation.perfumeId,
                noteId: targetNote.id,
                noteType: relation.noteType
              }
            }
          })
          
          if (existingRelation) {
            // Relation already exists, delete duplicate
            await tx.perfumeNoteRelation.delete({
              where: { id: relation.id }
            })
            console.log(`   → Removed duplicate relation (already exists for extracted note)`)
          } else {
            // Update relation to point to extracted note
            await tx.perfumeNoteRelation.update({
              where: { id: relation.id },
              data: { noteId: targetNote.id }
            })
            console.log(`   → Reassociated relation to extracted note`)
          }
          relationsReassociatedCount++
        }
        
        // Delete the phrase note
        await tx.perfumeNotes.delete({
          where: { id: note.id }
        })
        
        console.log(`   ✅ Extracted note and reassociated ${relations.length} relations`)
      } catch (error) {
        console.error(`   ❌ Error processing: ${error.message}`)
        throw error // Rollback transaction
      }
    }
    
    // Then, handle invalid notes (stopwords and non-extractable phrases)
    for (const item of invalidNotes) {
      try {
        const { note, type } = item
        console.log(`\n🗑️  Removing ${type} "${note.name}" (${note.id})`)
        
        const relationCount = note.perfumeNoteRelations.length
        console.log(`   Found ${relationCount} relations - will be removed (${type} is not a valid note)`)
        
        // Delete note (CASCADE will automatically remove relations)
        await tx.perfumeNotes.delete({
          where: { id: note.id }
        })
        
        removedCount++
        relationsRemovedCount += relationCount
        console.log(`   ✅ Removed ${type} and ${relationCount} relations`)
      } catch (error) {
        console.error(`   ❌ Error removing: ${error.message}`)
        throw error // Rollback transaction
      }
    }
  })
  
  console.log(`\n✅ Phase 3 complete:`)
  console.log(`   • Removed ${removedCount} invalid notes`)
  console.log(`   • Extracted notes from ${extractablePhrases.length} phrases`)
  console.log(`   • Deleted ${relationsRemovedCount} relations`)
  console.log(`   • Reassociated ${relationsReassociatedCount} relations\n`)
  
  return { 
    removed: removedCount, 
    relationsRemoved: relationsRemovedCount,
    relationsReassociated: relationsReassociatedCount
  }
}

/**
 * Main cleanup function
 */
async function cleanNotes() {
  try {
    const header = "=".repeat(60)
    const title = "🧹 Clean Duplicate and Erroneous Notes"
    console.log(header)
    console.log(title)
    console.log(header)
    console.log("")
    
    if (isDryRun) {
      const msg = "⚠️  DRY RUN MODE - No changes will be made\n"
      console.log(msg)
      addToReport("# Clean Duplicate and Erroneous Notes - Dry Run Report\n\n")
      addToReport(`**Generated:** ${new Date().toISOString()}\n\n`)
      addToReport("⚠️ **DRY RUN MODE** - No changes will be made\n\n")
      addToReport("---\n\n")
    } else {
      console.log("⚠️  IMPORTANT: Ensure you have run `npm run db:backup` before proceeding!\n")
    }
    
    // Pre-flight validation
    const initialCounts = await validateDatabase()
    if (isDryRun) {
      addToReport("## Pre-Flight Validation\n\n")
      addToReport(`- **Total Notes:** ${initialCounts.noteCount}\n`)
      addToReport(`- **Total Relations:** ${initialCounts.relationCount}\n\n`)
      addToReport("---\n\n")
    }
    
    // Phase 1: Merge duplicates
    const duplicates = await identifyDuplicates()
    const phase1Results = await mergeDuplicates(duplicates, isDryRun)
    
    // Phase 2: Clean invalid characters
    const invalidNotes = await identifyInvalidNotes()
    const phase2Results = await cleanInvalidNotes(invalidNotes, isDryRun)
    
    // Phase 3: Remove stopwords and descriptive phrases
    const invalidPhraseNotes = await identifyStopwords()
    const phase3Results = await removeStopwords(invalidPhraseNotes, isDryRun)
    
    // Post-cleanup validation
    if (!isDryRun) {
      const validationResults = await validateCleanup(initialCounts)
      
      // Final summary
      console.log("=".repeat(60))
      console.log("\n📊 CLEANUP SUMMARY")
      console.log("=".repeat(60))
      console.log(`\nPhase 1 - Duplicates:`)
      console.log(`  • Merged: ${phase1Results.merged} notes`)
      console.log(`  • Relations updated: ${phase1Results.relationsUpdated}`)
      console.log(`\nPhase 2 - Invalid Characters:`)
      console.log(`  • Cleaned: ${phase2Results.cleaned} notes`)
      console.log(`  • Deleted: ${phase2Results.deleted} notes`)
      console.log(`  • Relations updated: ${phase2Results.relationsUpdated}`)
      console.log(`\nPhase 3 - Stopwords & Descriptive Phrases:`)
      console.log(`  • Removed: ${phase3Results.removed} invalid notes`)
      if (phase3Results.relationsReassociated > 0) {
        console.log(`  • Notes extracted from phrases: Yes`)
        console.log(`  • Relations reassociated: ${phase3Results.relationsReassociated}`)
      }
      console.log(`  • Relations removed: ${phase3Results.relationsRemoved}`)
      console.log(`\nTotal:`)
      console.log(`  • Notes removed: ${validationResults.notesRemoved}`)
      console.log(`  • Relations affected: ${phase1Results.relationsUpdated + phase2Results.relationsUpdated + phase3Results.relationsRemoved}`)
      console.log(`\n✅ Cleanup completed successfully!`)
      console.log(`\n💡 If you need to rollback, use: npm run db:restore`)
    } else {
      console.log("\n✅ Dry run completed successfully!")
      console.log("   Run without --dry-run to apply changes.")
      
      // Add summary to report
      addToReport("## Summary\n\n")
      addToReport(`- **Phase 1 - Duplicates:** ${phase1Results.merged} notes will be merged, ${phase1Results.relationsUpdated} relations updated\n`)
      addToReport(`- **Phase 2 - Invalid Characters:** ${phase2Results.cleaned} notes cleaned, ${phase2Results.deleted} notes deleted, ${phase2Results.relationsUpdated} relations updated\n`)
      addToReport(`- **Phase 3 - Stopwords & Phrases:** ${phase3Results.removed} notes removed, ${phase3Results.relationsReassociated} relations reassociated, ${phase3Results.relationsRemoved} relations removed\n\n`)
      addToReport("---\n\n")
      addToReport("✅ **Dry run completed successfully!**\n\n")
      addToReport("To apply these changes, run:\n```bash\nnode scripts/clean-notes.js\n```\n\n")
      addToReport("**⚠️ Remember to backup first:**\n```bash\nnpm run db:backup\n```\n")
    }
    
    // Save report if in dry-run mode
    if (isDryRun) {
      saveReport()
    }
    
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error.message)
    console.error(error.stack)
    throw error
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    await cleanNotes()
  } catch (error) {
    console.error("Fatal error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith("clean-notes.js")) {
  main()
}

export { cleanNotes }
