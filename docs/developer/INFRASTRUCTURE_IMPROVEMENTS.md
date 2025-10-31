# Infrastructure Improvements

## Executive Summary

Comprehensive infrastructure enhancement strategies for the New Smell perfume trading platform, covering monitoring, CI/CD, security, and development tooling.

**Current Infrastructure State:**

- ✅ Good: Vercel deployment
- ✅ Good: Security monitoring (audit logs, rate limiting)
- ✅ Good: PostgreSQL database
- ⚠️ Needs Work: Observability and monitoring
- ⚠️ Needs Work: CI/CD optimization
- ⚠️ Needs Work: Automated security scanning
- ⚠️ Needs Work: Developer tooling

**Infrastructure Goals:**

- 99.9% uptime
- < 5 minute deployment time
- Zero-downtime deployments
- Automated security scanning
- Comprehensive monitoring
- Enhanced developer experience

---

## 1. Monitoring & Observability

### 1.1 Application Performance Monitoring (APM)

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 4-6 days | **Priority:** CRITICAL

#### Sentry Integration

```typescript
// app/entry.client.tsx
import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Filter sensitive data
  beforeSend(event) {
    // Remove sensitive information
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.request?.headers?.Authorization) {
      delete event.request.headers.Authorization;
    }
    return event;
  },
});
```

```typescript
// app/entry.server.tsx
import * as Sentry from "@sentry/node";
import "@sentry/tracing";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,

  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
});

// Capture errors in loaders/actions
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // ... loader logic
  } catch (error) {
    Sentry.captureException(error, {
      tags: { loader: "perfume" },
      extra: { url: request.url },
    });
    throw error;
  }
}
```

#### Custom Performance Tracking

```typescript
// app/utils/monitoring/performance.server.ts
import { performance } from "perf_hooks";

export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  start(name: string) {
    this.marks.set(name, performance.now());
  }

  end(name: string, metadata?: Record<string, any>) {
    const start = this.marks.get(name);
    if (!start) return;

    const duration = performance.now() - start;
    this.marks.delete(name);

    // Log to monitoring service
    this.logMetric({
      name,
      duration,
      metadata,
      timestamp: new Date(),
    });

    return duration;
  }

  private logMetric(metric: PerformanceMetric) {
    // Send to Sentry, Datadog, or custom service
    if (process.env.NODE_ENV === "production") {
      Sentry.captureMessage("Performance Metric", {
        level: "info",
        extra: metric,
      });
    }
  }
}

// Usage
export async function loader() {
  const monitor = new PerformanceMonitor();

  monitor.start("database-query");
  const data = await prisma.perfume.findMany();
  monitor.end("database-query", { count: data.length });

  return data;
}
```

#### Checklist

- [ ] Set up Sentry account
- [ ] Configure Sentry for client
- [ ] Configure Sentry for server
- [ ] Add performance tracking
- [ ] Set up alerts
- [ ] Create error dashboards
- [ ] Test error reporting
- [ ] Document monitoring setup

---

### 1.2 Logging Infrastructure

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 3-4 days | **Priority:** HIGH

#### Structured Logging

```typescript
// app/utils/logging/logger.server.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: "new-smell",
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // File for production
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// Production: Use external service
if (process.env.NODE_ENV === "production") {
  // Add Datadog, Loggly, or similar
  logger.add(
    new winston.transports.Http({
      host: process.env.LOG_SERVICE_HOST,
      path: "/logs",
      ssl: true,
    })
  );
}

export { logger };
```

#### Usage Pattern

```typescript
// app/models/perfume.server.ts
import { logger } from "~/utils/logging/logger.server";

export async function getPerfumeBySlug(slug: string) {
  logger.info("Fetching perfume", { slug });

  try {
    const perfume = await prisma.perfume.findUnique({
      where: { slug },
    });

    if (!perfume) {
      logger.warn("Perfume not found", { slug });
      return null;
    }

    logger.info("Perfume fetched successfully", {
      slug,
      perfumeId: perfume.id,
    });

    return perfume;
  } catch (error) {
    logger.error("Failed to fetch perfume", {
      slug,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
```

#### Log Aggregation

```typescript
// Consider using:
// - Datadog Logs
// - Loggly
// - Papertrail
// - AWS CloudWatch
// - Google Cloud Logging

// Benefits:
// ✅ Centralized log storage
// ✅ Advanced search and filtering
// ✅ Log analysis and insights
// ✅ Alerting on patterns
// ✅ Long-term retention
```

