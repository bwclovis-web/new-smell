import { exec } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

// Note: Compression is handled by Express middleware
// The compression utility is for future use with native Response objects

const execAsync = promisify(exec)

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..', '..', '..')

// Get the most recent report timestamp
const getLatestReportTimestamp = async (): Promise<string | null> => {
  try {
    const reportsDir = path.resolve(projectRoot, 'docs', 'reports')
    const allFiles = await fs.readdir(reportsDir)

    // Find the most recent report file
    const timestampedFiles = allFiles
      .filter(file => file.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/))
      .map(file => {
        const match = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/)
        return match ? match[1] : null
      })
      .filter(Boolean)
      .sort()
      .reverse()

    return timestampedFiles.length > 0 ? timestampedFiles[0] : null
  } catch {
    return null
  }
}

// Check if we need to regenerate reports (avoid too frequent generation)
const shouldRegenerateReports = async (): Promise<boolean> => {
  const latestTimestamp = await getLatestReportTimestamp()

  if (!latestTimestamp) {
    console.log('[DATA QUALITY API] No reports exist, should regenerate')
    return true // No reports exist, should generate
  }

  // Get the most recent timestamp and check if it's older than 10 minutes
  const latestDate = new Date(latestTimestamp)
  const now = new Date()
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)

  const shouldRegenerate = latestDate < tenMinutesAgo
  console.log('[DATA QUALITY API] Latest report:', latestTimestamp, 'Should regenerate:', shouldRegenerate)

  return shouldRegenerate
}

// Execute the actual script generation
const executeScriptGeneration = async (lockFilePath: string) => {
  try {
    // Create lock file
    await fs.writeFile(lockFilePath, new Date().toISOString())

    const scriptPath = path.resolve(
      projectRoot,
      'scripts',
      'generate_data_quality_reports.js'
    )
    // Execute the script
    await execAsync(`node "${scriptPath}"`)
    return true
  } finally {
    // Always remove lock file, even if script fails
    await fs.unlink(lockFilePath).catch(() => {
      // Ignore errors when removing lock file
    })
  }
}

// Run the data quality report generation script
const runDataQualityScript = async () => {
  try {
    // Check if we should regenerate reports
    if (!await shouldRegenerateReports()) {
      return true // Skip generation, use existing reports
    }

    // Create a lock file to prevent multiple simultaneous script runs
    const lockFilePath = path.resolve(projectRoot, 'docs', 'reports', '.generating.lock')

    // Check if lock file exists (another generation is in progress)
    if (await fileExists(lockFilePath)) {
      return true // Skip generation, another process is running
    }

    return await executeScriptGeneration(lockFilePath)
  } catch (error) {
    // Return the error for handling
    return error
  }
}

// Get file information filtered by timeframe
const getFilteredFiles = (
  allFiles: string[],
  timeframe: string
): TimestampedFile[] => {
  // Convert files to timestamped file info objects
  const timestampedFiles = allFiles
    .filter(file => file.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/))
    .map(file => {
      const match = file.match(/(\d{4}-\d{2}-\d{2})T\d{2}-\d{2}-\d{2}-\d{3}Z/)
      return {
        filename: file,
        timestamp: match ? match[0] : '',
        date: match ? new Date(match[1]) : new Date(0)
      }
    })
    .filter(file => file.timestamp)
    .sort((fileA, fileB) => {
      // Split the sort to make it fit within line length limit
      const dateA = new Date(fileA.timestamp).getTime()
      const dateB = new Date(fileB.timestamp).getTime()
      return dateB - dateA
    })

  // Apply timeframe filtering
  if (timeframe === 'week') {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return timestampedFiles.filter(file => file.date >= oneWeekAgo)
  } else if (timeframe === 'month') {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return timestampedFiles.filter(file => file.date >= oneMonthAgo)
  }

  return timestampedFiles
}

