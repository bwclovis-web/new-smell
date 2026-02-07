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
import i18nextMiddleware from "i18next-http-middleware"
import morgan from "morgan"
import path from "path"
import serverless from "serverless-http"
import { pathToFileURL } from "url"

import i18n from "../app/modules/i18n/i18n.server.js"
import {
  AUDIT_CATEGORIES,
  AUDIT_LEVELS,
  getAuditLogs,
  getAuditStats,
  logAuditEvent,
} from "../app/utils/security/audit-logger.server.js"
import { getHelmetConfig } from "../app/utils/security/helmet-config.server.js"
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
import { getSessionFromExpressRequest, parseCookies } from "./utils.js"

// Run environment validation before starting the server
// Set STARTUP_VERBOSE=true in .env for detailed startup logging
if (process.env.STARTUP_VERBOSE === "true") {
  console.warn("🚀 Starting Voodoo Perfumes server...")
}
validateEnvironmentAtStartup()
const METRICS_PORT = process.env.METRICS_PORT || 3030
const PORT = process.env.APP_PORT || 2112
const NODE_ENV = process.env.NODE_ENV ?? "development"
const MAX_LIMIT_MULTIPLE = NODE_ENV !== "production" ? 10_000 : 1

// Lazy-load Vite dev server to avoid blocking startup
// Create it in the background and attach middleware when ready
let viteDevServer = null
let viteDevServerPromise = null

if (process.env.NODE_ENV !== "production") {
  // Start Vite server creation in background (non-blocking)
  console.warn("🚀 Initializing Vite dev server...")
  const startTime = Date.now()
  
  viteDevServerPromise = import("vite").then(async vite => {
    // Import the config file directly to preserve plugin virtual modules
    // This ensures React Router's HMR runtime virtual module is properly registered
    try {
      const configPath = path.join(process.cwd(), "vite.config.ts")
      const configUrl = pathToFileURL(configPath).href
      const configModule = await import(configUrl)
      const userConfig = configModule.default || {}
      
      // Only override server settings for middleware mode
      // Keep all plugins intact so virtual modules work correctly
      return vite.createServer({
        ...userConfig,
        root: process.cwd(),
        server: {
          ...(userConfig.server || {}),
          middlewareMode: true,
          // Preserve HMR settings from config
          hmr: userConfig.server?.hmr || {
            port: 24680,
            overlay: false,
            protocol: "ws",
            host: "localhost",
            clientPort: 24680,
            timeout: 30000,
          },
        },
        appType: "custom",
      })
    } catch (configError) {
      // Fallback: create server with explicit HMR settings matching vite.config.ts
      console.warn("⚠️  Could not resolve vite config, using explicit HMR settings:", configError.message)
      return vite.createServer({
        root: process.cwd(),
        server: {
          middlewareMode: true,
          hmr: {
            port: 24680,
            overlay: false,
            protocol: "ws",
            host: "localhost",
            clientPort: 24680,
            timeout: 30000,
          },
          watch: {
            usePolling: process.platform === "win32",
            interval: process.platform === "win32" ? 3000 : undefined,
            ignored: [
              "**/node_modules/**",
              "**/.git/**",
              "**/dist/**",
              "**/coverage/**",
              "**/.react-router/**",
              "**/prisma/migrations/**",
            ],
          },
          cors: true,
        },
        appType: "custom",
      })
    }
  }).then(server => {
    viteDevServer = server
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.warn(`✅ Vite dev server created in ${elapsed}s`)
    return server
  }).catch(error => {
    console.error("❌ Failed to create Vite dev server:", error.message)
    console.error("   This may cause requests to hang. Check your Vite config.")
    return null
  })
  
  // No timeout on Vite creation - let it complete naturally
  // Timeouts only cause problems on slow systems (Windows, cold cache)
  // The request handler has its own timeout for user-facing requests
}

const defaultRateLimit = {
  legacyHeaders: false,
  max: 1000 * MAX_LIMIT_MULTIPLE,
  standardHeaders: true,
  windowMs: 60 * 1000,
}

