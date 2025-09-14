# Custom Hooks Documentation

This document provides comprehensive documentation for all custom hooks available in the Voodoo Perfumes application.

## Table of Contents

- [useRatingSystem](#useratingsystem)
- [usePasswordStrength](#usepasswordstrength)
- [useFormState](#useformstate)
- [useServerError](#useservererror)
- [useOptimisticUpdate](#useoptimisticupdate)
- [useLocalStorage](#uselocalstorage)
- [useDebounce](#usedebounce)
- [useToggle](#usetoggle)
- [useErrorHandler](#useerrorhandler)

## useRatingSystem

Manages rating system state and interactions with optimistic updates and error handling.

### Usage

```typescript
import { useRatingSystem } from "~/hooks";

const RatingComponent = ({ perfumeId, userId, initialRatings, readonly }) => {
  const {
    currentRatings,
    isLoggedIn,
    isInteractive,
    isSubmitting,
    handleRatingChange,
    resetRatings,
    categories,
  } = useRatingSystem({
    perfumeId,
    userId,
    initialRatings,
    readonly,
    onError: (error) => console.error("Rating error:", error),
    onSuccess: (ratings) => console.log("Rating updated:", ratings),
  });

  return (
    <div>
      {categories.map(({ key, label }) => (
        <div key={key}>
          <label>{label}</label>
          <input
            type="range"
            min="1"
            max="5"
            value={currentRatings?.[key] || 0}
            onChange={(e) => handleRatingChange(key, parseInt(e.target.value))}
            disabled={!isInteractive}
          />
        </div>
      ))}
    </div>
  );
};
```

### API

**Options:**

- `perfumeId: string` - ID of the perfume being rated
- `userId?: string | null` - ID of the current user
- `initialRatings?: RatingData | null` - Initial rating values
- `readonly?: boolean` - Whether the rating system is read-only
- `onError?: (error: string) => void` - Error callback
- `onSuccess?: (ratings: RatingData) => void` - Success callback

**Returns:**

- `currentRatings: RatingData | null` - Current rating values
- `isLoggedIn: boolean` - Whether user is logged in
- `isInteractive: boolean` - Whether ratings can be changed
- `isSubmitting: boolean` - Whether a rating is being submitted
- `handleRatingChange: (category, rating) => void` - Handle rating changes
- `resetRatings: () => void` - Reset to initial ratings
- `categories: Array<{key, label}>` - Available rating categories

## usePasswordStrength

Calculates password strength with configurable requirements and provides visual feedback.

### Usage

```typescript
import { usePasswordStrength } from "~/hooks";

const PasswordInput = () => {
  const [password, setPassword] = useState("");
  const { strengthInfo, isValid, getStrengthColor, getStrengthText } =
    usePasswordStrength(password, {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      minScore: 3,
    });

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {strengthInfo && (
        <div>
          <div
            className={`strength-bar ${getStrengthColor(
              strengthInfo.strength
            )}`}
          >
            {getStrengthText(strengthInfo.strength)}
          </div>
          {strengthInfo.feedback.map((message, index) => (
            <div key={index}>{message}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### API

**Options:**

- `minLength?: number` - Minimum password length (default: 8)
- `requireUppercase?: boolean` - Require uppercase letters (default: true)
- `requireLowercase?: boolean` - Require lowercase letters (default: true)
- `requireNumbers?: boolean` - Require numbers (default: true)
- `requireSpecialChars?: boolean` - Require special characters (default: true)
- `minScore?: number` - Minimum strength score (default: 3)

**Returns:**

- `strengthInfo: PasswordStrengthInfo | null` - Strength information
- `isValid: boolean` - Whether password meets requirements
- `getStrengthColor: (strength) => string` - Get color class for strength
- `getStrengthText: (strength) => string` - Get text for strength
- `calculateStrength: (password) => PasswordStrengthInfo` - Calculate strength

## useFormState

Manages form state with validation, error handling, and submission logic.

### Usage

```typescript
import { useFormState } from "~/hooks";

const ContactForm = () => {
  const {
    values,
    errors,
    isSubmitting,
    isValid,
    isDirty,
    setValue,
    setValues,
    setError,
    clearError,
    handleSubmit,
    reset,
  } = useFormState({
    initialValues: {
      name: "",
      email: "",
      message: "",
    },
    validate: (values) => {
      const errors = {};
      if (!values.name) errors.name = "Name is required";
      if (!values.email) errors.email = "Email is required";
      if (!values.message) errors.message = "Message is required";
      return errors;
    },
    onSubmit: async (values) => {
      await submitForm(values);
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.name}
        onChange={(e) => setValue("name", e.target.value)}
        placeholder="Name"
      />
      {errors.name && <span>{errors.name}</span>}

      <input
        value={values.email}
        onChange={(e) => setValue("email", e.target.value)}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email}</span>}

      <textarea
        value={values.message}
        onChange={(e) => setValue("message", e.target.value)}
        placeholder="Message"
      />
      {errors.message && <span>{errors.message}</span>}

      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
};
```

### API

**Options:**

- `initialValues: T` - Initial form values
- `validate?: (values: T) => Partial<Record<keyof T, string>>` - Validation function
- `onSubmit?: (values: T) => void | Promise<void>` - Submit handler
- `resetOnSubmit?: boolean` - Reset form after submission (default: false)

**Returns:**

- `values: T` - Current form values
- `errors: Partial<Record<keyof T, string>>` - Validation errors
- `isSubmitting: boolean` - Whether form is submitting
- `isValid: boolean` - Whether form is valid
- `isDirty: boolean` - Whether form has been modified
- `setValue: (field, value) => void` - Set individual field value
- `setValues: (values) => void` - Set multiple field values
- `setError: (field, error) => void` - Set field error
- `setErrors: (errors) => void` - Set multiple errors
- `clearError: (field) => void` - Clear field error
- `clearErrors: () => void` - Clear all errors
- `handleSubmit: (e?) => Promise<void>` - Handle form submission
- `reset: () => void` - Reset form to initial values
- `validate: () => boolean` - Validate form

## useServerError

Manages server errors in forms and components with automatic clearing and callbacks.

### Usage

```typescript
import { useServerError } from "~/hooks";

const FormWithError = () => {
  const { serverError, setServerError, clearError, handleServerError } =
    useServerError({
      onError: (error) => console.error("Server error:", error),
      onClear: () => console.log("Error cleared"),
      autoClear: true,
      clearDelay: 5000,
    });

  const handleSubmit = async (data) => {
    try {
      await submitData(data);
    } catch (error) {
      handleServerError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {serverError && (
        <div className="error">
          {serverError}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      {/* form fields */}
    </form>
  );
};
```

### API

**Options:**

- `onError?: (error: string) => void` - Error callback
- `onClear?: () => void` - Clear callback
- `autoClear?: boolean` - Auto-clear errors (default: false)
- `clearDelay?: number` - Auto-clear delay in ms (default: 5000)

**Returns:**

- `serverError: string | null` - Current server error
- `setServerError: (error: string | null) => void` - Set server error
- `clearError: () => void` - Clear error
- `handleServerError: (error: unknown) => void` - Handle any error
- `hasError: boolean` - Whether there's an error

## useOptimisticUpdate

Manages optimistic updates with rollback capability for better UX.

### Usage

```typescript
import { useOptimisticUpdate } from "~/hooks";

const LikeButton = ({ postId, initialLiked }) => {
  const {
    data: isLiked,
    isUpdating,
    updateData,
    revertData,
  } = useOptimisticUpdate({
    initialData: initialLiked,
    onUpdate: async (newValue) => {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: newValue ? "POST" : "DELETE",
      });
      return response.json();
    },
    onError: (error, originalData) => {
      console.error("Like failed:", error);
    },
    onSuccess: (updatedData) => {
      console.log("Like updated:", updatedData);
    },
  });

  return (
    <button onClick={() => updateData(!isLiked)} disabled={isUpdating}>
      {isLiked ? "❤️" : "🤍"} {isUpdating ? "..." : ""}
    </button>
  );
};
```

### API

**Options:**

- `initialData: T` - Initial data value
- `onUpdate: (data: T) => Promise<T>` - Update function
- `onError?: (error: unknown, originalData: T) => void` - Error callback
- `onSuccess?: (updatedData: T) => void` - Success callback
- `revertOnError?: boolean` - Revert on error (default: true)

**Returns:**

- `data: T` - Current data value
- `isUpdating: boolean` - Whether update is in progress
- `error: unknown | null` - Current error
- `updateData: (newData: T) => Promise<void>` - Update data
- `revertData: () => void` - Revert to original data
- `clearError: () => void` - Clear error

## useLocalStorage

Manages localStorage with type safety and error handling.

### Usage

```typescript
import { useLocalStorage } from "~/hooks";

const SettingsComponent = () => {
  const {
    value: settings,
    setValue: setSettings,
    removeValue,
    isLoaded,
  } = useLocalStorage({
    key: "user-settings",
    initialValue: {
      theme: "light",
      language: "en",
      notifications: true,
    },
  });

  if (!isLoaded) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <select
        value={settings.theme}
        onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <button onClick={removeValue}>Reset Settings</button>
    </div>
  );
};
```

### API

**Options:**

- `key: string` - localStorage key
- `initialValue: T` - Initial value
- `serialize?: (value: T) => string` - Serialization function (default: JSON.stringify)
- `deserialize?: (value: string) => T` - Deserialization function (default: JSON.parse)
- `storage?: Storage` - Storage object (default: localStorage)

**Returns:**

- `value: T` - Current stored value
- `setValue: (value: T | ((prev: T) => T)) => void` - Set value
- `removeValue: () => void` - Remove value
- `clearStorage: () => void` - Clear all storage
- `isLoaded: boolean` - Whether value has been loaded

## useDebounce

Debounces values with configurable options for performance optimization.

### Usage

```typescript
import { useDebounce } from "~/hooks";

const SearchInput = () => {
  const [query, setQuery] = useState("");
  const { debouncedValue, isDebouncing, cancel } = useDebounce(query, {
    delay: 300,
    leading: false,
    trailing: true,
  });

  useEffect(() => {
    if (debouncedValue) {
      performSearch(debouncedValue);
    }
  }, [debouncedValue]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {isDebouncing && <span>Searching...</span>}
    </div>
  );
};
```

### API

**Options:**

- `delay?: number` - Debounce delay in ms (default: 300)
- `leading?: boolean` - Execute on leading edge (default: false)
- `trailing?: boolean` - Execute on trailing edge (default: true)

**Returns:**

- `debouncedValue: T` - Debounced value
- `isDebouncing: boolean` - Whether debouncing is active
- `cancel: () => void` - Cancel debouncing

## useToggle

Manages boolean toggle state with utility methods.

### Usage

```typescript
import { useToggle } from "~/hooks";

const ToggleComponent = () => {
  const {
    value: isOpen,
    toggle,
    setTrue,
    setFalse,
    setValue,
  } = useToggle({
    initialValue: false,
    onToggle: (value) => console.log("Toggled to:", value),
  });

  return (
    <div>
      <button onClick={toggle}>{isOpen ? "Close" : "Open"}</button>
      <button onClick={setTrue}>Force Open</button>
      <button onClick={setFalse}>Force Close</button>
      <button onClick={() => setValue(!isOpen)}>Toggle</button>
    </div>
  );
};
```

### API

**Options:**

- `initialValue?: boolean` - Initial toggle state (default: false)
- `onToggle?: (value: boolean) => void` - Toggle callback

**Returns:**

- `value: boolean` - Current toggle state
- `toggle: () => void` - Toggle value
- `setTrue: () => void` - Set to true
- `setFalse: () => void` - Set to false
- `setValue: (value: boolean) => void` - Set specific value

## useErrorHandler

Comprehensive error handling with logging and user-friendly messages.

### Usage

```typescript
import {
  useErrorHandler,
  useAsyncErrorHandler,
  useFormErrorHandler,
} from "~/hooks";

const ComponentWithErrorHandling = () => {
  const { error, isError, handleError, clearError } = useErrorHandler();
  const { execute, isLoading } = useAsyncErrorHandler();
  const { handleFormError, createValidationError } = useFormErrorHandler();

  const handleAsyncOperation = async () => {
    const result = await execute(async () => {
      const response = await fetch("/api/data");
      return response.json();
    });

    if (result) {
      console.log("Success:", result);
    }
  };

  const handleFormSubmit = (data) => {
    try {
      validateData(data);
    } catch (error) {
      handleFormError(error, "email");
    }
  };

  return (
    <div>
      {isError && (
        <div className="error">
          {error?.userMessage}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      <button onClick={handleAsyncOperation} disabled={isLoading}>
        {isLoading ? "Loading..." : "Load Data"}
      </button>
    </div>
  );
};
```

### API

**useErrorHandler:**

- `error: AppError | null` - Current error
- `isError: boolean` - Whether there's an error
- `handleError: (error: unknown, context?) => AppError` - Handle any error
- `clearError: () => void` - Clear error
- `createAndHandleError: (message, type?, severity?, context?) => AppError` - Create and handle error

**useAsyncErrorHandler:**

- `error: AppError | null` - Current error
- `isError: boolean` - Whether there's an error
- `isLoading: boolean` - Whether operation is loading
- `execute: (asyncFn, context?) => Promise<T | null>` - Execute async function
- `clearError: () => void` - Clear error

**useFormErrorHandler:**

- `error: AppError | null` - Current error
- `isError: boolean` - Whether there's an error
- `handleFormError: (error, field?) => AppError` - Handle form error
- `createValidationError: (message, field?) => AppError` - Create validation error
- `clearError: () => void` - Clear error

## Best Practices

1. **Use TypeScript**: All hooks are fully typed for better development experience
2. **Handle Errors**: Always provide error handling in your components
3. **Optimize Performance**: Use debouncing for search inputs and expensive operations
4. **Validate Input**: Use form validation hooks for better UX
5. **Manage State**: Use appropriate state management hooks for different scenarios
6. **Clean Up**: Hooks automatically clean up resources, but be mindful of memory leaks
7. **Test Hooks**: Write tests for custom hooks using React Testing Library

## Examples

See the `examples/` directory for complete working examples of each hook.

## Contributing

When adding new hooks:

1. Follow the existing naming conventions
2. Provide comprehensive TypeScript types
3. Include JSDoc comments
4. Write tests
5. Update this documentation
6. Add examples
