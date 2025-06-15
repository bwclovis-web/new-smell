# JavaScript & TypeScript Style Guide

## Code Style & Modern JavaScript

### Indentation & Formatting

- **Indentation**: Use consistent 2-space indentation
- **Strings**: Single quotes unless interpolation needed (template literals)
- **Semicolons**: Follow ESLint configuration (generally required)

### Variable Declarations

- **Constants**: Use `const` for constants and values that won't be reassigned
- **Mutable Variables**: Use `let` for mutable variables
- **Avoid**: Never use `var` (use `const` or `let` instead)

```javascript
// Good
const API_URL = "https://api.example.com";
const userData = { name: "John", age: 30 };
let counter = 0;

// Bad
var userName = "John";
let API_URL = "https://api.example.com"; // Should be const
```

### Functions

- **Preference**: Use arrow functions over traditional function expressions
- **Naming**: Use meaningful and descriptive function names
- **Async**: Prefer `async/await` over Promise chains

```javascript
// Good
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

const fetchUserData = async (userId) => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw error;
  }
};

// Bad
function calculateTotal(items) {
  return items.reduce(function (sum, item) {
    return sum + item.price;
  }, 0);
}
```

### Modern JavaScript Features

#### Destructuring

Use destructuring for objects and arrays when appropriate:

```javascript
// Good
const { name, email } = user;
const [first, second] = items;

// Component props
const UserCard = ({ name, email, avatar }) => {
  // ...
};
```

#### Spread/Rest Operators

Use spread and rest operators for cleaner code:

```javascript
// Good
const newUser = { ...existingUser, name: "Updated Name" };
const mergedArray = [...array1, ...array2];

const handleMultipleArgs = (...args) => {
  return args.reduce((sum, num) => sum + num, 0);
};
```

#### Optional Chaining & Nullish Coalescing

Use modern operators for safer property access:

```javascript
// Good
const userName = user?.profile?.name ?? "Anonymous";
const count = data?.items?.length ?? 0;

// Bad
const userName = (user && user.profile && user.profile.name) || "Anonymous";
```

#### Template Literals

Use template literals for string interpolation:

```javascript
// Good
const message = `Hello ${name}, you have ${count} items.`;
const multiLine = `
  This is a multi-line
  string with proper indentation
`;

// Bad
const message = "Hello " + name + ", you have " + count + " items.";
```

### Naming Conventions

- **Variables & Functions**: camelCase (`userName`, `fetchData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Components**: PascalCase (`UserCard`, `DataTable`)
- **Files**: kebab-case for most files, PascalCase for components

```javascript
// Good
const maxRetryCount = 3;
const API_BASE_URL = "https://api.example.com";
const UserProfile = () => {
  /* ... */
};

// Bad
const MaxRetryCount = 3;
const api_base_url = "https://api.example.com";
const userprofile = () => {
  /* ... */
};
```

### Comments & Documentation

- Add comments for complex or non-obvious logic
- Use JSDoc for function documentation when needed
- Prefer self-documenting code over excessive comments

```javascript
// Good
/**
 * Calculates the compound interest for a given principal amount
 * @param {number} principal - The initial amount
 * @param {number} rate - The annual interest rate (as decimal)
 * @param {number} time - The time period in years
 * @returns {number} The compound interest amount
 */
const calculateCompoundInterest = (principal, rate, time) => {
  return principal * Math.pow(1 + rate, time) - principal;
};

// Complex business logic that needs explanation
const processPayment = (amount, paymentMethod) => {
  // Apply 2.9% processing fee for credit card transactions
  if (paymentMethod === "credit_card") {
    amount *= 1.029;
  }

  return processTransaction(amount, paymentMethod);
};
```

### Error Handling

- Use try/catch blocks for async operations
- Provide meaningful error messages
- Handle errors gracefully

```javascript
// Good
const saveUserData = async (userData) => {
  try {
    const response = await api.post("/users", userData);
    return response.data;
  } catch (error) {
    console.error("Failed to save user data:", error.message);
    throw new Error("Unable to save user data. Please try again.");
  }
};
```

### Performance Considerations

- Recommend code splitting and dynamic imports for lazy loading
- Avoid unnecessary re-renders and computations

```javascript
// Good - Dynamic imports for code splitting
const LazyComponent = React.lazy(() => import("./HeavyComponent"));

// Good - Memoization for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Good - Callback memoization
const handleClick = useCallback(
  (id) => {
    onItemClick(id);
  },
  [onItemClick]
);
```

### Import/Export Patterns

- Use named exports for utilities and hooks
- Use default exports for components
- Group imports logically

```javascript
// Good
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/Atoms";
import { useUserData } from "@/hooks/query";

// At the end of file
export default UserProfile;
export { validateUserData, formatUserName };
```

### TypeScript Specific Guidelines

- Use strict typing throughout
- Prefer interfaces over type aliases for object shapes
- Use proper generic constraints

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

type UserAction = "create" | "update" | "delete";

const processUser = <T extends User>(user: T): T => {
  return { ...user, updatedAt: new Date() };
};
```