#### Checklist

- [ ] Set up Winston logger
- [ ] Define log levels
- [ ] Add structured logging
- [ ] Set up log aggregation service
- [ ] Create log rotation
- [ ] Add search and analysis
- [ ] Set up log-based alerts
- [ ] Document logging standards

---

### 1.3 Database Monitoring

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 2-3 days | **Priority:** HIGH

#### Query Performance Monitoring

```typescript
// app/utils/monitoring/prisma-monitor.server.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

// Monitor slow queries
prisma.$on("query", (e) => {
  if (e.duration > 1000) {
    // > 1 second
    logger.warn("Slow query detected", {
      query: e.query,
      duration: e.duration,
      params: e.params,
    });

    Sentry.captureMessage("Slow Database Query", {
      level: "warning",
      extra: {
        query: e.query,
        duration: e.duration,
      },
    });
  }
});

// Monitor errors
prisma.$on("error", (e) => {
  logger.error("Prisma error", {
    message: e.message,
    target: e.target,
  });
});

export { prisma };
```

#### Database Health Checks

```typescript
// app/routes/api/health.ts
export async function loader() {
  const checks = {
    database: false,
    memory: false,
    disk: false,
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    logger.error("Database health check failed", { error });
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  checks.memory = memUsage.heapUsed < 500 * 1024 * 1024; // < 500MB

  const allHealthy = Object.values(checks).every(Boolean);

  return Response.json(
    {
      status: allHealthy ? "healthy" : "unhealthy",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 }
  );
}
```

#### Checklist

- [ ] Enable Prisma query logging
- [ ] Monitor slow queries
- [ ] Set up connection pooling alerts
- [ ] Add health check endpoints
- [ ] Monitor database size
- [ ] Track query patterns
- [ ] Set up automated backups
- [ ] Document monitoring setup

---

### 1.4 Uptime Monitoring

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 1-2 days | **Priority:** MEDIUM

#### External Monitoring Services

```yaml
# Use services like:
# - UptimeRobot (Free tier available)
# - Pingdom
# - StatusCake
# - Better Uptime

# Monitor:
endpoints:
  - url: https://yourapp.com
    interval: 5m
    expected_status: 200

  - url: https://yourapp.com/api/health
    interval: 1m
    expected_status: 200
    expected_body: '"status":"healthy"'

  - url: https://yourapp.com/the-vault
    interval: 5m
    expected_status: 200

# Alerts:
notifications:
  - email: team@example.com
  - slack: #alerts
  - pagerduty: on-call
```

#### Status Page

```typescript
// Consider using:
// - Statuspage.io
// - Freshstatus
// - Status.io
// - Self-hosted: Upptime (GitHub Actions)

// Benefits:
// ✅ Public status visibility
// ✅ Incident communication
// ✅ Historical uptime
// ✅ Subscriber notifications
```

#### Checklist

- [ ] Set up uptime monitoring
- [ ] Configure health checks
- [ ] Add critical endpoint monitoring
- [ ] Set up alerting
- [ ] Create status page
- [ ] Test incident response
- [ ] Document monitoring endpoints

---

## 2. CI/CD Pipeline

### 2.1 GitHub Actions Optimization

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 3-4 days | **Priority:** HIGH