// Get the latest report files, optionally filtered by timeframe
const getLatestReportFiles = async (timeframe: string = 'all') => {
  const reportsDir = path.resolve(projectRoot, 'docs', 'reports')

  // Read all files in the reports directory
  const allFiles = await fs.readdir(reportsDir)

  // Get files filtered by timeframe
  const filteredFiles = getFilteredFiles(allFiles, timeframe)

  // If no files match the timeframe, fall back to all files (most recent)
  let filesToUse = filteredFiles
  if (filteredFiles.length === 0) {
    console.log(`No reports found for timeframe: ${timeframe}, falling back to most recent reports`)
    // Get all timestamped files and use the most recent ones
    const allTimestampedFiles = allFiles
      .filter(file => file.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/))
      .map(file => {
        const match = file.match(/(\d{4}-\d{2}-\d{2})T\d{2}-\d{2}-\d{2}-\d{3}Z/)
        return {
          filename: file,
          timestamp: match ? match[0] : '',
          date: match ? new Date(match[1]) : new Date(0)
        }
      })
      .filter(file => file.timestamp)
      .sort((fileA, fileB) => {
        const dateA = new Date(fileA.timestamp).getTime()
        const dateB = new Date(fileB.timestamp).getTime()
        return dateB - dateA
      })

    filesToUse = allTimestampedFiles
  }

  // Get the latest timestamp
  const latestTimestamp = filesToUse[0].timestamp

  // Extract all unique dates for history and sort them
  const dateStrings = filesToUse.map(file => file.date.toISOString().split('T')[0])
  const uniqueDates = [...new Set(dateStrings)].sort()

  // Get paths for report types
  return {
    missingJsonPath: path.join(reportsDir, `missing_info_${latestTimestamp}.json`),
    duplicatesPath: path.join(reportsDir, `duplicates_${latestTimestamp}.md`),
    housesNoPerfsPath: path.join(reportsDir, `houses_no_perfumes_${latestTimestamp}.json`),
    historyDates: uniqueDates,
    allReports: filesToUse.map(file => ({
      date: file.date.toISOString().split('T')[0],
      missing: path.join(reportsDir, `missing_info_${file.timestamp}.json`),
      duplicates: path.join(reportsDir, `duplicates_${file.timestamp}.md`),
      housesNoPerfumes: path.join(reportsDir, `houses_no_perfumes_${file.timestamp}.json`)
    }))
  }
}

// Parse missing data from JSON file
const parseMissingData = async (filePath: string) => {
  const data = await fs.readFile(filePath, 'utf-8')
  const missingData = JSON.parse(data)

  // Process missing data by brand
  const missingByBrand: Record<string, number> = {}
  missingData.forEach((item: { brand: string }) => {
    const brand = item.brand
    if (!missingByBrand[brand]) {
      missingByBrand[brand] = 0
    }
    missingByBrand[brand]++
  })

  // --- Perfume House missing info logic ---
  // Query PerfumeHouse from Prisma and check for missing fields
  const { prisma } = await import('../../db.server')
  const houses = await prisma.perfumeHouse.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      description: true,
      founded: true,
      website: true,
    },
    take: 1000 // Limit to prevent large responses
  })
  const missingHouseInfoByBrand: Record<string, number> = {}
  let totalMissingHouseInfo = 0
  houses.forEach(house => {
    let missingFields = 0
    if (!house.image) {
      missingFields++
    }
    if (!house.description) {
      missingFields++
    }
    if (!house.founded) {
      missingFields++
    }
    if (!house.website) {
      missingFields++
    }
    if (missingFields > 0) {
      missingHouseInfoByBrand[house.name] = missingFields
      totalMissingHouseInfo++
    }
  })

  return {
    totalMissing: missingData.length,
    missingByBrand,
    totalMissingHouseInfo,
    missingHouseInfoByBrand,
  }
}

// Extract the total duplicates from markdown content
const extractDuplicatesTotal = (data: string) => {
  const pattern = /Total perfumes with duplicate entries: \*\*(\d+)\*\*/
  const duplicatesMatch = data.match(pattern)
  return duplicatesMatch ? parseInt(duplicatesMatch[1], 10) : 0
}

// Extract duplicates by brand from markdown content
const extractDuplicatesByBrand = (data: string) => {
  const duplicatesByBrand: Record<string, number> = {}
  const fileBreakdownRegex = /\| perfumes_([a-z0-9_]+)\.csv \| (\d+) \|/g
  let match
  while ((match = fileBreakdownRegex.exec(data)) !== null) {
    const brand = match[1].replace('_updated', '').replace('_fixed', '')
    const count = parseInt(match[2], 10)
    duplicatesByBrand[brand] = count
  }
  return duplicatesByBrand
}

