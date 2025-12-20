import { Resend } from "resend"

import { getTraderDisplayName } from "./user"

/**
 * Email utility for sending trader contact messages via Resend
 */

// Initialize Resend client
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set")
  }
  return new Resend(apiKey)
}

/**
 * Get email configuration from environment variables
 */
const getEmailConfig = () => {
  const fromAddress = process.env.EMAIL_FROM_ADDRESS
  const fromName = process.env.EMAIL_FROM_NAME || "Shadow and Sillage"

  if (!fromAddress) {
    throw new Error("EMAIL_FROM_ADDRESS environment variable is not set")
  }

  return {
    from: `${fromName} <${fromAddress}>`,
    fromAddress,
    fromName,
  }
}

/**
 * Generate trader profile URL
 * @param baseUrl - The base URL of the application (e.g., https://yourdomain.com)
 * @param traderId - The trader's user ID
 * @returns Full URL to the trader's profile page
 */
const getTraderProfileUrl = (baseUrl: string, traderId: string): string => {
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, "")
  return `${cleanBaseUrl}/trader/${traderId}`
}

/**
 * Interface for sender information
 */
export interface SenderInfo {
  id: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  email: string
}

/**
 * Interface for recipient information
 */
export interface RecipientInfo {
  id: string
  email: string
}

/**
 * Parameters for sending a trader contact email
 */
export interface SendTraderContactEmailParams {
  sender: SenderInfo
  recipient: RecipientInfo
  subject?: string
  message: string
  baseUrl: string
}

/**
 * Send an email notification to a trader when they receive a message
 * 
 * @param params - Email parameters including sender, recipient, message, and base URL
 * @returns Promise resolving to Resend email response
 * @throws Error if email sending fails or configuration is missing
 */
export const sendTraderContactEmail = async (
  params: SendTraderContactEmailParams
): Promise<{ id: string }> => {
  const { sender, recipient, subject, message, baseUrl } = params

  // Validate required parameters
  if (!sender || !recipient || !message || !baseUrl) {
    throw new Error("Missing required email parameters")
  }

  // Get Resend client and email configuration
  const resend = getResendClient()
  const emailConfig = getEmailConfig()

  // Get sender display name
  const senderDisplayName = getTraderDisplayName({
    firstName: sender.firstName,
    lastName: sender.lastName,
    email: sender.email,
  })

  // Generate trader profile URL
  const traderProfileUrl = getTraderProfileUrl(baseUrl, sender.id)

  // Build email subject
  const emailSubject = subject
    ? `Re: ${subject}`
    : `New message from ${senderDisplayName} on Shadow and Sillage`

  // Build HTML email content
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin-top: 0;">New Message from ${senderDisplayName}</h1>
    <p style="margin: 0; color: #666;">
      You've received a new message on Shadow and Sillage
    </p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    ${subject ? `<h2 style="color: #2c3e50; margin-top: 0;">${subject}</h2>` : ""}
    <div style="color: #333; white-space: pre-wrap;">
      ${message}
    </div>
  </div>

  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <p style="margin: 0 0 10px 0; color: #666;">
      <strong>From:</strong> ${senderDisplayName}
    </p>
    <p style="margin: 0; color: #666;">
      <strong>Sent:</strong> ${new Date().toLocaleString()}
    </p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${traderProfileUrl}" 
       style="display: inline-block; background-color: #2c3e50; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
      View ${senderDisplayName}'s Profile
    </a>
  </div>

  <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
    <p style="margin: 0 0 10px 0;">
      <strong>Reply Instructions:</strong>
    </p>
    <p style="margin: 0;">
      You can reply directly to this email, or visit ${senderDisplayName}'s trader profile to send a message through the platform.
    </p>
    <p style="margin: 20px 0 0 0; font-size: 12px; color: #999;">
      This email was sent from Shadow and Sillage. Your email address is kept private and is not shared with the sender.
    </p>
  </div>
</body>
</html>
  `.trim()

  // Build plain text version for email clients that don't support HTML
  const textContent = `
New Message from ${senderDisplayName}

${subject ? `Subject: ${subject}\n\n` : ""}
${message}

---
From: ${senderDisplayName}
Sent: ${new Date().toLocaleString()}

View ${senderDisplayName}'s profile: ${traderProfileUrl}

Reply Instructions:
You can reply directly to this email, or visit ${senderDisplayName}'s trader profile to send a message through the platform.

This email was sent from Shadow and Sillage. Your email address is kept private and is not shared with the sender.
  `.trim()

  try {
    // Send email via Resend
    const result = await resend.emails.send({
      from: emailConfig.from,
      to: recipient.email,
      subject: emailSubject,
      html: htmlContent,
      text: textContent,
      replyTo: emailConfig.fromAddress, // Allow replies to go to the platform
    })

    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message || "Unknown error"}`)
    }

    if (!result.data?.id) {
      throw new Error("Resend API returned no email ID")
    }

    return { id: result.data.id }
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to send trader contact email: ${error.message}`)
    }
    throw new Error("Failed to send trader contact email: Unknown error")
  }
}

/**
 * Check if email service is configured
 * @returns true if Resend is properly configured, false otherwise
 */
export const isEmailServiceConfigured = (): boolean => {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const fromAddress = process.env.EMAIL_FROM_ADDRESS
    return !!(apiKey && fromAddress)
  } catch {
    return false
  }
}




