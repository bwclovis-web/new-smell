# Development Guidelines

This document outlines the development guidelines, coding standards, and best practices for the new-smell project.

## Table of Contents

1. [Overview](#overview)
2. [Code Standards](#code-standards)
3. [File Organization](#file-organization)
4. [Component Guidelines](#component-guidelines)
5. [API Guidelines](#api-guidelines)
6. [Testing Guidelines](#testing-guidelines)
7. [Git Workflow](#git-workflow)
8. [Performance Guidelines](#performance-guidelines)
9. [Security Guidelines](#security-guidelines)
10. [Documentation Guidelines](#documentation-guidelines)

## Overview

These guidelines ensure consistency, maintainability, and quality across the new-smell project. All team members should follow these standards to maintain code quality and facilitate collaboration.

## Code Standards

### TypeScript

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Avoid `any` types, use proper type definitions
- **Interfaces**: Define clear interfaces for all data structures
- **Generics**: Use generics for reusable components and functions
- **Type Guards**: Implement type guards for runtime type checking

```typescript
// ✅ Good
interface UserProps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

function UserCard({ user }: { user: UserProps }) {
  return (
    <div>
      {user.firstName} {user.lastName}
    </div>
  );
}

// ❌ Bad
function UserCard({ user }: { user: any }) {
  return (
    <div>
      {user.firstName} {user.lastName}
    </div>
  );
}
```

### Naming Conventions

- **Variables**: camelCase (`userName`, `isLoading`)
- **Functions**: camelCase (`getUserData`, `handleSubmit`)
- **Components**: PascalCase (`UserCard`, `PerfumeList`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRY_ATTEMPTS`)
- **Files**: kebab-case for utilities, PascalCase for components
- **Directories**: PascalCase for components, camelCase for utilities

```typescript
// ✅ Good
const MAX_RETRY_ATTEMPTS = 3;
const userEmail = "user@example.com";

function UserProfile() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUserUpdate = async () => {
    // Implementation
  };
}

// ❌ Bad
const max_retry_attempts = 3;
const user_email = "user@example.com";

function user_profile() {
  const [loading, setLoading] = useState(false);

  const handle_user_update = async () => {
    // Implementation
  };
}
```

### Code Formatting

- **Prettier**: Use Prettier for consistent formatting
- **ESLint**: Follow ESLint rules for code quality
- **Line Length**: Maximum 100 characters per line
- **Indentation**: 2 spaces for indentation
- **Semicolons**: Always use semicolons
- **Quotes**: Use single quotes for strings, double quotes for JSX attributes

```typescript
// ✅ Good
import { useState, useEffect } from "react";
import { Button } from "~/components/Atoms/Button/Button";

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
}

function UserCard({ user, onEdit }: UserCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Effect logic
  }, []);

  return (
    <div className="user-card">
      <h3>
        {user.firstName} {user.lastName}
      </h3>
      <Button onClick={() => onEdit(user)}>Edit User</Button>
    </div>
  );
}

// ❌ Bad
import { useState, useEffect } from "react";
import { Button } from "~/components/Atoms/Button/Button";

function UserCard({ user, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    // Effect logic
  }, []);
  return (
    <div className="user-card">
      <h3>
        {user.firstName} {user.lastName}
      </h3>
      <Button onClick={() => onEdit(user)}>Edit User</Button>
    </div>
  );
}
```

## File Organization

### Directory Structure

Follow the established atomic design pattern:

```
app/
├── components/
│   ├── Atoms/           # Basic building blocks
│   ├── Molecules/       # Simple component groups
│   ├── Organisms/       # Complex UI components
│   └── Containers/      # Page-level components
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── routes/              # Remix routes
└── styles/              # Global styles
```

### Component File Structure

Each component should follow this structure:

```
ComponentName/
├── ComponentName.tsx          # Main component
├── ComponentName.test.tsx     # Unit tests
├── ComponentName.stories.tsx  # Storybook stories
├── index.ts                   # Barrel export
└── README.md                  # Component documentation
```

### Import Organization

Organize imports in this order:

1. React and React-related imports
2. Third-party library imports
3. Internal utility imports
4. Component imports
5. Type imports

```typescript
// ✅ Good
import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { z } from "zod";

import { validateData } from "~/utils/validation";
import { Button } from "~/components/Atoms/Button/Button";
import { UserCard } from "~/components/Organisms/UserCard/UserCard";

import type { User, UserFormData } from "~/types";

// ❌ Bad
import { Button } from "~/components/Atoms/Button/Button";
import { useState, useEffect } from "react";
import { validateData } from "~/utils/validation";
import { z } from "zod";
import { useNavigate } from "@remix-run/react";
import type { User, UserFormData } from "~/types";
```

## Component Guidelines

### Component Design Principles

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition to build complex components
3. **Props Interface**: Always define clear TypeScript interfaces
4. **Default Props**: Provide sensible defaults for optional props
5. **Error Boundaries**: Wrap components in error boundaries when appropriate

### Component Structure

```typescript
// ✅ Good component structure
import { useState, useEffect } from "react";
import { Button } from "~/components/Atoms/Button/Button";
import type { UserCardProps } from "./UserCard.types";

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  className?: string;
}

export function UserCard({
  user,
  onEdit,
  onDelete,
  className = "",
}: UserCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    onEdit(user);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(user.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`user-card ${className}`}>
      <h3>
        {user.firstName} {user.lastName}
      </h3>
      <p>{user.email}</p>
      <div className="user-card__actions">
        <Button onClick={handleEdit}>Edit</Button>
        <Button variant="danger" onClick={handleDelete} loading={isLoading}>
          Delete
        </Button>
      </div>
    </div>
  );
}
```

### Props Design

- **Required Props**: Keep to minimum, use sensible defaults
- **Optional Props**: Provide clear defaults
- **Event Handlers**: Use descriptive names (e.g., `onPerfumeSelect`)
- **Children**: Use `React.ReactNode` for flexibility
- **Styling**: Provide `className` prop for customization

### State Management

- **Local State**: Use `useState` for component-specific state
- **Shared State**: Use context or state management library
- **Server State**: Use Remix loaders and actions
- **Form State**: Use validation hooks for form state

```typescript
// ✅ Good state management
function PerfumeList() {
  const [filters, setFilters] = useState<PerfumeFilters>({});
  const [sortBy, setSortBy] = useState("name");
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = useCallback((newFilters: PerfumeFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  // Component logic
}

// ❌ Bad state management
function PerfumeList() {
  const [state, setState] = useState({
    filters: {},
    sortBy: "name",
    isLoading: false,
    error: null,
    data: [],
  });

  const handleFilterChange = (newFilters) => {
    setState((prev) => ({ ...prev, filters: newFilters }));
  };
}
```

## API Guidelines

### Endpoint Design

- **RESTful**: Follow REST conventions
- **Consistent Naming**: Use consistent naming patterns
- **HTTP Methods**: Use appropriate HTTP methods
- **Status Codes**: Return appropriate status codes
- **Error Handling**: Provide consistent error responses

### Request/Response Format

```typescript
// ✅ Good API response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  timestamp: string;
}

// ✅ Good error response
interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}
```

### Validation

- **Input Validation**: Validate all inputs using Zod schemas
- **Output Validation**: Validate responses before sending
- **Error Messages**: Provide clear, actionable error messages
- **Sanitization**: Sanitize inputs to prevent XSS

```typescript
// ✅ Good API validation
import { z } from "zod";
import { validateData } from "~/utils/validation";

const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const userData = Object.fromEntries(formData);

  const validation = validateData(CreateUserSchema, userData);

  if (!validation.success) {
    return createValidationErrorResponse(validation.errors!);
  }

  // Process validated data
  const user = await createUser(validation.data);
  return createSuccessResponse(user);
};
```

## Testing Guidelines

### Unit Testing

- **Coverage**: Aim for 90%+ test coverage
- **Test Structure**: Use Arrange-Act-Assert pattern
- **Test Names**: Use descriptive test names
- **Mocking**: Mock external dependencies
- **Edge Cases**: Test edge cases and error conditions

```typescript
// ✅ Good unit test
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "~/components/Atoms/Button/Button";

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDisabled();
  });

  it("shows loading state when loading prop is true", () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
```

### Integration Testing

- **Component Integration**: Test components working together
- **API Integration**: Test API endpoints
- **User Flows**: Test complete user workflows
- **Error Scenarios**: Test error handling

```typescript
// ✅ Good integration test
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ValidatedForm } from "~/components/Containers/ValidatedForm/ValidatedForm";
import { UserFormSchema } from "~/utils/formValidationSchemas";

describe("ValidatedForm Integration", () => {
  it("validates form data on submit", async () => {
    const handleSubmit = vi.fn();

    render(
      <ValidatedForm
        schema={UserFormSchema}
        initialValues={{ email: "", password: "" }}
        onSubmit={handleSubmit}
      >
        {({ values, errors, handleChange, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <input
              name="email"
              value={values.email}
              onChange={(e) => handleChange("email")(e.target.value)}
            />
            <button type="submit">Submit</button>
          </form>
        )}
      </ValidatedForm>
    );

    fireEvent.click(screen.getByText("Submit"));
    await waitFor(() => {
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });
});
```

### E2E Testing

- **Critical Paths**: Test critical user journeys
- **Cross-Browser**: Test on multiple browsers
- **Mobile**: Test on mobile devices
- **Performance**: Test performance requirements

## Git Workflow

### Branch Naming

- **Feature branches**: `feature/description` (e.g., `feature/user-authentication`)
- **Bug fixes**: `fix/description` (e.g., `fix/login-validation`)
- **Hotfixes**: `hotfix/description` (e.g., `hotfix/security-patch`)
- **Chores**: `chore/description` (e.g., `chore/update-dependencies`)

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:

```
feat(auth): add user registration form
fix(validation): correct email validation regex
docs(api): update authentication endpoints
refactor(components): extract common form logic
```

### Pull Request Process

1. **Create Feature Branch**: From main branch
2. **Implement Changes**: Follow coding standards
3. **Write Tests**: Add/update tests
4. **Update Documentation**: Update relevant docs
5. **Create PR**: With descriptive title and description
6. **Code Review**: Address review feedback
7. **Merge**: After approval and CI passes

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Performance Guidelines

### React Performance

- **Memoization**: Use `React.memo` for expensive components
- **Callback Optimization**: Use `useCallback` for event handlers
- **Effect Dependencies**: Proper dependency arrays
- **Lazy Loading**: Implement lazy loading for large components

```typescript
// ✅ Good performance practices
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  const handleUpdate = useCallback(
    (id: string) => {
      onUpdate(id);
    },
    [onUpdate]
  );

  const processedData = useMemo(() => {
    return data.map((item) => processItem(item));
  }, [data]);

  return (
    <div>
      {processedData.map((item) => (
        <Item key={item.id} data={item} onUpdate={handleUpdate} />
      ))}
    </div>
  );
});

// ❌ Bad performance practices
function ExpensiveComponent({ data, onUpdate }) {
  const handleUpdate = (id) => {
    onUpdate(id);
  };

  const processedData = data.map((item) => processItem(item));

  return (
    <div>
      {processedData.map((item) => (
        <Item key={item.id} data={item} onUpdate={handleUpdate} />
      ))}
    </div>
  );
}
```

### Bundle Optimization

- **Code Splitting**: Split code into chunks
- **Tree Shaking**: Remove unused code
- **Dynamic Imports**: Use dynamic imports for large dependencies
- **Image Optimization**: Optimize images and use appropriate formats

### Database Performance

- **Indexing**: Add proper database indexes
- **Query Optimization**: Optimize database queries
- **Connection Pooling**: Use connection pooling
- **Caching**: Implement appropriate caching strategies

## Security Guidelines

### Input Validation

- **Server-Side Validation**: Always validate on server
- **Input Sanitization**: Sanitize all inputs
- **Type Validation**: Validate data types
- **Length Validation**: Validate input lengths

### Authentication & Authorization

- **JWT Tokens**: Use secure JWT tokens
- **Password Hashing**: Use bcrypt for password hashing
- **Session Management**: Implement secure session management
- **Role-Based Access**: Implement proper authorization

### Data Protection

- **Encryption**: Encrypt sensitive data
- **HTTPS**: Use HTTPS for all communications
- **CORS**: Configure CORS properly
- **Rate Limiting**: Implement rate limiting

```typescript
// ✅ Good security practices
import bcrypt from "bcrypt";
import { z } from "zod";

const UserSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
});