// Parse duplicates from markdown file
const parseDuplicatesData = async (filePath: string) => {
  const data = await fs.readFile(filePath, 'utf-8')

  // Parse the report
  const totalDuplicates = extractDuplicatesTotal(data)
  const duplicatesByBrand = extractDuplicatesByBrand(data)

  return {
    totalDuplicates,
    duplicatesByBrand,
  }
}

// Parse houses with no perfumes from JSON file
const parseHousesNoPerfumesData = async (filePath: string) => {
  try {
    // Check if file exists first
    if (!await fileExists(filePath)) {
      return {
        totalHousesNoPerfumes: 0,
        housesNoPerfumes: []
      }
    }

    const data = await fs.readFile(filePath, 'utf-8')
    const housesData = JSON.parse(data)

    return {
      totalHousesNoPerfumes: housesData.length,
      housesNoPerfumes: housesData
    }
  } catch (error) {
    console.error('Error parsing houses with no perfumes:', error)
    return {
      totalHousesNoPerfumes: 0,
      housesNoPerfumes: []
    }
  }
}

// Process history data to extract trends
// Define types for the report data
type TimestampedFile = {
  filename: string
  timestamp: string
  date: Date
}

interface ReportInfo {
  date: string
  missing: string
  duplicates: string
  housesNoPerfumes: string
}

interface HistoryData {
  dates: string[]
  missing: number[]
  duplicates: number[]
}

// Process missing data for a report
const processMissingData = async (
  report: ReportInfo,
  historyData: HistoryData
): Promise<void> => {
  // Get missing count - skip if file doesn't exist
  if (await fileExists(report.missing)) {
    const missingData = await fs.readFile(report.missing, 'utf-8')
    const missingJson = JSON.parse(missingData)
    historyData.missing.push(missingJson.length)
  } else {
    // Use 0 as placeholder if the file doesn't exist
    historyData.missing.push(0)
  }
}

// Process duplicates data for a report
const processDuplicatesData = async (
  report: ReportInfo,
  historyData: HistoryData
): Promise<void> => {
  // Get duplicates count - skip if file doesn't exist
  if (await fileExists(report.duplicates)) {
    const duplicatesData = await fs.readFile(report.duplicates, 'utf-8')
    const matchPattern = /Total perfumes with duplicate entries: \*\*(\d+)\*\*/
    const match = duplicatesData.match(matchPattern)
    const count = match ? parseInt(match[1], 10) : 0
    historyData.duplicates.push(count)
  } else {
    // Use 0 as placeholder if the file doesn't exist
    historyData.duplicates.push(0)
  }
}

// Process historical report data to extract trends
const processHistoryData = async (reports: ReportInfo[]): Promise<HistoryData> => {
  const historyData: HistoryData = {
    dates: [],
    missing: [],
    duplicates: []
  }

  // Process report batches to avoid complexity issues
  const processReportBatch = async (report: ReportInfo) => {
    try {
      // Extract date
      historyData.dates.push(report.date)

      // Process missing and duplicates data
      await processMissingData(report, historyData)
      await processDuplicatesData(report, historyData)
    } catch {
      // Skip failed reports but continue processing others
      // Add placeholder values to maintain array length consistency
      historyData.missing.push(0)
      historyData.duplicates.push(0)
    }
  }

  // Process each report
  for (const report of reports) {
    await processReportBatch(report)
  }

  return historyData
}