#### Comprehensive CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Job 1: Code Quality
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Check formatting
        run: npm run format:check

  # Job 2: Unit Tests
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/unit/lcov.info
          flags: unit

  # Job 3: Integration Tests
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        run: npm run db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  # Job 4: E2E Tests
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e:ci

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # Job 5: Security Scan
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run security audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # Job 6: Build
  build:
    runs-on: ubuntu-latest
    needs: [quality, unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Check bundle size
        run: npm run analyze:bundle
```

#### Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"

      - name: Run smoke tests
        run: |
          npm run test:smoke -- --url=${{ env.DEPLOYMENT_URL }}

      - name: Notify deployment
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Deployed to production",
              "url": "${{ env.DEPLOYMENT_URL }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

#### Checklist

- [ ] Set up GitHub Actions workflows
- [ ] Optimize job parallelization
- [ ] Add caching strategies
- [ ] Configure environments
- [ ] Set up secrets management
- [ ] Add deployment notifications
- [ ] Create rollback workflow
- [ ] Document CI/CD process

---

### 2.2 Build Optimization

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 2-3 days | **Priority:** MEDIUM

#### Build Caching

```yaml
# .github/workflows/ci.yml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Cache build output
  uses: actions/cache@v3
  with:
    path: |
      .react-router/
      build/
      node_modules/.cache/
    key: ${{ runner.os }}-build-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-build-
```

#### Parallel Job Execution

```yaml
# Run jobs in parallel when possible
jobs:
  lint:
    runs-on: ubuntu-latest
    # Runs independently

  test-unit:
    runs-on: ubuntu-latest
    # Runs independently

  test-e2e:
    runs-on: ubuntu-latest
    # Runs independently

  build:
    runs-on: ubuntu-latest
    needs: [lint, test-unit, test-e2e]
    # Only runs after all tests pass
```

#### Checklist

- [ ] Implement build caching
- [ ] Parallelize independent jobs
- [ ] Optimize dependencies installation
- [ ] Cache test results
- [ ] Reduce build time
- [ ] Monitor build performance

---

### 2.3 Environment Management

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 2-3 days | **Priority:** MEDIUM

#### Environment Configuration

```bash
# .env.example
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/newsmell
LOCAL_DATABASE_URL=postgresql://user:password@localhost:5432/newsmell

# Authentication
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# API Keys
OPENAI_API_KEY=sk-...
SENTRY_DSN=https://...

# Feature Flags
ENABLE_AI_FEATURES=false
ENABLE_ANALYTICS=true

# Monitoring
LOG_LEVEL=info
NODE_ENV=development
```

#### Environment Validation

```typescript
// scripts/validate-env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "production", "test"]),

  // Optional with defaults
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ENABLE_AI_FEATURES: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
});

export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    console.error("❌ Invalid environment variables:");
    console.error(error.errors);
    process.exit(1);
  }
}

// Run at startup
validateEnvironment();
```

#### Multi-Environment Setup

```json
// package.json
{
  "scripts": {
    "dev": "NODE_ENV=development npm run start",
    "dev:staging": "NODE_ENV=staging npm run start",
    "start:prod": "NODE_ENV=production npm run start",

    "db:push:dev": "dotenv -e .env.development -- prisma db push",
    "db:push:staging": "dotenv -e .env.staging -- prisma db push",
    "db:push:prod": "dotenv -e .env.production -- prisma db push"
  }
}
```

#### Checklist

- [ ] Create .env.example
- [ ] Set up environment validation
- [ ] Configure multiple environments
- [ ] Document required variables
- [ ] Set up secrets management
- [ ] Add environment-specific configs
- [ ] Test environment switching

---

## 3. Security Enhancements

### 3.1 Automated Security Scanning

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 2-3 days | **Priority:** HIGH

#### Dependency Scanning

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: "0 0 * * 1" # Weekly on Monday
  push:
    branches: [main]

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          command: test
          args: --severity-threshold=high

      - name: Upload results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: snyk.sarif

  code-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

#### Security Headers

```typescript
// api/server.js - Enhance existing helmet config
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Remove if possible
          "https://trusted-cdn.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.example.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },

    // Additional security headers
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },

    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,

    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },

    permissionsPolicy: {
      features: {
        camera: ["'none'"],
        microphone: ["'none'"],
        geolocation: ["'none'"],
        payment: ["'none'"],
      },
    },
  })
);
```

#### Rate Limiting Enhancement

```typescript
// app/utils/security/rate-limiter.server.ts
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "./redis.server";

export const createRateLimiter = (options: RateLimitOptions) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: "rl:",
    }),
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,

    // Custom key generator for more granular control
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    },

    // Skip rate limiting for certain conditions
    skip: (req) => {
      // Skip for health checks
      if (req.path === "/api/health") return true;

      // Skip for admin users
      if (req.user?.role === "admin") return true;

      return false;
    },

    // Custom error handler
    handler: (req, res) => {
      res.status(429).json({
        error: "Too many requests",
        message: "Please try again later",
        retryAfter: req.rateLimit.resetTime,
      });
    },
  });
};
```

#### Checklist

- [ ] Set up automated dependency scanning
- [ ] Configure Snyk or similar service
- [ ] Enable GitHub security advisories
- [ ] Implement security headers
- [ ] Enhance rate limiting
- [ ] Add CAPTCHA for sensitive endpoints
- [ ] Set up security alerts
- [ ] Document security practices

---

### 3.2 Secrets Management

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 2-3 days | **Priority:** HIGH

#### Secrets Rotation

```typescript
// app/utils/security/secrets.server.ts
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManager({
  region: process.env.AWS_REGION,
});

