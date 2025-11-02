# Form Utilities

Reusable form handling utilities to reduce duplication and improve consistency across the application.

## Overview

This directory contains common form handling logic that can be used throughout the application:

- **Form Submission** - Client-side form handling with validation
- **Form Validation** - Common validation functions and patterns
- **Type Safety** - Full TypeScript support with generics
- **Security** - Built-in XSS protection

## Quick Start

```typescript
import { useFormSubmit, createValidator, commonValidators } from "~/utils/forms"

// In your component
function LoginForm() {
  const { handleSubmit, isSubmitting, errors } = useFormSubmit<LoginData>({
    validate: createValidator({
      email: commonValidators.email,
      password: commonValidators.required("Password"),
    }),
    onSuccess: (result) => navigate("/dashboard"),
  })

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        return await loginUser(data)
      })}
    >
      {/* form fields */}
      {errors && <div>{errors._form}</div>}
      <button disabled={isSubmitting}>Login</button>
    </form>
  )
}
```

## Form Submission

### `useFormSubmit` Hook

Client-side form submission with built-in validation and error handling.

```typescript
const { handleSubmit, isSubmitting, errors, clearErrors, setFieldError } = useFormSubmit<T>({
  validate?: (data: T) => Record<string, string> | null
  onSuccess?: (result: any) => void
  onError?: (error: unknown) => void
  transform?: (data: T) => T
  resetOnSuccess?: boolean
})
```

**Example with validation:**

```typescript
const { handleSubmit, isSubmitting, errors } = useFormSubmit<SignUpData>({
  validate: (data) => {
    if (!data.email) return { email: "Email is required" }
    if (data.password !== data.confirmPassword) {
      return { confirmPassword: "Passwords must match" }
    }
    return null
  },
  onSuccess: () => navigate("/welcome"),
  resetOnSuccess: true,
})
```

### `createFormAction`

Type-safe wrapper for Remix actions.

```typescript
export const action = createFormAction(
  async (data: FormData) => {
    const user = await createUser(data)
    return redirect(`/user/${user.id}`)
  },
  {
    validate: (data) => {
      if (!data.email) return { error: "Email is required" }
      return null
    },
    transform: (formData) => {
      // Custom transformation
      return {
        email: formData.get("email"),
        password: formData.get("password"),
      }
    },
  }
)
```

### Helper Functions

**`extractFormData`** - Extract specific fields from FormData:

```typescript
const formData = new FormData()
const data = extractFormData<{ email: string; password: string }>(formData, [
  "email",
  "password",
])
```

**`formDataToObject`** - Convert FormData to plain object:

```typescript
const formData = new FormData()
const data = formDataToObject(formData)
// Handles multiple values for same key (checkboxes, multi-select)
```

## Form Validation

### Common Validators

Pre-built validators for common use cases:

```typescript
import { commonValidators, createValidator } from "~/utils/forms"

const validate = createValidator({
  email: commonValidators.email,
  password: commonValidators.password,
  confirmPassword: commonValidators.confirmPassword("password"),
  username: commonValidators.required("Username"),
  bio: commonValidators.maxLength("Bio", 500),
})
```

Available validators:

- `email` - Validate email format
- `password` - Validate password strength
- `confirmPassword(field)` - Validate password confirmation
- `required(fieldName)` - Validate required field
- `minLength(fieldName, min)` - Validate minimum length
- `maxLength(fieldName, max)` - Validate maximum length

### Custom Validators

Create custom validators with type safety:

```typescript
import { createValidator } from "~/utils/forms"

const validate = createValidator<SignUpData>({
  username: (value, allValues) => {
    if (!value) return "Username is required"
    if (value.length < 3) return "Username must be at least 3 characters"
    if (!/^[a-zA-Z0-9_]+$/.test(value))
      return "Username can only contain letters, numbers, and underscores"
    return null
  },
  email: (value) => {
    if (!value) return "Email is required"
    if (!validateEmail(value)) return "Invalid email format"
    return null
  },
})
```

### Validation Functions

Low-level validation functions:

