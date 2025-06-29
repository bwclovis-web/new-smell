#!/usr/bin/env node
/* eslint-disable */

/**
 * Simple cron job script to process wishlist notifications
 * 
 * This script can be run as a scheduled task 
 * (e.g., via cron on Linux/Mac or Task Scheduler on Windows)
 * 
 * Usage:
 * node scripts/process-notifications.js
 * 
 * Example cron entry to run every hour:
 * 0 * * * * cd /path/to/your/project && node scripts/process-notifications.js
 * 
 * Example Windows Task Scheduler:
 * Program: node.exe
 * Arguments: C:\path\to\your\project\scripts\process-notifications.js
 * Start in: C:\path\to\your\project
 */

const API_BASE_URL = process.env.APP_URL || 'http://localhost:2112'

async function processNotifications() {
  try {
    console.log(`[${new Date().toISOString()}] Starting notification processing...`)
    
    const response = await fetch(`${API_BASE_URL}/api/process-wishlist-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      console.log(`[${new Date().toISOString()}] Successfully processed ${data.processed} notifications`)
      
      if (data.processed > 0) {
        console.log('Notifications sent for:')
        data.notifications.forEach((notification, index) => {
          console.log(`  ${index + 1}. ${notification.perfumeName} (user: ${notification.userId})`)
        })
      }
    } else {
      console.error(`[${new Date().toISOString()}] Error: ${data.error}`)
      process.exit(1)
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to process notifications:`, error.message)
    process.exit(1)
  }
}

// Check if we have fetch available
if (typeof fetch === 'undefined') {
  console.error(`[${new Date().toISOString()}] Error: fetch is not available. Please use Node.js 18+ or install node-fetch.`)
  process.exit(1)
}

// Run the script
processNotifications()
  .then(() => {
    console.log(`[${new Date().toISOString()}] Notification processing completed successfully`)
    process.exit(0)
  })
  .catch((error) => {
    console.error(`[${new Date().toISOString()}] Notification processing failed:`, error)
    process.exit(1)
  })