export async function createUser(userData: unknown) {
  const validation = validateData(UserSchema, userData);

  if (!validation.success) {
    throw new Error("Invalid user data");
  }

  const { password, ...userData } = validation.data;
  const hashedPassword = await bcrypt.hash(password, 12);

  return await db.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });
}
```

## Documentation Guidelines

### Code Documentation

- **JSDoc Comments**: Document all public functions
- **Type Definitions**: Document all interfaces and types
- **README Files**: Include README for each major component
- **Inline Comments**: Add comments for complex logic

````typescript
/**
 * Validates user input data against a schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success status and data/errors
 * @example
 * ```typescript
 * const result = validateData(UserSchema, userData)
 * if (result.success) {
 *   console.log('Valid data:', result.data)
 * } else {
 *   console.log('Validation errors:', result.errors)
 * }
 * ```
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  // Implementation
}
````

### API Documentation

- **Endpoint Documentation**: Document all API endpoints
- **Request/Response Examples**: Include examples
- **Error Codes**: Document all error codes
- **Authentication**: Document authentication requirements

### Component Documentation

- **Props Documentation**: Document all props
- **Usage Examples**: Include usage examples
- **Storybook Stories**: Create Storybook stories
- **Accessibility Notes**: Document accessibility features

## Conclusion

Following these guidelines ensures:

- **Consistency**: Consistent code across the project
- **Maintainability**: Easy to maintain and extend
- **Quality**: High code quality and reliability
- **Collaboration**: Smooth collaboration between team members
- **Performance**: Optimal performance and user experience

For questions about these guidelines or suggestions for improvements, please create an issue in the project repository.
