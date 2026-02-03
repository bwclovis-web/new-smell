import helmet from "helmet"

/**
 * Helmet security configuration for Voodoo Perfumes
 * Provides comprehensive security headers with environment-specific settings
 */

export function getHelmetConfig(nodeEnv = "development") {
  const isDevelopment = nodeEnv === "development"
  const isProduction = nodeEnv === "production"

  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind CSS and inline styles
        ],
        fontSrc: ["'self'", "data:"],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:",
          "*.vercel.app", // Allow Vercel deployment images
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for inline scripts
          ...(isDevelopment ? ["'unsafe-eval'"] : []), // Vite needs this in dev
          "https://vercel.live", // Vercel live preview
        ],
        connectSrc: [
          "'self'",
          "https:",
          "wss:",
          ...(isDevelopment ? ["ws://localhost:*", "http://localhost:*"] : []),
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : undefined, // Only in production
      },
    },

    // HTTP Strict Transport Security
    hsts: isProduction
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false, // Disable in development

    // Prevent MIME type sniffing
    noSniff: true,

    // XSS Protection (legacy but still useful)
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },

    // Cross-Origin Policies
    crossOriginEmbedderPolicy: false, // Disable for compatibility with external resources
    crossOriginOpenerPolicy: {
      policy: "same-origin",
    },
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },

    // Additional security headers
    dnsPrefetchControl: {
      allow: false,
    },
    frameguard: {
      action: "deny",
    },
    hidePoweredBy: true,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    xssFilter: true,
  })
}

/**
 * Development-specific helmet configuration
 * More permissive for development tools and hot reloading
 */
export function getDevelopmentHelmetConfig() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:"],
        imgSrc: [
"'self'", "data:", "https:", "blob:", "http://localhost:*"
],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'", // Required for Vite HMR
          "http://localhost:*",
          "ws://localhost:*",
        ],
        connectSrc: [
          "'self'",
          "http://localhost:*",
          "ws://localhost:*",
          "https:",
          "wss:",
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: false, // Disable HSTS in development
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
}

/**
 * Production-specific helmet configuration
 * Maximum security for production environment
 */
export function getProductionHelmetConfig() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-eval in production
        connectSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
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
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    ieNoOpen: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
  })
}