export async function getSecret(secretName: string): Promise<string> {
  try {
    const response = await client.getSecretValue({
      SecretId: secretName,
    });

    return response.SecretString || "";
  } catch (error) {
    logger.error("Failed to retrieve secret", { secretName, error });
    throw error;
  }
}

// Usage
const jwtSecret = await getSecret("jwt-secret");
const dbPassword = await getSecret("db-password");
```

#### Environment-Specific Secrets

```bash
# Use Vercel's environment variables
# or AWS Secrets Manager
# or HashiCorp Vault

# Separate secrets by environment:
# - Development (local .env)
# - Staging (Vercel staging environment)
# - Production (Vercel production environment)
```

#### Checklist

- [ ] Audit all secrets
- [ ] Move secrets to secure storage
- [ ] Implement secrets rotation
- [ ] Use environment-specific secrets
- [ ] Add secrets access logging
- [ ] Document secrets management
- [ ] Test secrets retrieval

---

### 3.3 Compliance & Audit

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 3-4 days | **Priority:** MEDIUM

#### Audit Logging Enhancement

```typescript
// app/utils/security/audit.server.ts - Enhance existing
import { prisma } from "~/db.server";

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  result: "success" | "failure";
  severity: "low" | "medium" | "high" | "critical";
}

export async function logAuditEvent(entry: AuditLogEntry) {
  // Log to database
  await prisma.securityAuditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      details: entry.metadata,
      severity: entry.severity,
      createdAt: new Date(),
    },
  });

  // Also send to external logging service
  logger.info("Audit event", entry);

  // Send critical events to Sentry
  if (entry.severity === "critical") {
    Sentry.captureMessage("Critical Audit Event", {
      level: "critical",
      extra: entry,
    });
  }
}

// Usage
await logAuditEvent({
  userId: user.id,
  action: "DELETE_PERFUME",
  resource: "perfume",
  resourceId: perfume.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
  result: "success",
  severity: "high",
});
```

#### GDPR Compliance

```typescript
// app/utils/privacy/gdpr.server.ts
export async function exportUserData(userId: string) {
  const [user, perfumes, wishlist, reviews, ratings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userPerfume.findMany({ where: { userId } }),
    prisma.userPerfumeWishlist.findMany({ where: { userId } }),
    prisma.userPerfumeReview.findMany({ where: { userId } }),
    prisma.userPerfumeRating.findMany({ where: { userId } }),
  ]);

  return {
    user,
    perfumes,
    wishlist,
    reviews,
    ratings,
    exportedAt: new Date(),
  };
}

export async function deleteUserData(userId: string) {
  // Anonymize or delete user data
  await prisma.$transaction([
    // Delete user's content
    prisma.userPerfume.deleteMany({ where: { userId } }),
    prisma.userPerfumeWishlist.deleteMany({ where: { userId } }),
    prisma.userPerfumeReview.deleteMany({ where: { userId } }),
    prisma.userPerfumeRating.deleteMany({ where: { userId } }),

    // Delete user account
    prisma.user.delete({ where: { id: userId } }),
  ]);

  // Log deletion
  await logAuditEvent({
    userId,
    action: "DELETE_USER_DATA",
    resource: "user",
    resourceId: userId,
    result: "success",
    severity: "high",
  });
}
```

#### Checklist

- [ ] Enhance audit logging
- [ ] Implement data export
- [ ] Implement data deletion
- [ ] Add consent management
- [ ] Create privacy policy
- [ ] Document compliance measures
- [ ] Regular compliance audits

---

## 4. Development Tooling

### 4.1 Developer Experience Improvements

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 3-4 days | **Priority:** MEDIUM

#### VSCode Workspace Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/build": true,
    "**/.react-router": true
  },

  "search.exclude": {
    "**/node_modules": true,
    "**/build": true,
    "**/.react-router": true,
    "**/coverage": true
  }
}
```

#### VSCode Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-playwright.playwright",
    "vitest.explorer",
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

#### Git Hooks with Husky

