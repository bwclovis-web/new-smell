// Suppress dotenv informational messages
process.env.DOTENV_CONFIG_QUIET = "true"
import "dotenv/config"

import process from "node:process"

import prom from "@isaacs/express-prometheus-middleware"
import { createRequestHandler } from "@react-router/express"
import compression from "compression"
import crypto from "crypto"
import express from "express"
import { rateLimit } from "express-rate-limit"
import fs from "fs"
import helmet from "helmet"
import i18nextMiddleware from "i18next-http-middleware"
import morgan from "morgan"
import path from "path"
import serverless from "serverless-http"

import i18n from "../app/modules/i18n/i18n.server.js"
import {
  AUDIT_CATEGORIES,
  AUDIT_LEVELS,
  getAuditLogs,
  getAuditStats,
  logAuditEvent,
} from "../app/utils/security/audit-logger.server.js"
// Rate limiting monitoring
import {
  getRateLimitStats,
  shouldBlockIP,
  trackRateLimitViolation,
} from "../app/utils/security/rate-limit-monitor.server.js"
// Security monitoring
import {
  getEventsForIP,
  getSecurityStats,
  logSecurityEvent,
  SECURITY_EVENT_TYPES,
} from "../app/utils/security/security-monitor.server.js"
// Validate environment variables at startup
import { validateEnvironmentAtStartup } from "../app/utils/security/startup-validation.server.js"
// CSRF protection
import {
  csrfMiddleware,
  generateCSRFToken,
  setCSRFCookie,
} from "../app/utils/server/csrf-middleware.server.js"
import { parseCookies, verifyJwt } from "./utils.js"

// Run environment validation before starting the server
console.warn("🚀 Starting Voodoo Perfumes server...")
validateEnvironmentAtStartup()
const METRICS_PORT = process.env.METRICS_PORT || 3030
const PORT = process.env.APP_PORT || 2112
const NODE_ENV = process.env.NODE_ENV ?? "development"
const MAX_LIMIT_MULTIPLE = NODE_ENV !== "production" ? 10_000 : 1

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then(vite => vite.createServer({
          server: { middlewareMode: true },
          appType: "custom",
        }))

const defaultRateLimit = {
  legacyHeaders: false,
  max: 1000 * MAX_LIMIT_MULTIPLE,
  standardHeaders: true,
  windowMs: 60 * 1000,
}

// Enhanced rate limiting configurations
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 * MAX_LIMIT_MULTIPLE, // 5 attempts per window
  message: {
    error: "Too many authentication attempts",
    message: "Please try again in 15 minutes",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
})

const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 * MAX_LIMIT_MULTIPLE, // 100 requests per minute
  message: {
    error: "Too many API requests",
    message: "Please slow down your requests",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const ratingRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20 * MAX_LIMIT_MULTIPLE, // 20 rating submissions per 5 minutes
  message: {
    error: "Too many rating submissions",
    message: "Please wait before submitting more ratings",
    retryAfter: 5 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// strongestRateLimit removed - unused

const strongRateLimit = rateLimit({
  ...defaultRateLimit,
  max: 100 * MAX_LIMIT_MULTIPLE,
  windowMs: 60 * 1000,
  message: {
    error: "Rate limit exceeded",
    message: "Too many requests, please slow down",
    retryAfter: 60,
  },
})

const generalRateLimit = rateLimit({
  ...defaultRateLimit,
  message: {
    error: "Rate limit exceeded",
    message: "Too many requests, please slow down",
    retryAfter: 60,
  },
})

const app = express()
const metricsApp = express()

// Place Vite dev server middleware first to ensure HMR works properly
if (viteDevServer) {
  app.use(viteDevServer.middlewares)
  // Serve images in development
  app.use("/images", express.static("public/images", { maxAge: "1h" }))
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", {
      immutable: true,
      maxAge: "1y",
    })
  )
  app.use(express.static("build/client", { maxAge: "1h" }))
  // Serve images in production
  app.use("/images", express.static("public/images", { maxAge: "1h" }))
}

app.disable("x-powered-by")

// Security headers with helmet.js
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
"'self'", "data:", "https:", "blob:"
],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: unsafe-eval needed for Vite in dev
        connectSrc: [
          "'self'",
          "https:",
          "wss:",
          ...(NODE_ENV === "development"
            ? ["ws://localhost:*", "ws://127.0.0.1:*"]
            : []),
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false, // Disable for compatibility
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }))

