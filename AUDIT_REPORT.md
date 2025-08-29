# Project Audit Report

## Executive Summary

- **Overall Risk**: MEDIUM
- **Top 5 Fixes**:
  1. **CRITICAL**: Hardcoded database credentials in package.json scripts
  2. **HIGH**: Missing .env file in .gitignore (exposed in Dockerfile)
  3. **HIGH**: Weak default JWT and session secrets
  4. **MEDIUM**: Missing security headers (Helmet not configured)
  5. **MEDIUM**: No bot protection beyond basic rate limiting

## Repository Map

### Frontend Architecture

- **Framework**: React 19 + React Router 7 + TypeScript
- **Build Tool**: Vite 5.4.11
- **Styling**: Tailwind CSS 4.1.4
- **State Management**: Zustand 5.0.5
- **Testing**: Vitest 3.1.2 with coverage
- **Component Architecture**: Atomic Design (Atoms, Molecules, Organisms, Containers)

### Backend Architecture

- **Runtime**: Node.js 20 (Alpine)
- **Framework**: Express.js with React Router integration
- **Database**: PostgreSQL with Prisma ORM 6.9.0
- **Authentication**: JWT-based with bcryptjs password hashing
- **Deployment**: Docker + Vercel (serverless-http)

### Data Layer

- **ORM**: Prisma with PostgreSQL
- **Models**: User, Perfume, PerfumeHouse, UserPerfume, Ratings, Reviews, Wishlists
- **Migrations**: 3 migrations present
- **Seeding**: TypeScript-based seed script

## Security Findings

### 🔴 CRITICAL Issues

#### 1. Hardcoded Database Credentials

- **Risk**: CRITICAL — Effort: S
- **Why it matters**: Database credentials exposed in source code
- **Evidence**: `package.json:25` - `DATABASE_URL=postgresql://postgres:Toaster69@localhost:5432/new_scent`
- **Fix**: Move to environment variables, never commit credentials
- **References**: OWASP A2:2021 - Cryptographic Failures

#### 2. Missing .env in .gitignore

- **Risk**: CRITICAL — Effort: S
- **Why it matters**: Environment files can be committed, exposing secrets
- **Evidence**: `.gitignore` missing `.env` entries, Dockerfile copies `.env`
- **Fix**: Add `.env`, `.env.*` to .gitignore, use env_example.txt
- **References**: OWASP A3:2021 - Injection

### 🟠 HIGH Issues

#### 3. Weak Default Secrets

- **Risk**: HIGH — Effort: S
- **Why it matters**: Predictable secrets enable session hijacking and JWT forgery
- **Evidence**:
  - `api/utils.js:3` - `JWT_SECRET || 'your_jwt_secret_key'`
  - `app/models/session.server.ts:5` - `JWT_SECRET || 'your_jwt_secret_key'`
  - `app/utils/server/csrf.server.ts:9` - `SESSION_SECRET || 'NOT_A_STRONG_SECRET'`
- **Fix**: Require strong secrets in production, use crypto.randomBytes(32)
- **References**: OWASP A2:2021 - Cryptographic Failures

#### 4. Missing Security Headers

- **Risk**: HIGH — Effort: M
- **Why it matters**: Vulnerable to XSS, clickjacking, MIME sniffing
- **Evidence**: Helmet package installed but not configured in `api/server.js`
- **Fix**: Configure Helmet middleware with appropriate policies
- **References**: OWASP A3:2021 - Injection, A5:2021 - Security Misconfiguration

#### 5. Insecure Cookie Configuration

- **Risk**: HIGH — Effort: M
- **Why it matters**: Cookies can be stolen via XSS or man-in-the-middle
- **Evidence**: `app/utils/server/csrf.server.ts:5-12` - missing httpOnly, secure flags
- **Fix**: Set httpOnly: true, secure: true in production, sameSite: 'strict'
- **References**: OWASP A2:2021 - Cryptographic Failures

### 🟡 MEDIUM Issues

#### 6. Missing Input Validation

- **Risk**: MEDIUM — Effort: M
- **Why it matters**: Potential for injection attacks and data corruption
- **Evidence**: Limited validation in Prisma schema, no input sanitization visible
- **Fix**: Implement Zod validation for all inputs, sanitize user data
- **References**: OWASP A3:2021 - Injection

