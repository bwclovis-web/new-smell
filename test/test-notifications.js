/* eslint-disable */
// Simple test script to verify the notification system works
// Run with: node test-notifications.js

import { processWishlistNotifications } from "../app/utils/wishlist-notification-processor.js"

async function testNotifications() {
  try {
    console.log("Testing wishlist notification processing...")

    const results = await processWishlistNotifications()

    console.log(`✅ Test completed successfully!`)
    console.log(`📊 Processed ${results.length} notifications`)

    if (results.length > 0) {
      console.log("\n📋 Notification details:")
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.perfumeName}`)
        console.log(`     User: ${result.userId}`)
        console.log(`     Sellers: ${result.sellers.map((s) => s.email).join(", ")}`)
      })
    } else {
      console.log("ℹ️  No pending notifications found")
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    console.error(error.stack)
  }
}

testNotifications()
