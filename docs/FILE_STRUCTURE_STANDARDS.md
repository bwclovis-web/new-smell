# File Structure Standards

## Overview

This document defines the standardized file structure and naming conventions for the Voodoo Perfumes project to ensure consistency, maintainability, and developer experience.

## Component Structure Standards

### Atomic Design Pattern

All components follow the Atomic Design pattern with clear hierarchy:

```
app/components/
├── Atoms/           # Basic building blocks
├── Molecules/       # Simple combinations of atoms
├── Organisms/       # Complex UI components
└── Containers/      # Page-level components
```

### Component Directory Structure

Each component MUST follow this standardized structure:

```
ComponentName/
├── ComponentName.tsx           # Main component file
├── ComponentName.test.tsx      # Test file
├── componentName-variants.ts   # Styling variants (camelCase)
├── index.ts                    # Barrel export file
└── README.md                   # Documentation (optional)
```

### File Naming Conventions

#### Components

- **Component files**: `PascalCase.tsx` (e.g., `Button.tsx`)
- **Test files**: `PascalCase.test.tsx` (e.g., `Button.test.tsx`)
- **Variant files**: `camelCase-variants.ts` (e.g., `button-variants.ts`)
- **Index files**: `index.ts` (always lowercase)

#### Utilities and Hooks

- **Utility files**: `camelCase.ts` (e.g., `styleUtils.ts`)
- **Hook files**: `useCamelCase.ts` (e.g., `useRangeSlider.ts`)
- **Server files**: `camelCase.server.ts` (e.g., `auth.server.ts`)

#### Routes

- **Route files**: `kebab-case.tsx` (e.g., `perfume-house.tsx`)
- **API routes**: `kebab-case.ts` (e.g., `create-perfume.ts`)

### Export Patterns

#### Components

All components MUST use this export pattern:

```typescript
// ComponentName.tsx
const ComponentName: FC<ComponentNameProps> = ({ ...props }) => {
  // component implementation
};

export default ComponentName;
```

#### Index Files

All component directories MUST have an index.ts file:

```typescript
// index.ts
export { default } from "./ComponentName";
```

#### Named Exports

For components that export multiple items:

```typescript
// ComponentName.tsx
export const ComponentName: FC<ComponentNameProps> = ({ ...props }) => {
  // implementation
};

export const ComponentNameVariant: FC<ComponentNameVariantProps> = ({
  ...props
}) => {
  // implementation
};
```

### Import Patterns

#### Component Imports

Always import from the component directory (not the specific file):

```typescript
// ✅ Correct
import Button from "~/components/Atoms/Button";
import SearchBar from "~/components/Organisms/SearchBar";

// ❌ Incorrect
import Button from "~/components/Atoms/Button/Button";
import SearchBar from "~/components/Organisms/SearchBar/SearchBar";
```

#### Utility Imports

Import utilities directly from their files:

```typescript
// ✅ Correct
import { styleMerge } from "~/utils/styleUtils";
import { useRangeSlider } from "~/hooks/useRangeSlider";
```

### Directory Organization

#### Components Directory

```
app/components/
├── Atoms/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── button-variants.ts
│   │   └── index.ts
│   └── Input/
│       ├── Input.tsx
│       ├── Input.test.tsx
│       ├── input-variants.ts
│       └── index.ts
├── Molecules/
│   └── SearchBar/
│       ├── SearchBar.tsx
│       ├── SearchBar.test.tsx
│       ├── searchbar-variants.ts
│       └── index.ts
├── Organisms/
│   └── Modal/
│       ├── Modal.tsx
│       ├── Modal.test.tsx
│       ├── modal-variants.ts
│       └── index.ts
└── Containers/
    └── PerfumeForm/
        ├── PerfumeForm.tsx
        ├── PerfumeForm.test.tsx
        └── index.ts
```

#### Utils Directory

```
app/utils/
├── styleUtils.ts
├── numberUtils.ts
├── auth.server.ts
├── security/
│   ├── session-manager.server.ts
│   └── password-security.server.ts
└── server/
    ├── csrf.server.ts
    └── utility.server.ts
```

#### Hooks Directory

```
app/hooks/
├── index.ts                    # Barrel export
├── useRangeSlider.ts
├── useModal.ts
└── useDataWithFilters.ts
```

#### Routes Directory

```
app/routes/
├── home.tsx
├── perfume.tsx
├── perfume-house.tsx
├── admin/
│   ├── adminIndex.tsx
│   ├── AdminLayout.tsx
│   └── security-monitor.tsx
├── api/
│   ├── create-perfume.ts
│   └── update-house.ts
└── login/
    ├── LoginLayout.tsx
    ├── SignInPage.tsx
    └── SignUpPage.tsx
```

### Special Files

#### Barrel Exports

Use barrel exports for related functionality:

```typescript
// app/hooks/index.ts
export { default as useRangeSlider } from "./useRangeSlider";
export { default as useModal } from "./useModal";
export { default as useDataWithFilters } from "./useDataWithFilters";
```

#### Type Definitions

Group related types in dedicated files:

```typescript
// app/types/components.ts
export interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export interface InputProps {
  type?: "text" | "email" | "password";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}
```

### File Size Guidelines

- **Components**: Maximum 200 lines per file
- **Utilities**: Maximum 150 lines per file
- **Hooks**: Maximum 100 lines per file
- **Routes**: Maximum 300 lines per file

If files exceed these limits, consider:

- Breaking into smaller components
- Extracting utility functions
- Creating sub-components
- Moving complex logic to custom hooks

### Testing Standards

#### Test File Structure

Every component MUST have a corresponding test file:

```typescript
// ComponentName.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ComponentName from "./ComponentName";

describe("ComponentName", () => {
  it("renders correctly", () => {
    render(<ComponentName />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

#### Test Coverage Requirements

- **Atoms**: 90% coverage
- **Molecules**: 85% coverage
- **Organisms**: 80% coverage
- **Containers**: 75% coverage

### Documentation Standards

#### Component Documentation

Each component directory SHOULD include a README.md:

````markdown
# ComponentName

Brief description of the component.

## Props

| Prop    | Type   | Default   | Description    |
| ------- | ------ | --------- | -------------- |
| variant | string | 'primary' | Button variant |
| size    | string | 'md'      | Button size    |

## Usage

```tsx
import ComponentName from "~/components/Atoms/ComponentName";

<ComponentName variant="primary" size="lg">
  Click me
</ComponentName>;
```
````

## Examples

[Link to Storybook stories or examples]

```

### Migration Guidelines

When migrating existing components to the new structure:

1. **Create standardized directory structure**
2. **Add index.ts barrel export**
3. **Update import statements throughout codebase**
4. **Ensure consistent naming conventions**
5. **Add missing test files**
6. **Update documentation**

### Enforcement

These standards are enforced through:
- ESLint rules for naming conventions
- Pre-commit hooks for file structure validation
- Code review requirements
- Automated testing for import patterns

## Benefits

- **Consistency**: Uniform structure across the entire codebase
- **Maintainability**: Easy to locate and modify files
- **Developer Experience**: Predictable patterns reduce cognitive load
- **Scalability**: Structure supports growth and team expansion
- **Testing**: Consistent test organization and coverage
- **Documentation**: Clear documentation patterns
```