// Enhanced compression configuration
app.use(compression({
    // Only compress responses above 1KB
    threshold: 1024,
    // Use gzip compression
    level: 6, // Balance between compression ratio and speed (1-9, 6 is optimal)
    // Compress all text-based content types
    filter: (req, res) => {
      // Don't compress if already compressed
      if (req.headers["x-no-compression"]) {
        return false
      }

      // Use default compression filter
      return compression.filter(req, res)
    },
    // Custom compression for different content types
    memLevel: 8, // Memory level (1-9, 8 is good balance)
    strategy: 0, // Default strategy
    windowBits: 15, // Window size
    // Enable compression for API responses
    chunkSize: 16 * 1024, // 16KB chunks
  }))
app.use(morgan("tiny"))

// Prometheus
app.use(prom({
    collectDefaultMetrics: true,
    metricsApp,
    metricsPath: "/metrics",
  }))

app.use((_, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString("hex")
  next()
})

app.use((req, res, next) => {
  if (req.path.endsWith("/") && req.path.length > 1) {
    const query = req.url.slice(req.path.length)
    const safePath = req.path.slice(0, -1).replace(/\/+/g, "/")
    res.redirect(301, safePath + query)
  } else {
    next()
  }
})

// IP blocking middleware
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress

  if (shouldBlockIP(clientIP)) {
    // Log security event and audit
    logSecurityEvent({
      type: SECURITY_EVENT_TYPES.IP_BLOCKED,
      ipAddress: clientIP,
      path: req.path,
      method: req.method,
      details: {
        reason: "too_many_violations",
        userAgent: req.get("User-Agent"),
      },
      severity: "high",
    })

    logAuditEvent({
      level: AUDIT_LEVELS.WARN,
      category: AUDIT_CATEGORIES.SECURITY,
      action: "IP_BLOCKED",
      ipAddress: clientIP,
      userAgent: req.get("User-Agent"),
      resource: req.path,
      details: { reason: "too_many_violations" },
      outcome: "blocked",
    })

    return res.status(429).json({
      error: "IP temporarily blocked",
      message: "Too many violations detected. Please try again later.",
      retryAfter: 15 * 60, // 15 minutes
    })
  }

  next()
})

// Enhanced rate limiting middleware with monitoring
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress

  // Apply specific rate limits based on path
  if (req.path.startsWith("/auth/")) {
    return authRateLimit(req, res, err => {
      if (err) {
        trackRateLimitViolation(clientIP, req.path, "auth")
        logSecurityEvent({
          type: SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
          ipAddress: clientIP,
          path: req.path,
          method: req.method,
          details: { limitType: "auth", userAgent: req.get("User-Agent") },
          severity: "medium",
        })
      }
      next(err)
    })
  }

  if (req.path.startsWith("/api/")) {
    return apiRateLimit(req, res, err => {
      if (err) {
        trackRateLimitViolation(clientIP, req.path, "api")
        logSecurityEvent({
          type: SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
          ipAddress: clientIP,
          path: req.path,
          method: req.method,
          details: { limitType: "api", userAgent: req.get("User-Agent") },
          severity: "medium",
        })
      }
      next(err)
    })
  }

  if (req.path.includes("/rating") || req.path.includes("/rate")) {
    return ratingRateLimit(req, res, err => {
      if (err) {
        trackRateLimitViolation(clientIP, req.path, "rating")
        logSecurityEvent({
          type: SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
          ipAddress: clientIP,
          path: req.path,
          method: req.method,
          details: { limitType: "rating", userAgent: req.get("User-Agent") },
          severity: "medium",
        })
      }
      next(err)
    })
  }

  // Apply general rate limits for other requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    return strongRateLimit(req, res, err => {
      if (err) {
        trackRateLimitViolation(clientIP, req.path, "general")
        logSecurityEvent({
          type: SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
          ipAddress: clientIP,
          path: req.path,
          method: req.method,
          details: { limitType: "general", userAgent: req.get("User-Agent") },
          severity: "low",
        })
      }
      next(err)
    })
  }

  return generalRateLimit(req, res, err => {
    if (err) {
      trackRateLimitViolation(clientIP, req.path, "general")
      logSecurityEvent({
        type: SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
        ipAddress: clientIP,
        path: req.path,
        method: req.method,
        details: { limitType: "general", userAgent: req.get("User-Agent") },
        severity: "low",
      })
    }
    next(err)
  })
})

// Parse cookies for all requests
app.use((req, res, next) => {
  req.cookies = parseCookies(req)
  next()
})

// Generate and set CSRF token for all requests
app.use((req, res, next) => {
  if (!req.cookies?._csrf) {
    const csrfToken = generateCSRFToken()
    setCSRFCookie(res, csrfToken)
  }
  next()
})

