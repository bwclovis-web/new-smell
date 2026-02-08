import type { ActionFunctionArgs } from "react-router"
import DOMPurify from "isomorphic-dompurify"

import { createContactMessage } from "~/models/contactMessage.server"
import { getTraderById } from "~/models/user.server"
import { withAuthenticatedAction } from "~/utils/api-route-helpers.server"
import { createErrorResponse, createSuccessResponse } from "~/utils/response.server"
import { ContactTraderSchema } from "~/utils/formValidationSchemas"
import { validateFormData } from "~/utils/validation"
import { sendTraderContactEmail } from "~/utils/server/email.server"
import { getContactMessageRateLimits, getRateLimitMessages } from "~/utils/server/rate-limit-config.server"
import { validateCSRF } from "~/utils/server/csrf.server"
import { prisma } from "~/db.server"

/**
 * API route for sending trader contact messages
 * 
 * Rate Limits (configurable via environment variables):
 * - CONTACT_MESSAGE_RATE_LIMIT_PER_HOUR: Messages per hour per user (default: 10)
 * - CONTACT_MESSAGE_RATE_LIMIT_PER_DAY_PER_PAIR: Messages per day per trader pair (default: 3)
 */

/**
 * Check if user has exceeded per-user rate limit
 */
async function checkPerUserRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limits = getContactMessageRateLimits()
  const windowStart = new Date(Date.now() - limits.perUser.windowMs)

  const recentMessages = await prisma.traderContactMessage.count({
    where: {
      senderId: userId,
      createdAt: {
        gte: windowStart,
      },
    },
  })

  if (recentMessages >= limits.perUser.max) {
    // Find the oldest message in the window to calculate retry time
    const oldestMessage = await prisma.traderContactMessage.findFirst({
      where: {
        senderId: userId,
        createdAt: {
          gte: windowStart,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        createdAt: true,
      },
    })

    if (oldestMessage) {
      const retryAfter = Math.ceil(
        (limits.perUser.windowMs - (Date.now() - oldestMessage.createdAt.getTime())) / 1000
      )
      return { allowed: false, retryAfter }
    }

    return { allowed: false, retryAfter: Math.ceil(limits.perUser.windowMs / 1000) }
  }

  return { allowed: true }
}

/**
 * Check if user has exceeded per-trader-pair rate limit
 */
