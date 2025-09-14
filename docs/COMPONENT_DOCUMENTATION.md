# Component Documentation

This document provides comprehensive documentation for all components in the new-smell project, organized by the Atomic Design pattern.

## Table of Contents

1. [Overview](#overview)
2. [Atomic Design Structure](#atomic-design-structure)
3. [Atoms](#atoms)
4. [Molecules](#molecules)
5. [Organisms](#organisms)
6. [Containers](#containers)
7. [Component Guidelines](#component-guidelines)
8. [Usage Examples](#usage-examples)
9. [Testing Guidelines](#testing-guidelines)

## Overview

The new-smell project follows the Atomic Design methodology, organizing components into a clear hierarchy:

- **Atoms**: Basic building blocks (buttons, inputs, labels)
- **Molecules**: Simple groups of atoms (search bars, form fields)
- **Organisms**: Complex UI components (headers, navigation, forms)
- **Containers**: Page-level components that orchestrate organisms

## Atomic Design Structure

```
app/components/
├── Atoms/           # Basic building blocks
├── Molecules/       # Simple component groups
├── Organisms/       # Complex UI components
└── Containers/      # Page-level components
```

## Atoms

### Button

**Location**: `app/components/Atoms/Button/`

**Purpose**: Reusable button component with multiple variants and states.

**Props**:

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
}
```

**Usage**:

```tsx
import { Button } from "~/components/Atoms/Button";

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>;
```

**Variants**:

- `primary`: Main action button (blue background)
- `secondary`: Secondary action (gray background)
- `danger`: Destructive action (red background)
- `ghost`: Minimal button (transparent background)

### Input

**Location**: `app/components/Atoms/Input/`

**Purpose**: Form input component with validation support.

**Props**:

```typescript
interface InputProps {
  type?: "text" | "email" | "password" | "tel" | "url";
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  helpText?: string;
  className?: string;
}
```

**Usage**:

```tsx
import Input from "~/components/Atoms/Input/Input";

<Input
  type="email"
  name="email"
  value={email}
  onChange={setEmail}
  placeholder="Enter your email"
  error={errors.email}
  label="Email Address"
/>;
```

### ValidationMessage

**Location**: `app/components/Atoms/ValidationMessage/`

**Purpose**: Displays validation errors, success messages, warnings, and info messages.

**Props**:

```typescript
interface ValidationMessageProps {
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}
```

**Usage**:

```tsx
import ValidationMessage from "~/components/Atoms/ValidationMessage/ValidationMessage";

<ValidationMessage error="This field is required" size="sm" showIcon={true} />;
```

### FormField

**Location**: `app/components/Atoms/FormField/`

**Purpose**: Wrapper component for form fields with validation support and accessibility.

**Props**:

```typescript
interface FormFieldProps {
  label?: string;
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  fieldClassName?: string;
  children: React.ReactNode;
  helpText?: string;
  showValidationIcon?: boolean;
}
```

**Usage**:

```tsx
import FormField from "~/components/Atoms/FormField/FormField";

<FormField
  label="Email Address"
  error={errors.email}
  required={true}
  helpText="We'll never share your email"
>
  <input type="email" {...inputProps} />
</FormField>;
```

### ValidatedInput

**Location**: `app/components/Atoms/ValidatedInput/`

**Purpose**: Input component with built-in validation and real-time feedback.

**Props**:

```typescript
interface ValidatedInputProps {
  name: string;
  label?: string;
  type?: "text" | "email" | "password" | "tel" | "url" | "number" | "search";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  validationSchema?: z.ZodSchema;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  showValidationIcon?: boolean;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  step?: number;
  min?: number;
  max?: number;
}
```

**Usage**:

```tsx
import ValidatedInput from '~/components/Atoms/ValidatedInput/ValidatedInput'
import { z } from 'zod'

const emailSchema = z.string().email('Invalid email format')

<ValidatedInput
  name="email"
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  validationSchema={emailSchema}
  validateOnChange={true}
  debounceMs={300}
/>
```

## Molecules

### SearchBar

**Location**: `app/components/Molecules/SearchBar/`

**Purpose**: Search input with clear button and loading state.

**Props**:

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}
```

**Usage**:

```tsx
import SearchBar from "~/components/Molecules/SearchBar/SearchBar";

<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  onClear={() => setSearchQuery("")}
  placeholder="Search perfumes..."
  loading={isSearching}
/>;
```

### FormFieldGroup

**Location**: `app/components/Molecules/FormFieldGroup/`

**Purpose**: Groups related form fields with consistent spacing and validation.

**Props**:

```typescript
interface FormFieldGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
  required?: boolean;
}
```

**Usage**:

```tsx
import FormFieldGroup from "~/components/Molecules/FormFieldGroup/FormFieldGroup";

<FormFieldGroup
  title="Personal Information"
  description="Enter your personal details"
  required={true}
>
  <Input name="firstName" label="First Name" />
  <Input name="lastName" label="Last Name" />
</FormFieldGroup>;
```

## Organisms

### Navigation

**Location**: `app/components/Organisms/Navigation/`

**Purpose**: Main navigation component with responsive design and user menu.

**Props**:

```typescript
interface NavigationProps {
  user?: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onProfile: () => void;
  className?: string;
}
```

**Usage**:

```tsx
import Navigation from "~/components/Organisms/Navigation/Navigation";

<Navigation
  user={user}
  onLogin={() => navigate("/login")}
  onLogout={handleLogout}
  onProfile={() => navigate("/profile")}
/>;
```

### PerfumeCard

**Location**: `app/components/Organisms/PerfumeCard/`

**Purpose**: Displays perfume information with rating, actions, and image.

**Props**:

```typescript
interface PerfumeCardProps {
  perfume: Perfume;
  onRate?: (rating: number) => void;
  onAddToWishlist?: () => void;
  onRemoveFromWishlist?: () => void;
  onViewDetails?: () => void;
  isInWishlist?: boolean;
  userRating?: number;
  className?: string;
}
```

**Usage**:

```tsx
import PerfumeCard from "~/components/Organisms/PerfumeCard/PerfumeCard";

<PerfumeCard
  perfume={perfume}
  onRate={handleRate}
  onAddToWishlist={handleAddToWishlist}
  isInWishlist={isInWishlist}
  userRating={userRating}
/>;
```

### RatingSystem

**Location**: `app/components/Organisms/RatingSystem/`

**Purpose**: Interactive rating system for perfumes with multiple categories.

**Props**:

```typescript
interface RatingSystemProps {
  perfumeId: string;
  initialRatings?: {
    longevity?: number;
    sillage?: number;
    gender?: number;
    priceValue?: number;
    overall?: number;
  };
  onRatingChange?: (ratings: RatingData) => void;
  disabled?: boolean;
  className?: string;
}
```

**Usage**:

```tsx
import RatingSystem from "~/components/Organisms/RatingSystem/RatingSystem";

<RatingSystem
  perfumeId={perfume.id}
  initialRatings={userRatings}
  onRatingChange={handleRatingChange}
/>;
```

## Containers

### ValidatedForm

**Location**: `app/components/Containers/ValidatedForm/`

**Purpose**: Form container with comprehensive validation and state management.

**Props**:

```typescript
interface ValidatedFormProps<T extends Record<string, unknown>> {
  schema: ZodSchema<T>;
  initialValues: T;
  onSubmit: (data: T) => Promise<void> | void;
  onReset?: () => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  debounceMs?: number;
  transform?: (data: T) => T;
  className?: string;
  children: (form: FormState<T>) => React.ReactNode;
}
```

**Usage**:

```tsx
import ValidatedForm from "~/components/Containers/ValidatedForm/ValidatedForm";
import { UserFormSchema } from "~/utils/formValidationSchemas";

<ValidatedForm
  schema={UserFormSchema}
  initialValues={{ email: "", password: "" }}
  onSubmit={handleSubmit}
  validateOnChange={true}
  validateOnBlur={true}
>
  {({ values, errors, handleChange, handleBlur, isSubmitting }) => (
    <div>
      <ValidatedInput
        name="email"
        value={values.email}
        onChange={handleChange("email")}
        onBlur={handleBlur("email")}
        error={errors.email}
      />
      <Button type="submit" disabled={isSubmitting}>
        Submit
      </Button>
    </div>
  )}
</ValidatedForm>;
```

### PerfumeList

**Location**: `app/components/Containers/PerfumeList/`

**Purpose**: Displays a list of perfumes with filtering, sorting, and pagination.

**Props**:

```typescript
interface PerfumeListProps {
  perfumes: Perfume[];
  loading?: boolean;
  error?: string;
  onPerfumeSelect?: (perfume: Perfume) => void;
  onPerfumeRate?: (perfumeId: string, rating: number) => void;
  onPerfumeWishlist?: (perfumeId: string, action: "add" | "remove") => void;
  filters?: PerfumeFilters;
  onFiltersChange?: (filters: PerfumeFilters) => void;
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  pagination?: PaginationData;
  onPageChange?: (page: number) => void;
  className?: string;
}
```

**Usage**:

```tsx
import PerfumeList from "~/components/Containers/PerfumeList/PerfumeList";

<PerfumeList
  perfumes={perfumes}
  loading={isLoading}
  onPerfumeSelect={handlePerfumeSelect}
  onPerfumeRate={handlePerfumeRate}
  filters={filters}
  onFiltersChange={setFilters}
  pagination={pagination}
  onPageChange={setPage}
/>;
```

## Component Guidelines

### Naming Conventions

1. **Component Names**: PascalCase (e.g., `PerfumeCard`, `ValidatedInput`)
2. **File Names**: Match component name (e.g., `PerfumeCard.tsx`)
3. **Directory Names**: Match component name (e.g., `PerfumeCard/`)
4. **Props Interfaces**: Component name + "Props" (e.g., `PerfumeCardProps`)

### File Structure

Each component should follow this structure:

```
ComponentName/
├── ComponentName.tsx          # Main component
├── ComponentName.test.tsx     # Tests
├── ComponentName.stories.tsx  # Storybook stories
├── index.ts                   # Barrel export
└── README.md                  # Component documentation
```

### Props Design

1. **Required Props**: Keep to minimum, use sensible defaults
2. **Optional Props**: Provide clear defaults
3. **Event Handlers**: Use descriptive names (e.g., `onPerfumeSelect`)
4. **Children**: Use `React.ReactNode` for flexibility
5. **Styling**: Provide `className` prop for customization

### Accessibility

1. **ARIA Attributes**: Include proper ARIA labels and descriptions
2. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
3. **Screen Readers**: Provide meaningful text alternatives
4. **Focus Management**: Handle focus states appropriately
5. **Color Contrast**: Ensure sufficient color contrast

### Error Handling

1. **Error Props**: Include error display props
2. **Validation**: Integrate with validation system
3. **Loading States**: Provide loading state indicators
4. **Fallbacks**: Include fallback UI for error states

## Usage Examples

### Basic Form with Validation

```tsx
import { useValidation } from "~/hooks/useValidation";
import { UserFormSchema } from "~/utils/formValidationSchemas";
import ValidatedInput from "~/components/Atoms/ValidatedInput/ValidatedInput";
import { Button } from "~/components/Atoms/Button/Button";

function UserForm() {
  const form = useValidation({
    schema: UserFormSchema,
    initialValues: { email: "", password: "" },
    onSubmit: async (data) => {
      await submitUser(data);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <ValidatedInput
        name="email"
        label="Email"
        type="email"
        value={form.values.email}
        onChange={form.handleChange("email")}
        onBlur={form.handleBlur("email")}
        error={form.errors.email}
        required
      />

      <ValidatedInput
        name="password"
        label="Password"
        type="password"
        value={form.values.password}
        onChange={form.handleChange("password")}
        onBlur={form.handleBlur("password")}
        error={form.errors.password}
        required
      />

      <Button
        type="submit"
        disabled={!form.isValid || form.isSubmitting}
        loading={form.isSubmitting}
      >
        {form.isSubmitting ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
}
```

### Perfume List with Filtering

```tsx
import PerfumeList from "~/components/Containers/PerfumeList/PerfumeList";
import { usePerfumeFilters } from "~/hooks/usePerfumeFilters";

function PerfumeCatalog() {
  const { filters, setFilters, perfumes, loading, error } = usePerfumeFilters();

  return (
    <div className="perfume-catalog">
      <h1>Perfume Catalog</h1>

      <PerfumeList
        perfumes={perfumes}
        loading={loading}
        error={error}
        filters={filters}
        onFiltersChange={setFilters}
        onPerfumeSelect={(perfume) => navigate(`/perfumes/${perfume.id}`)}
        onPerfumeRate={handlePerfumeRate}
        onPerfumeWishlist={handlePerfumeWishlist}
      />
    </div>
  );
}
```

## Testing Guidelines

### Unit Testing

Each component should have comprehensive unit tests:

```tsx
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
});
```

### Integration Testing

Test components working together:

```tsx
import { render, screen } from "@testing-library/react";
import ValidatedForm from "~/components/Containers/ValidatedForm/ValidatedForm";
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
    expect(handleSubmit).not.toHaveBeenCalled(); // Should not submit with invalid data
  });
});
```

### Accessibility Testing

Test accessibility features:

```tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "~/components/Atoms/Button/Button";

expect.extend(toHaveNoViolations);

describe("Button Accessibility", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Best Practices

### Component Design

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition to build complex components
3. **Props Interface**: Always define clear TypeScript interfaces
4. **Default Props**: Provide sensible defaults for optional props
5. **Error Boundaries**: Wrap components in error boundaries when appropriate

### Performance

1. **Memoization**: Use `React.memo` for expensive components
2. **Callback Optimization**: Use `useCallback` for event handlers
3. **Lazy Loading**: Implement lazy loading for large components
4. **Bundle Splitting**: Split components into separate chunks when needed

### Maintainability

1. **Documentation**: Document all props and usage examples
2. **Type Safety**: Use TypeScript for all components
3. **Testing**: Maintain high test coverage
4. **Consistent Patterns**: Follow established patterns throughout the codebase

### Accessibility

1. **Semantic HTML**: Use appropriate HTML elements
2. **ARIA Labels**: Provide proper ARIA labels and descriptions
3. **Keyboard Navigation**: Ensure keyboard accessibility
4. **Screen Reader Support**: Test with screen readers
5. **Color Contrast**: Maintain sufficient color contrast ratios

This documentation provides a comprehensive guide for understanding, using, and maintaining the component library in the new-smell project.
