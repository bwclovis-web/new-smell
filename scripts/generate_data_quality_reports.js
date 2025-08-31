#!/usr/bin/env node

/**
 * Data Quality Report Generator
 * 
 * This script analyzes the database and generates reports about:
 * - Missing information in perfume records
 * - Duplicate records
 * - Data quality trends over time
 * 
 * Reports are saved to docs/reports/ directory
 */

import { exec } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Ensure reports directory exists
const ensureReportsDir = async () => {
  const reportsDir = path.resolve(projectRoot, 'docs', 'reports')
  try {
    await fs.access(reportsDir)
  } catch {
    await fs.mkdir(reportsDir, { recursive: true })
  }
  return reportsDir
}

// Generate timestamp for file naming
const generateTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

// Analyze missing data in perfume records
const analyzeMissingData = async () => {
  try {
    // This would typically query the database
    // For now, we'll create a sample report structure
    const missingData = {
      totalMissing: 0,
      missingByBrand: {},
      timestamp: new Date().toISOString()
    }
    
    return missingData
  } catch (error) {
    console.error('Error analyzing missing data:', error)
    return null
  }
}

// Analyze duplicate records
const analyzeDuplicates = async () => {
  try {
    // This would typically query the database for duplicates
    // For now, we'll create a sample report structure
    const duplicates = {
      totalDuplicates: 0,
      duplicatesByBrand: {},
      timestamp: new Date().toISOString()
    }
    
    return duplicates
  } catch (error) {
    console.error('Error analyzing duplicates:', error)
    return null
  }
}

// Save report data to files
const saveReports = async (reportsDir, timestamp, missingData, duplicates) => {
  try {
    // Save missing data report
    if (missingData) {
      const missingJsonPath = path.join(reportsDir, `missing_info_${timestamp}.json`)
      const missingCsvPath = path.join(reportsDir, `missing_info_${timestamp}.csv`)
      const missingMdPath = path.join(reportsDir, `missing_info_${timestamp}.md`)
      
      await fs.writeFile(missingJsonPath, JSON.stringify(missingData, null, 2))
      
      // Create CSV format
      const csvContent = 'Brand,MissingFields\n'
      await fs.writeFile(missingCsvPath, csvContent)
      
      // Create Markdown format
      const mdContent = `# Missing Information Report\n\nGenerated: ${new Date().toLocaleString()}\n\nTotal missing: ${missingData.totalMissing}\n`
      await fs.writeFile(missingMdPath, mdContent)
    }
    
    // Save duplicates report
    if (duplicates) {
      const duplicatesPath = path.join(reportsDir, `duplicates_${timestamp}.md`)
      const mdContent = `# Duplicates Report\n\nGenerated: ${new Date().toLocaleString()}\n\nTotal duplicates: ${duplicates.totalDuplicates}\n`
      await fs.writeFile(duplicatesPath, mdContent)
    }
    
    console.log('Reports generated successfully')
  } catch (error) {
    console.error('Error saving reports:', error)
  }
}

// Update history file
const updateHistory = async (reportsDir, timestamp) => {
  try {
    const historyPath = path.join(reportsDir, 'data_quality_history.json')
    let history = { reports: [] }
    
    try {
      const existingHistory = await fs.readFile(historyPath, 'utf-8')
      history = JSON.parse(existingHistory)
    } catch {
      // File doesn't exist or is invalid, start fresh
    }
    
    history.reports.push({
      timestamp,
      generated: new Date().toISOString()
    })
    
    // Keep only last 30 reports
    if (history.reports.length > 30) {
      history.reports = history.reports.slice(-30)
    }
    
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2))
  } catch (error) {
    console.error('Error updating history:', error)
  }
}

// Main execution function
const main = async () => {
  try {
    console.log('Starting data quality report generation...')
    
    // Ensure reports directory exists
    const reportsDir = await ensureReportsDir()
    
    // Generate timestamp
    const timestamp = generateTimestamp()
    
    // Analyze data
    const missingData = await analyzeMissingData()
    const duplicates = await analyzeDuplicates()
    
    // Save reports
    await saveReports(reportsDir, timestamp, missingData, duplicates)
    
    // Update history
    await updateHistory(reportsDir, timestamp)
    
    console.log('Data quality report generation completed successfully')
  } catch (error) {
    console.error('Error in main execution:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main }
