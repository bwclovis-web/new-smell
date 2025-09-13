import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '~/db.server'
import { SESSION_CONFIG, getSessionConfig } from './session-config.server'

// Validate JWT secret
function validateJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long')
  }
  return jwtSecret
}

const JWT_SECRET = validateJwtSecret()
const config = getSessionConfig()

// Generate secure refresh token
export function generateRefreshToken(): string {
  return crypto.randomBytes(SESSION_CONFIG.REFRESH_TOKEN_LENGTH / 2).toString('hex')
}

// Create access token
export function createAccessToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: config.accessTokenExpiresIn }
  )
}

// Create refresh token
export function createRefreshToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: config.refreshTokenExpiresIn }
  )
}

// Verify access token
export function verifyAccessToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    if (payload.type !== 'access') {
      return null
    }
    return { userId: payload.userId }
  } catch {
    return null
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    if (payload.type !== 'refresh') {
      return null
    }
    return { userId: payload.userId }
  } catch {
    return null
  }
}

// Create new session
export async function createSession({
  userId,
  userAgent,
  ipAddress,
}: {
  userId: string
  userAgent?: string
  ipAddress?: string
}) {
  // Check if user already has active sessions
  const activeSessions = await prisma.session.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { gt: new Date() }
    }
  })

  // If user has reached max concurrent sessions, deactivate oldest
  if (activeSessions.length >= config.maxConcurrentSessions) {
    const oldestSession = activeSessions.sort((a, b) =>
      a.lastActivity.getTime() - b.lastActivity.getTime()
    )[0]

    await prisma.session.update({
      where: { id: oldestSession.id },
      data: { isActive: false }
    })
  }

  // Generate tokens
  const refreshToken = generateRefreshToken()
  const accessToken = createAccessToken(userId)

  // Calculate expiration date
  const expiresAt = new Date()
  expiresAt.setTime(expiresAt.getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 days

  // Create session in database
  const session = await prisma.session.create({
    data: {
      userId,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt,
      lastActivity: new Date(),
    }
  })

  return {
    accessToken,
    refreshToken,
    sessionId: session.id,
    expiresAt: session.expiresAt
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string) {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken)
  if (!payload) {
    throw new Error('Invalid refresh token')
  }

  // Check if session exists and is active
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true }
  })

  if (!session || !session.isActive || session.expiresAt <= new Date()) {
    throw new Error('Session expired or invalid')
  }

  // Update last activity
  await prisma.session.update({
    where: { id: session.id },
    data: { lastActivity: new Date() }
  })

  // Generate new access token
  const accessToken = createAccessToken(payload.userId)

  return {
    accessToken,
    userId: payload.userId,
    sessionId: session.id
  }
}

// Invalidate session
export async function invalidateSession(sessionId: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { isActive: false }
  })
}

// Invalidate all user sessions
export async function invalidateAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId },
    data: { isActive: false }
  })
}

// Get active session
export async function getActiveSession(sessionId: string) {
  return await prisma.session.findFirst({
    where: {
      id: sessionId,
      isActive: true,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  })
}

// Clean up expired sessions
export async function cleanupExpiredSessions() {
  const result = await prisma.session.updateMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          isActive: true,
          lastActivity: {
            lt: new Date(Date.now() - config.inactivityTimeout)
          }
        }
      ]
    },
    data: { isActive: false }
  })

  console.log(`Cleaned up ${result.count} expired sessions`)
  return result.count
}

// Get user's active sessions
export async function getUserActiveSessions(userId: string) {
  return await prisma.session.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { gt: new Date() }
    },
    orderBy: { lastActivity: 'desc' }
  })
}