// Helper function to safely get client IP address
// Handles cases where req.ip might be undefined (e.g., during development)
const getClientIP = req => req.ip || 
         req.socket?.remoteAddress || 
         req.connection?.remoteAddress || 
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         'unknown'

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
  keyGenerator: req => getClientIP(req),
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
  keyGenerator: req => getClientIP(req),
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
  keyGenerator: req => getClientIP(req),
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
  keyGenerator: req => getClientIP(req),
})

const generalRateLimit = rateLimit({
  ...defaultRateLimit,
  message: {
    error: "Rate limit exceeded",
    message: "Too many requests, please slow down",
    retryAfter: 60,
  },
  keyGenerator: req => getClientIP(req),
})

const app = express()
const metricsApp = express()

// Trust proxy - required for express-rate-limit 
// when behind a proxy (like Vite dev server)
// This enables req.ip to correctly identify client IPs via X-Forwarded-For headers
app.set('trust proxy', 1)

// Middleware to wait for Vite dev server if it's still initializing
// Wrapped to properly handle async errors in Express
const viteMiddleware = (req, res, next) => {
  if (NODE_ENV === "production") {
    return next()
  }
  
  // If Vite is ready, use it
  if (viteDevServer) {
    return viteDevServer.middlewares(req, res, next)
  }
  
  // If still initializing, wait for it
  if (viteDevServerPromise) {
    viteDevServerPromise
      .then(server => {
        if (server) {
          viteDevServer = server
          return server.middlewares(req, res, next)
        }
        console.warn("⚠️  Vite server initialized but returned null, falling back to static files")
        next()
      })
      .catch(error => {
        console.error("❌ Vite middleware error:", error.message)
        next()
      })
    return // Don't call next() here - let the promise handle it
  }
  
  // Fallback to static files if Vite isn't available
  next()
}

// Place Vite dev server middleware first to ensure HMR works properly
if (NODE_ENV !== "production") {
  app.use(viteMiddleware)
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

// Security headers with shared helmet config (unsafe-eval gated to dev only)
app.use(getHelmetConfig(NODE_ENV))

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

// CSRF protection for /api routes (validates x-csrf-token header)
// Non-/api routes (sign-in, sign-up, admin/*) validate via requireCSRF
app.use("/api", (req, res, next) => {
  const excludedPaths = [
    "/log-out",
    "/wishlist",
    "/rate-limit-stats",
    "/security-stats",
    "/audit-logs",
    "/audit-stats",
  ]
  if (excludedPaths.includes(req.path)) {
 return next() 
}
  return csrfMiddleware(req, res, next)
})

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
  const buildPath = path.join(serverDir, subdirs[0].name, "index.js")
  // Convert to file:// URL for Windows compatibility with ESM imports
  return pathToFileURL(buildPath).href
}

// Lazy load build - wait for Vite if in dev mode
let buildPromise = null
const getBuild = async () => {
  if (buildPromise) {
    return buildPromise
  }
  
  if (NODE_ENV !== "production") {
    // In dev, wait for Vite server to be ready
    if (viteDevServerPromise) {
      console.warn("⏳ Waiting for Vite server to load build...")
      const startTime = Date.now()
      
      buildPromise = viteDevServerPromise.then(async server => {
        if (!server) {
          throw new Error("Vite server not available")
        }
        console.warn("📦 Loading React Router build from Vite...")
        try {
          // Load the server build - no artificial delays or timeouts
          // Let Vite do its work at its own pace
          const build = await server.ssrLoadModule("virtual:react-router/server-build")
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
          console.warn(`✅ React Router build loaded from Vite in ${elapsed}s`)
          return build
        } catch (loadError) {
          console.error("❌ Failed to load build from Vite:", loadError.message)
          throw new Error(`Vite build failed: ${loadError.message}`)
        }
      })
    } else {
      // Fallback to production build if Vite fails
      console.warn("⚠️  Vite not available, falling back to production build")
      buildPromise = import(findServerBuild())
    }
  } else {
    // Production: use static build
    buildPromise = import(findServerBuild())
  }
  
  return buildPromise
}

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
    images: ["/images/home.webp", "/images/scent.webp"],
  })
})