```bash
# Install Husky
npm install --save-dev husky lint-staged

# Initialize Husky
npx husky install
```

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run typecheck
npm run test:unit
```

#### Checklist

- [ ] Create VSCode workspace settings
- [ ] Add recommended extensions
- [ ] Set up Husky
- [ ] Configure lint-staged
- [ ] Add pre-commit hooks
- [ ] Add pre-push hooks
- [ ] Document setup process

---

### 4.2 Development Scripts

**Impact:** 🔥 LOW | **Effort:** ⏱️ 1-2 days | **Priority:** LOW

#### Useful npm Scripts

```json
// package.json
{
  "scripts": {
    // Development
    "dev": "npm run db:push && run-p dev:*",
    "dev:server": "node ./api/server.js",
    "dev:db": "prisma studio",
    "dev:logs": "tail -f logs/*.log",

    // Testing
    "test": "vitest",
    "test:all": "run-s test:unit test:integration test:e2e",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",

    // Quality
    "quality": "run-p lint typecheck test:unit",
    "quality:fix": "run-s lint:fix format test:unit",

    // Database
    "db:reset": "prisma db push --force-reset && prisma db seed",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",

    // Production
    "build:analyze": "ANALYZE=true npm run build",
    "build:profile": "NODE_ENV=production npm run build --profile",

    // Utilities
    "clean": "rimraf build .react-router coverage test-results",
    "clean:all": "npm run clean && rimraf node_modules",
    "update:deps": "npm-check -u",
    "audit:fix": "npm audit fix"
  }
}
```

#### Custom CLI Tools

```typescript
// scripts/cli.ts
import { Command } from "commander";

const program = new Command();

program
  .name("new-smell")
  .description("CLI tools for New Smell application")
  .version("1.0.0");

program
  .command("create:component <name>")
  .description("Create a new component")
  .option("-t, --type <type>", "Component type (atom, molecule, organism)")
  .action((name, options) => {
    // Create component scaffolding
  });

program
  .command("analyze:bundle")
  .description("Analyze bundle size")
  .action(() => {
    // Run bundle analysis
  });

program
  .command("db:seed <file>")
  .description("Seed database from file")
  .action((file) => {
    // Seed database
  });

program.parse();
```

#### Checklist

- [ ] Add useful development scripts
- [ ] Create custom CLI tools
- [ ] Document all scripts
- [ ] Add script aliases
- [ ] Test scripts on all platforms

---

### 4.3 Documentation Website

**Impact:** 🔥 LOW | **Effort:** ⏱️ 3-4 days | **Priority:** LOW

#### Documentation Site with Docusaurus

```bash
# Set up Docusaurus
npx create-docusaurus@latest docs classic

# Structure:
docs/
├── docs/
│   ├── getting-started/
│   ├── architecture/
│   ├── api/
│   ├── components/
│   └── guides/
├── blog/
├── src/
└── docusaurus.config.js
```

```javascript
// docusaurus.config.js
module.exports = {
  title: "New Smell Documentation",
  tagline: "Developer documentation for New Smell platform",
  url: "https://docs.newsmell.com",
  baseUrl: "/",

  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/yourorg/new-smell/edit/main/docs/",
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
```

#### Checklist

- [ ] Set up documentation site
- [ ] Write getting started guide
- [ ] Document architecture
- [ ] Generate API documentation
- [ ] Add component catalog
- [ ] Create troubleshooting guide
- [ ] Deploy documentation site

---

## 5. Implementation Timeline

### Month 1: Monitoring & Observability

- Week 1: Set up Sentry and logging
- Week 2: Database monitoring
- Week 3: Uptime monitoring and health checks
- Week 4: Dashboards and alerts

### Month 2: CI/CD & Build

- Week 1: GitHub Actions workflows
- Week 2: Build optimization
- Week 3: Environment management
- Week 4: Testing and validation

### Month 3: Security

- Week 1: Automated scanning
- Week 2: Secrets management
- Week 3: Compliance and audit
- Week 4: Security testing

### Month 4: Developer Experience

- Week 1: Development tooling
- Week 2: Documentation site
- Week 3: CLI tools
- Week 4: Team training

---

## 6. Success Metrics

### Infrastructure

- ✅ 99.9% uptime
- ✅ < 5 minute deployment time
- ✅ Zero critical security vulnerabilities
- ✅ < 10 minute build time

### Monitoring

- ✅ < 1 minute to detect issues
- ✅ 100% critical paths monitored
- ✅ < 5 minute MTTR

### Security

- ✅ Weekly security scans
- ✅ Zero high-severity vulnerabilities
- ✅ 100% secrets in secure storage
- ✅ Full audit trail

---

## Next Steps

1. **Month 1**: Focus on monitoring and observability
2. **Month 2**: Optimize CI/CD pipeline
3. **Month 3**: Enhance security posture
4. **Month 4**: Improve developer experience

**Remember**: Infrastructure is the foundation of reliability and scalability!