async function checkPerPairRateLimit(
  senderId: string,
  recipientId: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limits = getContactMessageRateLimits()
  const windowStart = new Date(Date.now() - limits.perPair.windowMs)

  const recentMessages = await prisma.traderContactMessage.count({
    where: {
      OR: [
        { senderId, recipientId },
        { senderId: recipientId, recipientId: senderId }, // Check both directions
      ],
      createdAt: {
        gte: windowStart,
      },
    },
  })

  if (recentMessages >= limits.perPair.max) {
    // Find the oldest message in the window to calculate retry time
    const oldestMessage = await prisma.traderContactMessage.findFirst({
      where: {
        OR: [
          { senderId, recipientId },
          { senderId: recipientId, recipientId: senderId },
        ],
        createdAt: {
          gte: windowStart,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        createdAt: true,
      },
    })

    if (oldestMessage) {
      const retryAfter = Math.ceil(
        (limits.perPair.windowMs - (Date.now() - oldestMessage.createdAt.getTime())) / 1000
      )
      return { allowed: false, retryAfter }
    }

    return { allowed: false, retryAfter: Math.ceil(limits.perPair.windowMs / 1000) }
  }

  return { allowed: true }
}

/**
 * Get base URL from request
 */
function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

/**
 * Main handler for contact trader API route
 */
async function handleContactTrader({ request, auth }: ActionFunctionArgs & { auth: { userId: string; user: any } }) {
  if (request.method !== "POST") {
    return createErrorResponse("Method not allowed", 405)
  }

  const formData = await request.formData()
  
  // CSRF token should be validated by Express middleware via header
  // But we also check FormData as fallback
  const csrfToken = (formData.get("_csrf") as string | null) || request.headers.get("x-csrf-token")
  
  if (!csrfToken) {
    return createErrorResponse("CSRF token missing from request", 403)
  }
  
  // Get session token from cookies
  const cookieHeader = request.headers.get("cookie") || ""
  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=")
    if (key && value) acc[key] = value
    return acc
  }, {} as Record<string, string>)
  const sessionToken = cookies["_csrf"]
  
  if (!sessionToken) {
    return createErrorResponse("CSRF session token missing", 403)
  }
  
  // Validate token match
  const { validateCSRFToken } = await import("~/utils/server/csrf.server")
  if (!validateCSRFToken(csrfToken, sessionToken)) {
    return createErrorResponse("Invalid CSRF token", 403)
  }

  // Validate form data
  const validation = validateFormData(ContactTraderSchema, formData)

  if (!validation.success) {
    // Return plain object - withAuthenticatedAction will wrap it
    // But we need to return a Response with 200 status for fetcher.data to work
    return new Response(
      JSON.stringify({
        success: false,
        error: "Please check your message. Subject and message are required.",
        validationErrors: validation.errors,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  const { recipientId, subject, message } = validation.data!

  // Verify recipient exists and is not the sender
  if (recipientId === auth.userId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Cannot send message to yourself",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  const recipient = await getTraderById(recipientId)
  if (!recipient) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Recipient trader not found",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  // Check rate limits
  const perUserLimit = await checkPerUserRateLimit(auth.userId)
  if (!perUserLimit.allowed) {
    const rateLimitMessages = getRateLimitMessages()
    // Return 200 with success:false so fetcher.data is populated
    return new Response(
      JSON.stringify({
        success: false,
        error: `Rate limit exceeded. ${rateLimitMessages.perUser}. Please try again later.`,
        retryAfter: perUserLimit.retryAfter,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  const perPairLimit = await checkPerPairRateLimit(auth.userId, recipientId)
  if (!perPairLimit.allowed) {
    const rateLimitMessages = getRateLimitMessages()
    // Return 200 with success:false so fetcher.data is populated
    return new Response(
      JSON.stringify({
        success: false,
        error: `Rate limit exceeded. ${rateLimitMessages.perPair}. Please try again later.`,
        retryAfter: perPairLimit.retryAfter,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  // Sanitize message content (same pattern as reviews)
  const sanitizedMessage = DOMPurify.sanitize(message, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u"],
    ALLOWED_ATTR: [],
  })

  // Create message in database
  let createdMessage
  try {
    createdMessage = await createContactMessage({
      senderId: auth.userId,
      recipientId,
      subject: subject || null,
      message: sanitizedMessage,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Cannot send message to yourself")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Cannot send message to yourself",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      }
      if (error.message.includes("not found")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      }
    }
    throw error // Re-throw unexpected errors
  }

  // Send email notification (don't fail if email fails)
  // The message is already saved in the database, so email failure shouldn't break the request
  try {
    const baseUrl = getBaseUrl(request)
    
    // Get sender information
    const sender = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
      },
    })

    if (sender) {
      await sendTraderContactEmail({
        sender: {
          id: sender.id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          username: sender.username,
          email: sender.email,
        },
        recipient: {
          id: recipient.id,
          email: recipient.email,
        },
        subject: subject || undefined,
        message: sanitizedMessage,
        baseUrl,
      })
    }
  } catch (error) {
    // Log email error but don't fail the request
    // The message is already saved in the database, so email is just a notification
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Failed to send contact email notification:", errorMessage)
    
    // In production, you might want to:
    // - Log this to a monitoring service (e.g., Sentry, DataDog)
    // - Queue the email for retry
    // - Notify administrators if email service is down
  }

  return createSuccessResponse({
    message: "Message sent successfully",
    messageId: createdMessage.id,
  })
}

/**
 * Loader to handle GET requests
 * React Router may call this after a successful action, so return success instead of 405
 */
export const loader = async ({ request }: { request: Request }) => {
  // Return empty success response for GET requests
  // This is called by React Router after successful form submission
  return createSuccessResponse({ message: "OK" })
}

/**
 * Export action handler with authentication wrapper
 */
export const action = withAuthenticatedAction(handleContactTrader, {
  context: { api: "contact-trader", route: "api/contact-trader" },
})



