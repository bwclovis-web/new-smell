import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Set paths
const scriptPath = path.resolve(__dirname, '..', 'scraper', 'analyze_perfume_data.py')
const csvDir = path.resolve(__dirname, '..', 'csv')
const reportsDir = path.resolve(__dirname, '..', 'docs', 'reports')
const projectRoot = path.resolve(__dirname, '..')
const parentDir = path.resolve(projectRoot, '..')

// Create reports directory if it doesn't exist
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true })
  console.log(`Created reports directory: ${reportsDir}`)
}

// Generate timestamp for filenames
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

// Generate missing info report (markdown)
const missingInfoPath = path.join(reportsDir, `missing_info_${timestamp}.md`)
console.log('Generating missing info report...')
execSync(`python "${scriptPath}" --export markdown "${missingInfoPath}"`)
console.log(`Missing info report generated: ${missingInfoPath}`)

// Generate duplicates report
// The duplicates report is generated in the parent directory of the project
console.log('Generating duplicates report...')
execSync(`python "${scriptPath}" --duplicates --export`)

// Find the latest duplicate report file 
console.log(`Looking for duplicate files in: ${parentDir}`)

// Check multiple locations for duplicate files
const findDuplicateFiles = directories => {
  for (const dir of directories) {
    try {
      const files = fs.readdirSync(dir)
        .filter(file => file.startsWith('duplicate_perfumes_'))
        .map(file => ({
          path: path.join(dir, file),
          file,
          time: fs.statSync(path.join(dir, file)).mtime.getTime()
        }))
        .sort((fileA, fileB) => fileB.time - fileA.time) // Sort by newest first
      
      if (files.length > 0) {
        return files
      }
    } catch (e) {
      console.log(`Could not read directory ${dir}: ${e.message}`)
    }
  }
  return []
}

const tempDir = path.resolve(projectRoot, 'temp')
const duplicateFiles = findDuplicateFiles([parentDir, tempDir, projectRoot])

console.log(`Found ${duplicateFiles.length} duplicate files`)

if (duplicateFiles.length > 0) {
  const latestDuplicateFile = duplicateFiles[0]
  const sourcePath = latestDuplicateFile.path
  const duplicatesPath = path.join(reportsDir, `duplicates_${timestamp}.md`)
  
  console.log(`Moving ${sourcePath} to ${duplicatesPath}`)
  
  // Move the file to the reports directory
  fs.copyFileSync(sourcePath, duplicatesPath)
  fs.unlinkSync(sourcePath) // Delete the original file
  
  console.log(`Duplicates report generated: ${duplicatesPath}`)
} else {
  console.log('No duplicates report was generated. This might indicate no duplicates were found.')
}

// Generate missing info CSV for potential imports
const missingCsvPath = path.join(reportsDir, `missing_info_${timestamp}.csv`)
console.log('Generating missing info CSV...')
execSync(`python "${scriptPath}" --export csv "${missingCsvPath}"`)
console.log(`Missing info CSV generated: ${missingCsvPath}`)

// Generate missing info JSON for API consumption
const missingJsonPath = path.join(reportsDir, `missing_info_${timestamp}.json`)
console.log('Generating missing info JSON...')
execSync(`python "${scriptPath}" --export json "${missingJsonPath}"`)
console.log(`Missing info JSON generated: ${missingJsonPath}`)

// Generate and update history file
const historyFile = path.join(reportsDir, 'data_quality_history.json')
try {
  // Create or update history file
  let history = []
  if (fs.existsSync(historyFile)) {
    const historyData = fs.readFileSync(historyFile, 'utf-8')
    history = JSON.parse(historyData)
  }
  
  // Read missing data
  const missingData = fs.readFileSync(missingJsonPath, 'utf-8')
  const missingJson = JSON.parse(missingData)
  
  // Read duplicates data
  const duplicatesData = fs.readFileSync(path.join(reportsDir, `duplicates_${timestamp}.md`), 'utf-8')
  const pattern = /Total perfumes with duplicate entries: \*\*(\d+)\*\*/
  const duplicatesMatch = duplicatesData.match(pattern)
  const duplicatesCount = duplicatesMatch ? parseInt(duplicatesMatch[1], 10) : 0
  
  // Add today's data
  const today = new Date().toISOString().split('T')[0]
  history.push({
    date: today,
    missing: missingJson.length,
    duplicates: duplicatesCount
  })
  
  // Keep only unique dates (most recent entry for each date)
  const uniqueDates = {}
  history.forEach(entry => {
    uniqueDates[entry.date] = entry
  })
  
  // Sort by date (oldest to newest)
  const uniqueHistory = Object.values(uniqueDates)
    .sort((itemA, itemB) => new Date(itemA.date).getTime() - new Date(itemB.date).getTime())
  
  // Write updated history
  fs.writeFileSync(historyFile, JSON.stringify(uniqueHistory, null, 2))
  console.log(`History file updated: ${historyFile}`)
} catch (error) {
  console.error('Failed to update history file:', error)
}

console.log('All data quality reports generated successfully!')
