# Security Improvements for Voodoo Perfumes

## Critical Security Issues

### 1. JWT Secret Hardcoded Fallback

**Severity: HIGH**

- **Issue**: Default JWT secret `'your_jwt_secret_key'` in `api/utils.js` and `app/models/session.server.ts`
- **Risk**: If JWT_SECRET environment variable is not set, the application uses a predictable secret
- **Fix**: Remove fallback and enforce environment variable validation

### 2. Database Credentials in Package.json

**Severity: HIGH**

- **Issue**: Hardcoded database credentials in `package.json` start script
- **Risk**: Credentials exposed in version control and logs
- **Fix**: Use environment variables exclusively

### 3. Missing Security Headers

**Severity: MEDIUM**

- **Issue**: No security headers implemented (CSP, HSTS, X-Frame-Options, etc.)
- **Risk**: XSS, clickjacking, and other client-side attacks
- **Fix**: Implement helmet.js with proper configuration

### 4. Insecure Session Configuration

**Severity: MEDIUM**

- **Issue**: Session cookies lack proper security flags in development
- **Risk**: Session hijacking and CSRF attacks
- **Fix**: Enforce secure cookie settings in all environments

### 5. Missing Input Validation

**Severity: MEDIUM**

- **Issue**: Limited input validation on API endpoints
- **Risk**: SQL injection, XSS, and data corruption
- **Fix**: Implement comprehensive input validation with Zod schemas

## Recommended Security Enhancements

### 1. Environment Variable Security

```typescript
// Create app/utils/security/env.server.ts
import { z } from "zod";

const securitySchema = z.object({
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]),
  // Add other required secrets
});

export function validateSecurityEnv() {
  const result = securitySchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Security configuration error: ${result.error.message}`);
  }
  return result.data;
}
```

### 2. Enhanced Security Headers

```typescript
// Update api/server.js
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);
```

### 3. Input Validation Framework

```typescript
// Create app/utils/validation/schemas.ts
import { z } from "zod";

export const userRegistrationSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(50).optional(),
});

export const perfumeRatingSchema = z.object({
  perfumeId: z.string().cuid(),
  category: z.enum(["longevity", "sillage", "gender", "priceValue", "overall"]),
  rating: z.number().int().min(1).max(5),
});
```

### 4. Rate Limiting Enhancements

```typescript
// Update api/server.js with more granular rate limiting
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to specific routes
app.use("/api/auth", authRateLimit);
app.use("/api", apiRateLimit);
```

### 5. Database Security

```prisma
// Add to prisma/schema.prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  resource  String
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])
}
```

### 6. CSRF Protection

```typescript
// Create app/utils/security/csrf.server.ts
import crypto from "crypto";

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateCSRFToken(
  token: string,
  sessionToken: string
): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(sessionToken, "hex")
  );
}
```

### 7. Password Security

```typescript
// Create app/utils/security/password.server.ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

## Implementation Priority

### Phase 1 (Immediate - Week 1)

1. Remove hardcoded JWT secret fallback
2. Move database credentials to environment variables
3. Implement basic security headers with helmet
4. Add input validation to critical API endpoints

### Phase 2 (Short-term - Week 2-3)

1. Implement comprehensive input validation framework
2. Add CSRF protection
3. Enhance rate limiting
4. Implement password strength validation

### Phase 3 (Medium-term - Month 1-2)

1. Add audit logging
2. Implement session management improvements
3. Add API authentication middleware
4. Set up security monitoring

### Phase 4 (Long-term - Month 2-3)

1. Implement advanced threat detection
2. Add automated security testing
3. Set up security incident response procedures
4. Regular security audits and penetration testing

## Security Testing

### Automated Security Tests

```typescript
// Create test/security/security.test.ts
import { describe, it, expect } from "vitest";
import { validatePasswordStrength } from "~/utils/security/password.server";

describe("Password Security", () => {
  it("should reject weak passwords", () => {
    const result = validatePasswordStrength("123");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must be at least 8 characters long"
    );
  });

  it("should accept strong passwords", () => {
    const result = validatePasswordStrength("StrongP@ssw0rd!");
    expect(result.isValid).toBe(true);
  });
});
```

### Security Headers Test

```typescript
// Create test/security/headers.test.ts
import { describe, it, expect } from "vitest";

describe("Security Headers", () => {
  it("should include security headers", async () => {
    const response = await fetch("/");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-xss-protection")).toBe("1; mode=block");
  });
});
```

## Monitoring and Alerting

### Security Event Logging

```typescript
// Create app/utils/security/logger.server.ts
export function logSecurityEvent(event: {
  type: "AUTH_FAILURE" | "RATE_LIMIT_EXCEEDED" | "SUSPICIOUS_ACTIVITY";
  userId?: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
}) {
  // Log to security monitoring system
  console.warn("Security Event:", {
    timestamp: new Date().toISOString(),
    ...event,
  });
}
```

### Security Metrics

- Failed authentication attempts per IP
- Rate limit violations
- Unusual API usage patterns
- Database query anomalies
- File upload attempts

## Compliance Considerations

### GDPR Compliance

- Implement data retention policies
- Add user data export functionality
- Implement right to be forgotten
- Add consent management

### Data Protection

- Encrypt sensitive data at rest
- Use HTTPS everywhere
- Implement proper access controls
- Regular security assessments

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma Security Guide](https://www.prisma.io/docs/guides/security)