```typescript
import { validateEmail, validatePassword, validateMatch } from "~/utils/forms"

// Email validation
if (!validateEmail(email)) {
  setError("Invalid email")
}

// Password strength
const result = validatePassword(password, {
  minLength: 10,
  requireSpecialChars: true,
})
if (!result.valid) {
  setError(result.message)
}

// Field matching
const error = validateMatch(password, confirmPassword, "Passwords")
if (error) {
  setError(error)
}
```

### Zod Integration

Validate with Zod schemas:

```typescript
import { z } from "zod"
import { validateWithZod } from "~/utils/forms"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const result = validateWithZod(schema, data)
if (!result.success) {
  setErrors(result.errors)
} else {
  // result.data is typed!
  await submitForm(result.data)
}
```

## Security

### Input Sanitization

Protect against XSS attacks:

```typescript
import { sanitizeFormInput, sanitizeFormData } from "~/utils/forms"

// Sanitize single input
const clean = sanitizeFormInput(userInput)
// Removes: <script>, javascript:, event handlers, etc.

// Sanitize all form data
const cleanData = sanitizeFormData(formData)
// Sanitizes all string fields
```

The sanitization removes:

- HTML tags (`<script>`, `<iframe>`, etc.)
- JavaScript protocols (`javascript:`)
- Event handlers (`onclick=`, `onerror=`, etc.)
- Trims whitespace

## Validation Messages

Consistent error messages:

```typescript
import { VALIDATION_MESSAGES } from "~/utils/forms"

VALIDATION_MESSAGES.required("Email") // "Email is required"
VALIDATION_MESSAGES.minLength("Password", 8) // "Password must be at least 8 characters"
VALIDATION_MESSAGES.email // "Please enter a valid email address"
```

## Best Practices

1. **Use TypeScript generics** for type safety:

```typescript
const { handleSubmit } = useFormSubmit<LoginData>({ ... })
```

2. **Combine validation functions**:

```typescript
const validate = createValidator({
  password: (value) =>
    combineValidationErrors(
      validateRequired(value, "Password"),
      validateMinLength(value, 8, "Password"),
      validatePassword(value).valid ? null : "Password too weak"
    ),
})
```

3. **Sanitize user input**:

```typescript
const { handleSubmit } = useFormSubmit({
  transform: (data) => sanitizeFormData(data),
})
```

4. **Handle errors gracefully**:

```typescript
const { handleSubmit, errors } = useFormSubmit({
  onError: (error) => {
    if (error instanceof AppError) {
      toast.error(error.toUserMessage())
    }
  },
})
```

## Testing

The form utilities are fully tested with 49 comprehensive tests:

- `test/unit/utils/formSubmit.test.ts` - Form submission utilities
- `test/unit/utils/formValidation.test.ts` - Validation functions

Run tests:

```bash
npm test -- test/unit/utils/formSubmit.test.ts test/unit/utils/formValidation.test.ts
```

## Migration Guide

### Migrating Existing Forms

**Before:**

```typescript
// Old pattern - duplicated across many files
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  const formData = new FormData(e.target as HTMLFormElement)
  const data = Object.fromEntries(formData)

  // Validation
  if (!data.email) {
    setError("Email is required")
    return
  }

  setIsSubmitting(true)
  try {
    await submitForm(data)
    navigate("/success")
  } catch (error) {
    setError(error.message)
  } finally {
    setIsSubmitting(false)
  }
}
```

**After:**

```typescript
// New pattern - reusable utility
const { handleSubmit, isSubmitting, errors } = useFormSubmit<FormData>({
  validate: createValidator({
    email: commonValidators.required('Email')
  }),
  onSuccess: () => navigate('/success')
})

// In JSX
<form onSubmit={handleSubmit(async (data) => {
  return await submitForm(data)
})}>
```

Benefits:

- ✅ Less boilerplate code
- ✅ Consistent error handling
- ✅ Type safety
- ✅ Reusable validation logic

## API Reference

See the source files for complete API documentation:

- `formSubmit.ts` - Form submission utilities
- `formValidation.ts` - Validation functions
- `index.ts` - Central exports

All functions have comprehensive JSDoc comments with examples.

## Questions?

For questions or issues with the form utilities, please:

1. Check the examples in this README
2. Review the test files for usage patterns
3. Read the JSDoc comments in the source code
4. Consult with the development team