export const loader = async ({ request }: { request: Request }) => {
  // Extract timeframe from request query parameters
  const url = new URL(request.url)
  const timeframe = url.searchParams.get('timeframe') || 'month'

  try {
    // Generate and process reports
    const reportData = await generateDataQualityReport(timeframe)

    // Return the data using the pattern that works
    return new Response(JSON.stringify(reportData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minute cache
      }
    })
  } catch (error) {
    // Log the full error for debugging
    console.error('[DATA QUALITY API] Error caught in loader:', error)
    console.error('[DATA QUALITY API] Error stack:', error instanceof Error ? error.stack : 'No stack')

    // Return error response
    return new Response(
      JSON.stringify({
        error: `Critical error processing request: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Function to validate report files exist
const validateReportFiles = async (
  missingPath: string,
  duplicatesPath: string
): Promise<void> => {
  // Verify files exist before trying to parse them
  if (!await fileExists(missingPath)) {
    throw new Error(`Missing data file not found: ${missingPath}`)
  }

  if (!await fileExists(duplicatesPath)) {
    throw new Error(`Duplicates file not found: ${duplicatesPath}`)
  }
}

// Function to retrieve and parse all report data
const collectReportData = async (
  missingPath: string,
  duplicatesPath: string,
  housesNoPerfsPath: string,
  allReports: ReportInfo[]
) => {
  console.log('[DATA QUALITY API] Parsing missing data from:', missingPath)
  // Parse the report files
  const {
    totalMissing,
    missingByBrand,
    totalMissingHouseInfo,
    missingHouseInfoByBrand
  } = await parseMissingData(missingPath)

  console.log('[DATA QUALITY API] Missing data parsed:', { totalMissing, totalMissingHouseInfo })

  console.log('[DATA QUALITY API] Parsing duplicates from:', duplicatesPath)
  const { totalDuplicates, duplicatesByBrand } =
    await parseDuplicatesData(duplicatesPath)

  console.log('[DATA QUALITY API] Duplicates parsed:', { totalDuplicates })

  console.log('[DATA QUALITY API] Parsing houses with no perfumes from:', housesNoPerfsPath)
  const { totalHousesNoPerfumes, housesNoPerfumes } =
    await parseHousesNoPerfumesData(housesNoPerfsPath)

  console.log('[DATA QUALITY API] Houses with no perfumes parsed:', {
    totalHousesNoPerfumes,
    housesNoPerfumesArrayLength: housesNoPerfumes?.length || 0,
    firstHouse: housesNoPerfumes?.[0]
  })

  // Process historical data for trends
  const historyData = await processHistoryData(allReports)

  const result = {
    totalMissing,
    totalDuplicates,
    totalHousesNoPerfumes,
    missingByBrand,
    duplicatesByBrand,
    housesNoPerfumes,
    historyData,
    totalMissingHouseInfo,
    missingHouseInfoByBrand,
  }

  console.log('[DATA QUALITY API] Final collected data:', {
    totalMissing: result.totalMissing,
    totalDuplicates: result.totalDuplicates,
    totalHousesNoPerfumes: result.totalHousesNoPerfumes,
    housesNoPerfumesInResult: result.housesNoPerfumes?.length || 0
  })

  return result
}

// Handle report generation and processing
const generateDataQualityReport = async (timeframe: string) => {
  try {
    console.log('[DATA QUALITY API] Step 1: Running data quality script...')
    // Run the data quality report generation script
    const scriptResult = await runDataQualityScript()
    console.log('[DATA QUALITY API] Script result:', scriptResult)

    // If there was an error running the script
    if (scriptResult !== true) {
      console.error('[DATA QUALITY API] Script failed:', scriptResult)
      throw new Error(`Failed to generate data quality reports: ${scriptResult}`)
    }

    console.log('[DATA QUALITY API] Step 2: Getting latest report files...')
    // Get the paths to the latest report files based on timeframe
    const { missingJsonPath, duplicatesPath, housesNoPerfsPath, allReports } =
      await getLatestReportFiles(timeframe)

    console.log('[DATA QUALITY API] Report paths:', {
      missingJsonPath,
      duplicatesPath,
      housesNoPerfsPath
    })

    console.log('[DATA QUALITY API] Step 3: Validating report files...')
    // Validate report files
    await validateReportFiles(missingJsonPath, duplicatesPath)

    console.log('[DATA QUALITY API] Step 4: Collecting report data...')
    // Collect and process the report data
    const reportData = await collectReportData(
      missingJsonPath,
      duplicatesPath,
      housesNoPerfsPath,
      allReports
    )

    console.log('[DATA QUALITY API] Step 5: Report data collected, keys:', Object.keys(reportData))

    // Return the combined data object (not Response)
    const result = {
      ...reportData,
      lastUpdated: new Date().toLocaleString(),
    }

    console.log('[DATA QUALITY API] Step 6: Returning result with keys:', Object.keys(result))
    return result
  } catch (error) {
    console.error('[DATA QUALITY API] Error in generateDataQualityReport:', error)
    throw error
  }
}

// Helper function to check if a file exists
const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