// Parse request bodies and apply CSRF protection for API routes only
app.use("/api", (req, res, next) => {
  // Parse request bodies for API routes
  express.json({ limit: "10mb" })(req, res, () => {
    express.urlencoded({ extended: true, limit: "10mb" })(req, res, () => {
      // Skip CSRF for routes that don't need it
      const excludedRoutes = [
        "/log-out", // Logout doesn't need CSRF
        "/wishlist",
        "/rate-limit-stats", // Monitoring endpoints
        "/security-stats",
        "/audit-logs",
        "/audit-stats",
      ]

      if (excludedRoutes.includes(req.path)) {
        return next()
      }

      return csrfMiddleware(req, res, next)
    })
  })
})

// CSRF protection middleware - only for specific routes that need it
app.use("/auth", csrfMiddleware) // Apply CSRF to auth routes

app.use(i18nextMiddleware.handle(i18n))
app.use((req, res, next) => {
  req.context = { req, res, session: req.session }
  next()
})
const findServerBuild = () => {
  const serverDir = path.join(process.cwd(), "build", "server")
  const subdirs = fs
    .readdirSync(serverDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
  if (subdirs.length !== 1) {
    throw new Error("Could not uniquely identify server build directory")
  }
  return path.join(serverDir, subdirs[0].name, "index.js")
}

const build = viteDevServer
  ? await viteDevServer.ssrLoadModule("virtual:react-router/server-build")
  : await import(findServerBuild())

app.get("/test-session", (req, res) => {
  if (!req.session.views) {
    req.session.views = 1
  } else {
    req.session.views++
  }
  res.send(`Session works! You've visited ${req.session.views} times.`)
})

app.get("/test-images", (req, res) => {
  res.json({
    message: "Image serving test",
    images: ["/images/home.webp", "/images/scent.webp", "/images/login.webp"],
  })
})

// Security monitoring endpoints (admin only)
app.get("/admin/rate-limit-stats", (req, res) => {
  // In production, add proper authentication here
  const stats = getRateLimitStats()
  res.json({
    message: "Rate limiting statistics",
    stats,
    timestamp: new Date().toISOString(),
  })
})

// Security events monitoring
app.get("/admin/security-stats", (req, res) => {
  const stats = getSecurityStats()
  res.json({
    message: "Security monitoring statistics",
    stats,
    timestamp: new Date().toISOString(),
  })
})

// Audit logs endpoint
app.get("/admin/audit-logs", (req, res) => {
  const { category, level, userId, ipAddress, limit = 100 } = req.query
  const logs = getAuditLogs({
    category,
    level,
    userId,
    ipAddress,
    limit: parseInt(limit, 10),
  })

  res.json({
    message: "Audit logs",
    logs,
    count: logs.length,
    timestamp: new Date().toISOString(),
  })
})

// Audit statistics
app.get("/admin/audit-stats", (req, res) => {
  const stats = getAuditStats()
  res.json({
    message: "Audit statistics",
    stats,
    timestamp: new Date().toISOString(),
  })
})

// Security events for specific IP
app.get("/admin/security-events/:ip", (req, res) => {
  const { ip } = req.params
  const events = getEventsForIP(ip)

  res.json({
    message: `Security events for IP: ${ip}`,
    events,
    count: events.length,
    timestamp: new Date().toISOString(),
  })
})

// Compression monitoring endpoint
app.get("/admin/compression-stats", (req, res) => {
  // Get compression statistics
  const compressionStats = {
    enabled: true,
    algorithm: "gzip",
    level: 6,
    threshold: 1024,
    chunkSize: 16 * 1024,
    memLevel: 8,
    strategy: 0,
    windowBits: 15,
    timestamp: new Date().toISOString(),
  }

  res.json({
    message: "Compression configuration and statistics",
    stats: compressionStats,
    recommendations: [
      "Compression is enabled for all text-based responses",
      "API responses above 1KB are compressed",
      "Analytics data uses higher compression (level 7)",
      "Standard API responses use level 6 compression",
    ],
  })
})

app.all(
  "*",
  createRequestHandler({
    build,
    mode: NODE_ENV,
    getLoadContext: async (req, res) => {
      const cookies = parseCookies(req)
      const token = cookies.token
      let user = null

      if (token) {
        const payload = verifyJwt(token)
        if (payload && payload.userId) {
          // You can fetch full user here or just pass userId
          user = { id: payload.userId }
        }
      }

      return {
        user,
        req,
        res,
        cspNonce: res.locals.cspNonce,
        i18n: {
          language: req.language || req.i18n?.language || "en",
        },
      }
    },
  })
)

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  res
    .status(500)
    .send(NODE_ENV === "development"
        ? `<pre>${err.stack}</pre>`
        : "Internal Server Error")
})
export const handler = serverless(app)

if (NODE_ENV !== "production") {
  app.listen(PORT, () => console.warn(`🤘 server running: http://localhost:${PORT}`))
  metricsApp.listen(METRICS_PORT, () => console.warn(`✅ metrics ready: http://localhost:${METRICS_PORT}/metrics`))
}