#### 7. Incomplete Error Handling

- **Risk**: MEDIUM — Effort: M
- **Why it matters**: Information disclosure, potential for enumeration attacks
- **Evidence**: `api/server.js:170-175` - generic error messages in production
- **Fix**: Implement structured error handling, log errors securely
- **References**: OWASP A9:2021 - Security Logging and Monitoring Failures

#### 8. Missing Database Indexes

- **Risk**: MEDIUM — Effort: M
- **Why it matters**: Performance issues, potential for DoS via slow queries
- **Evidence**: Prisma schema lacks explicit indexes on frequently queried fields
- **Fix**: Add indexes on userId, perfumeId, email fields
- **References**: Database Security Best Practices

### 🟢 LOW Issues

#### 9. Development Dependencies in Production

- **Risk**: LOW — Effort: S
- **Why it matters**: Larger attack surface, potential vulnerabilities
- **Evidence**: `Dockerfile:18` - copies entire node_modules including dev deps
- **Fix**: Use `npm ci --omit=dev` in production stage
- **References**: Container Security Best Practices

#### 10. Missing Health Checks

- **Risk**: LOW — Effort: S
- **Why it matters**: No way to monitor application health
- **Evidence**: No health check endpoints visible
- **Fix**: Add `/health` endpoint with database connectivity check
- **References**: Production Readiness

## Bot & Scraping Protection

### Current Protections

- ✅ **Rate Limiting**: Express rate limiting with tiered limits
  - Strongest: 10 requests/minute for auth endpoints
  - Strong: 100 requests/minute for non-GET requests
  - General: 1000 requests/minute for GET requests
- ✅ **Bot Detection**: `isbot` library for user-agent analysis
- ✅ **Honeypot**: Form honeypot implementation (but not actively used)
- ✅ **CSRF Protection**: CSRF tokens implemented (but not actively used)

### Missing Protections

#### 1. No robots.txt

- **Risk**: MEDIUM — Effort: S
- **Why it matters**: Search engines and bots can crawl sensitive areas
- **Evidence**: No robots.txt file present
- **Fix**: Create robots.txt with appropriate directives

#### 2. No Meta Robots Tags

- **Risk**: MEDIUM — Effort: S
- **Why it matters**: Search engines can index sensitive pages
- **Evidence**: No noindex/nofollow meta tags visible
- **Fix**: Add appropriate meta robots tags to sensitive routes

#### 3. No CAPTCHA/Challenge Systems

- **Risk**: MEDIUM — Effort: L
- **Why it matters**: Automated form submissions and credential stuffing
- **Evidence**: No CAPTCHA or challenge-response systems
- **Fix**: Implement reCAPTCHA v3 or hCaptcha for auth endpoints

#### 4. Limited User-Agent Filtering

- **Risk**: MEDIUM — Effort: M
- **Why it matters**: Malicious bots can bypass basic detection
- **Evidence**: Only basic `isbot` detection
- **Fix**: Implement comprehensive user-agent filtering and behavioral analysis

#### 5. No Request Fingerprinting

- **Risk**: MEDIUM — Effort: L
- **Why it matters**: Sophisticated bots can rotate user-agents
- **Evidence**: No fingerprinting or behavioral analysis
- **Fix**: Implement request fingerprinting (IP, headers, timing patterns)

#### 6. Honeypot Not Actively Used

- **Risk**: MEDIUM — Effort: S
- **Why it matters**: Spam protection not enforced
- **Evidence**: `checkHoneypot` function exists but not called in forms
- **Fix**: Integrate honeypot into all form submissions

#### 7. CSRF Protection Not Enforced

- **Risk**: MEDIUM — Effort: M
- **Why it matters**: Cross-site request forgery attacks possible
- **Evidence**: `validateCSRF` function exists but not used
- **Fix**: Enforce CSRF validation on all state-changing operations

## Frontend Quality Issues

### Accessibility

- ✅ ESLint accessibility plugin configured
- ✅ ARIA labels present in some components
- ⚠️ Missing alt text for hero image (`app/routes/home.tsx:67`)
- ⚠️ No focus management for dynamic content

### Performance

