# CSS & Tailwind Styles Guide

## Styling Philosophy

### Utility-First with Tailwind CSS v4.0 (Beta)

- **Primary Approach**: Use Tailwind utility classes for styling components
- **Component Variants**: Class Variance Authority (CVA) for managing component state variations
- **Avoid Global Styles**: Keep styling at component level for maintainability
- **Performance**: Leverage Tailwind's purging for optimal bundle size

## Tailwind CSS Patterns

### Basic Utility Usage

Use Tailwind utilities directly in component className attributes:

```tsx
// Good - Direct utility classes
const Card = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Card Title</h2>
    <p className="text-gray-600 leading-relaxed">Card content</p>
  </div>
);
```

### Responsive Design

Use Tailwind's responsive prefixes for different screen sizes:

```tsx
// Good - Responsive utilities
const ResponsiveGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <div className="p-4 text-sm md:text-base lg:text-lg">
      Responsive content
    </div>
  </div>
);
```

### State-Based Styling

Use pseudo-class modifiers for interactive states:

```tsx
// Good - State modifiers
const Button = () => (
  <button
    className="
    bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 
    text-white px-4 py-2 rounded-md
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  "
  >
    Click me
  </button>
);
```

## Class Variance Authority (CVA) Integration

### Component Variants Structure

Use CVA for managing component variations and maintaining consistency:

```tsx
// component-variants.ts
import { cva, VariantProps } from "class-variance-authority";

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export const buttonVariants = cva(
  [
    // Base styles - always applied
    "inline-flex items-center justify-center rounded-md font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        outline:
          "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
        ghost: "text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-500",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    compoundVariants: [
      {
        variant: "destructive",
        size: "sm",
        class: "text-xs font-semibold",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Using CVA in Components

Integrate CVA variants with component props and styleMerge utility:

```tsx
// Button.tsx
import { VariantProps } from "class-variance-authority";
import { FC, ButtonHTMLAttributes } from "react";
import { styleMerge } from "@/utils/styleUtils";
import { buttonVariants } from "./button-variants";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

const Button: FC<ButtonProps> = ({
  className,
  variant,
  size,
  children,
  ...props
}) => (
  <button
    className={styleMerge(buttonVariants({ variant, size, className }))}
    {...props}
  >
    {children}
  </button>
);

export default Button;
```

## Custom Design Tokens

### AtomLab Color System

Use custom color tokens defined in your design system:

```tsx
// Good - Using custom AtomLab colors
const ScientificCard = () => (
  <div className="bg-white border border-atom-gray-4 text-atom-gray-19">
    <div className="bg-atom-gray-22 text-white p-4">Instrument Status</div>
    <div className="p-6 text-atom-gray-1">Temperature: 25.4°C</div>
  </div>
);
```

### Common AtomLab Patterns

Frequently used color combinations in the scientific interface:

```tsx
// Status indicators
const statusClasses = {
  online: "bg-green-100 text-green-800 border-green-200",
  offline: "bg-red-100 text-red-800 border-red-200",
  calibrating: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-50 text-red-900 border-red-300",
};