// Admin authentication middleware (uses getSessionFromExpressRequest from utils)
const requireAdminAuth = async (req, res, next) => {
  try {
    const session = await getSessionFromExpressRequest(req, { includeUser: true })

    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "No authentication token provided",
      })
    }

    if (!session.user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
        message: "User associated with token not found",
      })
    }

    if (session.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Admin access required",
      })
    }

    req.user = session.user
    next()
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Authentication error",
      message: error.message || "An error occurred during authentication",
    })
  }
}

// Security monitoring endpoints (admin only)
app.get("/admin/rate-limit-stats", requireAdminAuth, (req, res) => {
  const stats = getRateLimitStats()
  res.json({
    message: "Rate limiting statistics",
    stats,
    timestamp: new Date().toISOString(),
  })
})

// Security events monitoring
app.get("/admin/security-stats", requireAdminAuth, (req, res) => {
  const stats = getSecurityStats()
  res.json({
    message: "Security monitoring statistics",
    stats,
    timestamp: new Date().toISOString(),
  })
})

// Audit logs endpoint
app.get("/admin/audit-logs", requireAdminAuth, (req, res) => {
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
app.get("/admin/audit-stats", requireAdminAuth, (req, res) => {
  const stats = getAuditStats()
  res.json({
    message: "Audit statistics",
    stats,
    timestamp: new Date().toISOString(),
  })
})

// Security events for specific IP
app.get("/admin/security-events/:ip", requireAdminAuth, (req, res) => {
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
app.get("/admin/compression-stats", requireAdminAuth, (req, res) => {
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

// Cache the request handler once build is ready
let cachedRequestHandler = null
let requestHandlerPromise = null

const getRequestHandler = async () => {
  if (cachedRequestHandler) {
    return cachedRequestHandler
  }
  
  if (requestHandlerPromise) {
    return requestHandlerPromise
  }
  
  requestHandlerPromise = getBuild().then(build => {
    cachedRequestHandler = createRequestHandler({
      build,
      mode: NODE_ENV,
      getLoadContext: async (req, res) => {
        const session = await getSessionFromExpressRequest(req, {
          includeUser: false,
        })
        const user = session ? { id: session.userId } : null

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
    return cachedRequestHandler
  })
  
  return requestHandlerPromise
}

// Create request handler wrapper that waits for build to be ready
const requestHandler = async (req, res, next) => {
  try {
    const handler = await getRequestHandler()
    return handler(req, res, next)
  } catch (error) {
    console.error("❌ Error loading request handler:", error.message)
    if (!res.headersSent) {
      res.status(503).json({
        error: "Service Unavailable",
        message: NODE_ENV === "development"
          ? "Vite dev server is still initializing. Please wait and refresh."
          : "Server is still initializing. Please try again in a moment.",
        details: NODE_ENV === "development" ? error.message : undefined
      })
    }
    return next(error)
  }
}

app.all("*", requestHandler)

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
  console.warn(`🚀 Starting server on port ${PORT}...`)
  app.listen(PORT, () => {
    console.warn(`🤘 Server running: http://localhost:${PORT}`)
    if (process.env.STARTUP_VERBOSE === "true") {
      console.warn(`✅ Metrics ready: http://localhost:${METRICS_PORT}/metrics`)
    }
  }).on("error", err => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use. Please stop the existing server or use a different port.`)
      console.error(`   To find and kill the process: netstat -ano | findstr :${PORT}`)
    } else {
      console.error("❌ Server startup error:", err)
    }
    process.exit(1)
  })
  
  metricsApp.listen(METRICS_PORT).on("error", err => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Metrics port ${METRICS_PORT} is already in use.`)
    } else {
      console.error("❌ Metrics server startup error:", err)
    }
    // Don't exit on metrics port error, just warn
  })
  
  // Log startup completion
  console.warn("✅ Express server setup complete, waiting for requests...")
}