- ✅ Vite build optimization
- ✅ React 19 concurrent features
- ✅ GSAP animations optimized
- ⚠️ No lazy loading for routes
- ⚠️ No image optimization pipeline

### SEO

- ✅ Meta tags with i18n support
- ✅ Server-side rendering with React Router
- ⚠️ No structured data (JSON-LD)
- ⚠️ No sitemap generation

## Dependencies & Infrastructure

### Security Dependencies

- ✅ **bcryptjs**: Secure password hashing
- ✅ **helmet**: Security headers (installed but not configured)
- ✅ **express-rate-limit**: Rate limiting
- ✅ **isbot**: Bot detection
- ✅ **honeypot**: Spam protection utilities
- ✅ **CSRF**: CSRF protection utilities

### Vulnerable Dependencies

- ⚠️ **bcryptjs 3.0.2**: Outdated (current: 2.4.3)
- ⚠️ **express-rate-limit 7.5.0**: Outdated (current: 7.1.5)

### Missing Security Dependencies

- ❌ **helmet-csp**: Content Security Policy
- ❌ **express-validator**: Input validation
- ❌ **express-slow-down**: Progressive rate limiting
- ❌ **express-mongo-sanitize**: NoSQL injection protection

## Configuration & Environment

### Environment Variables

- ✅ **Required**: DATABASE_URL, JWT_SECRET, SESSION_SECRET
- ✅ **Optional**: METRICS_PORT, APP_PORT, NODE_ENV
- ❌ **Missing**: HONEYPOT_ENCRYPTION_SEED, CSP_NONCE_SECRET

### Docker Security

- ✅ Multi-stage build
- ✅ Non-root user (Alpine)
- ❌ Copies .env file (security risk)
- ❌ No health checks
- ❌ No security scanning

### CI/CD

- ❌ No visible CI/CD pipeline
- ❌ No automated security testing
- ❌ No dependency vulnerability scanning
- ❌ No automated deployment

## Testing & Coverage

### Current State

- ✅ **Framework**: Vitest with coverage
- ✅ **Environment**: Happy DOM for browser simulation
- ✅ **Setup**: Test environment configuration
- ⚠️ **Coverage**: Excludes many critical files

### Missing Tests

- ❌ **Security Tests**: No auth, CSRF, rate limiting tests
- ❌ **Integration Tests**: No API endpoint testing
- ❌ **E2E Tests**: No user journey testing
- ❌ **Performance Tests**: No load testing

## Privacy & Compliance

### Data Handling

- ✅ **PII**: Minimal (email, name only)
- ✅ **Encryption**: Passwords hashed with bcrypt
- ❌ **Retention**: No data retention policies
- ❌ **Consent**: No cookie consent mechanism
- ❌ **GDPR**: No data export/deletion endpoints

### Logging & Monitoring

- ✅ **Metrics**: Prometheus integration
- ✅ **Logging**: Morgan HTTP logging
- ❌ **Structured Logging**: No structured log format
- ❌ **Audit Logs**: No user action logging
- ❌ **Alerts**: No automated alerting

## Recommendations

### Immediate Actions (Week 1)

1. **Move database credentials to environment variables**
2. **Add .env to .gitignore**
3. **Generate strong secrets for JWT and sessions**
4. **Configure Helmet security headers**

### Short Term (Month 1)

1. **Implement comprehensive input validation**
2. **Enforce CSRF and honeypot protection**
3. **Add database indexes for performance**
4. **Create robots.txt and meta robots tags**
5. **Implement health check endpoints**

### Medium Term (Quarter 1)

1. **Add CAPTCHA for auth endpoints**
2. **Implement request fingerprinting**
3. **Add comprehensive logging and monitoring**
4. **Create security testing suite**
5. **Implement automated vulnerability scanning**

### Long Term (Quarter 2+)

1. **Add behavioral bot detection**
2. **Implement progressive rate limiting**
3. **Add data retention policies**
4. **Create incident response plan**
5. **Implement security training for team**

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Automated Threats to Web Applications](https://owasp.org/www-project-automated-threats-to-web-applications/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practices-security.html)
- [Prisma Security](https://www.prisma.io/docs/guides/security)
- [React Security Best Practices](https://reactjs.org/docs/security.html)
- [Docker Security Best Practices](https://docs.docker.com/develop/dev-best-practices/)