// Data display
const dataDisplayClasses = {
  label: "text-atom-gray-19 text-sm font-medium",
  value: "text-atom-gray-1 text-lg font-semibold",
  unit: "text-atom-gray-13 text-sm ml-1",
};
```

## Layout & Spacing

### Grid Systems

Use CSS Grid and Flexbox for layouts:

```tsx
// Good - Dashboard layout
const DashboardLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* Sidebar */}
      <aside className="col-span-12 lg:col-span-3">
        <nav className="space-y-2">{/* Navigation items */}</nav>
      </aside>

      {/* Main content */}
      <main className="col-span-12 lg:col-span-9">
        <div className="space-y-6">{/* Content cards */}</div>
      </main>
    </div>
  </div>
);
```

### Consistent Spacing

Use Tailwind's spacing scale consistently:

```tsx
// Good - Consistent spacing
const InstrumentCard = () => (
  <div className="space-y-4 p-6">
    {" "}
    {/* Outer spacing */}
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">Temperature Probe</h3>
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
        Online
      </span>
    </div>
    <div className="space-y-2">
      {" "}
      {/* Inner spacing */}
      <div className="flex justify-between">
        <span className="text-sm text-gray-600">Current Reading</span>
        <span className="font-medium">25.4°C</span>
      </div>
    </div>
  </div>
);
```

## Accessibility & Focus States

### Focus Management

Ensure proper focus states for keyboard navigation:

```tsx
// Good - Accessible focus states
const AccessibleButton = () => (
  <button
    className="
    px-4 py-2 bg-blue-600 text-white rounded-md
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    hover:bg-blue-700 transition-colors
  "
  >
    Calibrate Instrument
  </button>
);
```

### High Contrast Support

Ensure sufficient color contrast for scientific data:

```tsx
// Good - High contrast for data readability
const DataDisplay = () => (
  <div className="bg-white border border-gray-300 rounded-lg">
    <div className="bg-gray-900 text-white px-4 py-2 rounded-t-lg">
      <h3 className="font-semibold">Measurement Data</h3>
    </div>
    <div className="p-4">
      <div className="text-2xl font-mono font-bold text-gray-900">
        25.4567°C
      </div>
      <div className="text-sm text-gray-600 mt-1">±0.001°C accuracy</div>
    </div>
  </div>
);
```

## Animation & Transitions

### Micro-interactions

Use subtle animations for better user experience:

```tsx
// Good - Subtle transitions
const AnimatedCard = () => (
  <div
    className="
    bg-white border border-gray-200 rounded-lg p-6
    transition-all duration-200 ease-in-out
    hover:shadow-lg hover:border-gray-300
    hover:-translate-y-1
  "
  >
    <h3 className="text-lg font-medium transition-colors duration-150">
      Experiment Status
    </h3>
  </div>
);
```

### Loading States

Implement loading animations for data fetching:

```tsx
// Good - Loading animation
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div
      className="
      animate-spin rounded-full h-8 w-8 
      border-b-2 border-blue-600
    "
    ></div>
    <span className="ml-3 text-gray-600">Loading instrument data...</span>
  </div>
);
```

## Component-Specific Patterns

### Form Elements

Consistent styling for form inputs:

```tsx
// Good - Form input styling
const formInputClasses = cva(
  [
    "block w-full rounded-md border-gray-300",
    "focus:border-blue-500 focus:ring-blue-500",
    "disabled:bg-gray-50 disabled:text-gray-500",
  ],
  {
    variants: {
      size: {
        sm: "px-3 py-1.5 text-sm",
        default: "px-3 py-2 text-base",
        lg: "px-4 py-3 text-lg",
      },
      variant: {
        default: "border",
        error: "border-red-300 focus:border-red-500 focus:ring-red-500",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);
```

### Data Tables

Styling for scientific data tables:

```tsx
// Good - Data table styling
const DataTable = () => (
  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
    <table className="min-w-full divide-y divide-gray-300">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Parameter
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Value
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            Temperature
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
            25.4567°C
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);
```

## Style Utilities

### StyleMerge Function

Use the styleMerge utility for combining classes:

```tsx
import { styleMerge } from "@/utils/styleUtils";

// Good - Using styleMerge
const CustomButton = ({ className, variant, ...props }) => (
  <button
    className={styleMerge(
      "px-4 py-2 rounded-md font-medium",
      variant === "primary" && "bg-blue-600 text-white",
      variant === "secondary" && "bg-gray-200 text-gray-900",
      className
    )}
    {...props}
  />
);
```

## Testing Styles

### Visual Regression Testing

Use Storybook for style consistency:

```tsx
// Button.stories.tsx
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-x-4">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <div className="space-x-4">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
    </div>
  ),
};
```

## Performance Considerations

### Tailwind Optimization

- Use Tailwind's purge feature to remove unused styles
- Group related utilities logically
- Prefer shorter class names when possible
- Use CSS variables for frequently changing values

### Bundle Size

- Leverage CVA for reusable component patterns
- Avoid inline styles in favor of utility classes
- Use dynamic imports for heavy style dependencies

## Common Pitfalls to Avoid

### Anti-patterns

```tsx
// Bad - Inline styles
<div style={{ backgroundColor: '#f3f4f6', padding: '16px' }}>

// Bad - Custom CSS classes in global scope
<div className="my-custom-card">

// Bad - Inconsistent spacing
<div className="p-3 mb-5 mt-2 ml-4">

// Good - Consistent Tailwind utilities
<div className="bg-gray-100 p-4">
<div className="space-y-4">
```

### Maintenance Issues

- Don't create one-off utility classes
- Avoid mixing CSS-in-JS with Tailwind
- Keep component variants in separate files
- Use semantic naming for complex combinations
