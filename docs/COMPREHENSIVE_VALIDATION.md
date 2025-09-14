# Comprehensive Validation System

This document outlines the comprehensive validation system implemented in the new-smell project, providing detailed information about validation patterns, utilities, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Validation Architecture](#validation-architecture)
3. [Form Validation](#form-validation)
4. [API Validation](#api-validation)
5. [Data Validation](#data-validation)
6. [Client-Side Validation](#client-side-validation)
7. [Validation Schemas](#validation-schemas)
8. [Validation Utilities](#validation-utilities)
9. [Error Handling](#error-handling)
10. [Testing](#testing)
11. [Best Practices](#best-practices)

## Overview

The comprehensive validation system provides:

- **Multi-layer validation**: Client-side, server-side, and database validation
- **Type safety**: Full TypeScript support with Zod schemas
- **Real-time feedback**: Live validation with debounced input
- **Consistent error handling**: Standardized error messages and responses
- **Performance optimization**: Efficient validation with minimal re-renders
- **Accessibility**: ARIA attributes and screen reader support

## Validation Architecture

### Core Components

```
app/utils/validation/
├── index.ts                 # Core validation utilities
├── formValidationSchemas.ts # Zod schemas for all forms
└── validation.server.ts     # Server-side validation helpers

app/hooks/
└── useValidation.ts         # React validation hooks

app/components/
├── Atoms/
│   ├── ValidationMessage/   # Error/success message component
│   ├── FormField/          # Form field wrapper with validation
│   └── ValidatedInput/     # Input component with validation
└── Containers/
    └── ValidatedForm/      # Form container with validation
```

### Validation Flow

1. **Client-side validation**: Real-time validation as user types
2. **Form submission**: Comprehensive validation before submission
3. **API validation**: Server-side validation of all incoming data
4. **Data validation**: Database-level validation and constraints
5. **Response validation**: Validation of outgoing data

## Form Validation

### Using the Validation Hook

```typescript
import { useValidation } from "~/hooks/useValidation";
import { UserFormSchema } from "~/utils/formValidationSchemas";

function UserForm() {
  const form = useValidation({
    schema: UserFormSchema,
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async (data) => {
      // Handle form submission
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        value={form.values.email}
        onChange={form.handleChange("email")}
        onBlur={form.handleBlur("email")}
      />
      {form.errors.email && <span>{form.errors.email}</span>}
    </form>
  );
}
```

### Using Validated Components

```typescript
import ValidatedForm from "~/components/Containers/ValidatedForm/ValidatedForm";
import ValidatedInput from "~/components/Atoms/ValidatedInput/ValidatedInput";

function UserForm() {
  return (
    <ValidatedForm
      schema={UserFormSchema}
      initialValues={{ email: "", password: "" }}
      onSubmit={async (data) => {
        // Handle submission
      }}
    >
      {({ values, errors, handleChange, handleBlur }) => (
        <ValidatedInput
          name="email"
          label="Email"
          value={values.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          error={errors.email}
          validationSchema={UserFormSchema.shape.email}
        />
      )}
    </ValidatedForm>
  );
}
```

## API Validation

### Using Validation Middleware

```typescript
import { createApiValidationMiddleware } from "~/utils/api-validation.server";
import { CreatePerfumeSchema } from "~/utils/formValidationSchemas";

const validatePerfumeCreation = createApiValidationMiddleware({
  body: CreatePerfumeSchema,
  query: z.object({
    includeRatings: z.boolean().optional(),
  }),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { body, query } = await validatePerfumeCreation(request);

    // body is validated and typed
    const perfume = await createPerfume(body);

    return json({ success: true, data: perfume });
  } catch (error) {
    if (error instanceof Response) {
      return error; // Validation error response
    }
    throw error;
  }
};
```

### Manual API Validation

```typescript
import {
  validateJsonData,
  createValidationErrorResponse,
} from "~/utils/validation";

export const action = async ({ request }: ActionFunctionArgs) => {
  const validation = await validateJsonData(CreatePerfumeSchema, request);

  if (!validation.success) {
    return createValidationErrorResponse(validation.errors!);
  }

  const perfume = await createPerfume(validation.data);
  return json({ success: true, data: perfume });
};
```

## Data Validation

### Database Model Validation

```typescript
// In your model files
import { z } from "zod";
import { validateData } from "~/utils/validation";

const PerfumeModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  price: z.number().positive().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export async function createPerfume(data: unknown) {
  const validation = validateData(PerfumeModelSchema, data);

  if (!validation.success) {
    throw new Error(
      `Validation failed: ${validation.errors
        ?.map((e) => e.message)
        .join(", ")}`
    );
  }

  // Proceed with database operation
  return await db.perfume.create({ data: validation.data });
}
```

### Input Sanitization

```typescript
import { validateAndSanitize } from "~/utils/validation";

export async function processUserInput(data: unknown) {
  const validation = validateAndSanitize(UserFormSchema, data);

  if (!validation.success) {
    throw new Error("Invalid input data");
  }

  // Data is validated and sanitized
  return validation.data;
}
```

## Client-Side Validation

### Real-time Validation

```typescript
import { useFieldValidation } from "~/hooks/useValidation";

function EmailInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { error, isValidating } = useFieldValidation(
    z.string().email(),
    "email",
    value,
    { validateOnChange: true, debounceMs: 300 }
  );

  return (
    <div>
      <input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-red-500" : ""}
      />
      {error && <span className="text-red-500">{error}</span>}
      {isValidating && <span>Validating...</span>}
    </div>
  );
}
```

### Form State Management

```typescript
import { useValidation } from "~/hooks/useValidation";

function MyForm() {
  const form = useValidation({
    schema: MyFormSchema,
    initialValues: { name: "", email: "" },
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <label>Name</label>
        <input
          value={form.values.name}
          onChange={form.handleChange("name")}
          onBlur={form.handleBlur("name")}
        />
        {form.touched.name && form.errors.name && (
          <span className="error">{form.errors.name}</span>
        )}
      </div>

      <button type="submit" disabled={!form.isValid || form.isSubmitting}>
        {form.isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

## Validation Schemas

### Available Schemas

All validation schemas are defined in `app/utils/formValidationSchemas.ts`:

```typescript
import { validationSchemas } from "~/utils/formValidationSchemas";

// Perfume House
validationSchemas.createPerfumeHouse;
validationSchemas.updatePerfumeHouse;

// Perfume
validationSchemas.createPerfume;
validationSchemas.updatePerfume;
validationSchemas.updateUserPerfume;

// Rating
validationSchemas.createRating;
validationSchemas.updateRating;

// Comment
validationSchemas.createComment;
validationSchemas.updateComment;

// Wishlist
validationSchemas.wishlistAction;

// User Authentication
validationSchemas.userForm;
validationSchemas.userLogin;
validationSchemas.changePassword;
validationSchemas.forgotPassword;
validationSchemas.resetPassword;
validationSchemas.updateProfile;

// Search and Filter
validationSchemas.perfumeSearch;

// Admin
validationSchemas.adminUserForm;
validationSchemas.dataQualityReport;
```

### Creating Custom Schemas

```typescript
import { z } from "zod";

const CustomSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  email: z.string().email("Please enter a valid email address"),
  age: z
    .number()
    .min(18, "Must be at least 18 years old")
    .max(120, "Must be less than 120 years old"),
});

// Use in validation
const validation = validateData(CustomSchema, data);
```

## Validation Utilities

### Core Validation Functions

```typescript
import {
  validateData, // Validate any data against a schema
  validateFormData, // Validate FormData
  validateJsonData, // Validate JSON from request
  validateSearchParams, // Validate URL search parameters
  validateAndSanitize, // Validate and sanitize data
  validateId, // Validate ID format
  validateEmail, // Validate email format
  validatePassword, // Validate password strength
  validateUrl, // Validate URL format
  validatePhone, // Validate phone number
  validateYear, // Validate year format
  validateRating, // Validate rating (1-5)
  validateAmount, // Validate amount/price
  validateEnum, // Validate enum value
  validateArray, // Validate array of values
  validateObject, // Validate object properties
} from "~/utils/validation";
```

### Server-Side Validation Helpers

```typescript
import {
  validatePerfumeId,
  validateUserId,
  validateActionType,
  validateRatingValue,
  validateAmountValue,
  validateEmailValue,
  validatePasswordValue,
  validateUrlValue,
  validatePhoneValue,
  validateYearValue,
  commonValidationSchemas,
} from "~/utils/validation.server";
```

## Error Handling

### Validation Error Response Format

```typescript
interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: unknown;
}

interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  error?: string;
}
```

### Error Response Examples

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address",
      "code": "invalid_string",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long",
      "code": "too_small",
      "value": "weak"
    }
  ]
}
```

### Handling Validation Errors

```typescript
// In API routes
export const action = async ({ request }: ActionFunctionArgs) => {
  const validation = await validateJsonData(MySchema, request);

  if (!validation.success) {
    return createValidationErrorResponse(validation.errors!);
  }

  // Process validated data
};

// In React components
const form = useValidation({
  schema: MySchema,
  initialValues: {},
  onSubmit: async (data) => {
    try {
      await submitData(data);
    } catch (error) {
      if (error.response?.data?.errors) {
        form.setErrors(error.response.data.errors);
      }
    }
  },
});
```

## Testing

### Validation Tests

```typescript
import { describe, it, expect } from "vitest";
import { validateData } from "~/utils/validation";
import { CreatePerfumeSchema } from "~/utils/formValidationSchemas";

describe("Perfume Validation", () => {
  it("should validate valid perfume data", () => {
    const validData = {
      name: "Test Perfume",
      description: "A test perfume",
      house: "house-id",
      image: "https://example.com/image.jpg",
    };

    const result = validateData(CreatePerfumeSchema, validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid perfume data", () => {
    const invalidData = {
      name: "A", // Too short
      description: "Short", // Too short
      house: "", // Empty
      image: "not-a-url",
    };

    const result = validateData(CreatePerfumeSchema, invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(4);
  });
});
```

### Hook Tests

```typescript
import { renderHook, act } from "@testing-library/react";
import { useValidation } from "~/hooks/useValidation";

describe("useValidation Hook", () => {
  it("should validate form data", async () => {
    const { result } = renderHook(() =>
      useValidation({
        schema: MySchema,
        initialValues: { name: "", email: "" },
        onSubmit: vi.fn(),
      })
    );

    act(() => {
      result.current.setValue("name", "John Doe");
    });

    expect(result.current.values.name).toBe("John Doe");
    expect(result.current.isDirty).toBe(true);
  });
});
```

## Best Practices

### 1. Schema Design

- **Use descriptive error messages**: Make error messages user-friendly
- **Validate at the right level**: Client-side for UX, server-side for security
- **Use consistent patterns**: Follow the same validation patterns across the app
- **Keep schemas focused**: One schema per form/API endpoint

### 2. Error Handling

- **Provide clear feedback**: Show users exactly what's wrong
- **Use appropriate error levels**: Error, warning, info, success
- **Handle edge cases**: Empty values, null, undefined
- **Log validation errors**: For debugging and monitoring

### 3. Performance

- **Debounce validation**: Avoid validating on every keystroke
- **Lazy validation**: Only validate when necessary
- **Cache validation results**: For expensive validations
- **Use appropriate validation timing**: onChange, onBlur, onSubmit

### 4. Accessibility

- **Use ARIA attributes**: aria-invalid, aria-describedby
- **Provide error descriptions**: Screen reader accessible
- **Use semantic HTML**: Proper form structure
- **Focus management**: Focus on errors when they occur

### 5. Security

- **Validate on server**: Never trust client-side validation
- **Sanitize input**: Remove potentially harmful content
- **Use CSRF protection**: Validate CSRF tokens
- **Rate limiting**: Prevent abuse of validation endpoints

### 6. Testing

- **Test all validation paths**: Valid and invalid data
- **Test edge cases**: Empty, null, undefined values
- **Test error messages**: Ensure they're helpful
- **Test accessibility**: Screen reader compatibility

## Migration Guide

### From Basic Validation

1. **Replace manual validation** with Zod schemas
2. **Update form components** to use validation hooks
3. **Add server-side validation** to all API endpoints
4. **Implement error handling** with consistent patterns

### Example Migration

```typescript
// Before
function validateEmail(email: string) {
  if (!email.includes("@")) {
    return "Invalid email";
  }
  return null;
}

// After
const emailSchema = z.string().email("Please enter a valid email address");
const validation = validateData(emailSchema, { email });
```

## Conclusion

The comprehensive validation system provides a robust, type-safe, and user-friendly way to validate data throughout the application. By following the patterns and best practices outlined in this document, you can ensure data integrity, improve user experience, and maintain code quality.

For questions or issues with the validation system, please refer to the test files or create an issue in the project repository.
