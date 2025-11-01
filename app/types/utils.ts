/**
 * Utility types and helper type definitions
 * Provides common TypeScript utility types for the application
 */

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}
export type NonNullable<T> = T extends null | undefined ? never : T
export type NonEmptyArray<T> = [T, ...T[]]
export type EmptyObject = Record<string, never>

// Function types
export type AsyncFunction<T = unknown, R = unknown> = (arg: T) => Promise<R>
export type SyncFunction<T = unknown, R = unknown> = (arg: T) => R
export type VoidFunction = () => void
export type AsyncVoidFunction = () => Promise<void>
export type Predicate<T> = (value: T) => boolean
export type Mapper<T, R> = (value: T) => R
export type Reducer<T, R> = (accumulator: R, currentValue: T) => R

// Event handler types
export type EventHandler<T = Event> = (event: T) => void
export type ChangeEventHandler<T = HTMLInputElement> = (
  event: React.ChangeEvent<T>
) => void
export type ClickEventHandler<T = HTMLElement> = (event: React.MouseEvent<T>) => void
export type SubmitEventHandler<T = HTMLFormElement> = (
  event: React.FormEvent<T>
) => void
export type KeyboardEventHandler<T = HTMLElement> = (
  event: React.KeyboardEvent<T>
) => void
export type FocusEventHandler<T = HTMLElement> = (event: React.FocusEvent<T>) => void
export type BlurEventHandler<T = HTMLElement> = (event: React.FocusEvent<T>) => void

// State management types
export type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>
export type StateUpdater<T> = (prevState: T) => T
export type StateAction<T> = T | StateUpdater<T>

// API types
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
export type HttpStatus =
  | 200
  | 201
  | 204
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 500
  | 502
  | 503
export type RequestStatus = "idle" | "loading" | "success" | "error"

// Form types
export type FormFieldValue = string | number | boolean | FileList | null
export type FormFieldError = string | undefined
export type FormFieldTouched = boolean
export type FormFieldProps<T = FormFieldValue> = {
  value: T
  onChange: (value: T) => void
  onBlur: () => void
  error?: FormFieldError
  touched?: FormFieldTouched
}

// Validation types
export type ValidationRule<T = unknown> = {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: T) => string | undefined
  message?: string
}
export type ValidationSchema<T = Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>
}
export type ValidationResult = {
  isValid: boolean
  errors: Record<string, string>
}

// Component prop types
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never
export type RefComponent<T> = T extends React.ComponentType<infer P>
  ? React.ComponentType<P & { ref?: React.Ref<unknown> }>
  : never

// Hook types
export type HookReturn<T> = T extends (...args: any[]) => infer R ? R : never
export type HookDependencies = ReadonlyArray<unknown>
export type HookCleanup = () => void

// Error types
export type ErrorBoundaryState = {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}
export type ErrorBoundaryProps = {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

// Theme types
export type Theme = "light" | "dark" | "system"
export type ColorScheme = "light" | "dark"
export type Size = "xs" | "sm" | "md" | "lg" | "xl"
export type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"

// Layout types
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
export type Orientation = "horizontal" | "vertical"
export type Alignment = "start" | "center" | "end" | "stretch"
export type JustifyContent =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around"
  | "evenly"

// Animation types
export type AnimationDuration = "fast" | "normal" | "slow"
export type AnimationEasing =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
export type AnimationDirection =
  | "normal"
  | "reverse"
  | "alternate"
  | "alternate-reverse"

// Data types
export type SortDirection = "asc" | "desc"
export type SortField<T> = keyof T | string
export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "nin"
  | "contains"
  | "startsWith"
  | "endsWith"
export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | boolean[]
  | Date[]

// Utility functions
export type ValueOf<T> = T[keyof T]
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>

// Brand types for better type safety
export type Brand<T, B> = T & { __brand: B }
export type UserId = Brand<string, "UserId">
export type PerfumeId = Brand<string, "PerfumeId">
export type PerfumeHouseId = Brand<string, "PerfumeHouseId">
export type CommentId = Brand<string, "CommentId">
export type RatingId = Brand<string, "RatingId">

// Union types
export type Status = "idle" | "loading" | "success" | "error"
export type LoadingState = "idle" | "loading" | "success" | "error"
export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

// Conditional types
export type If<C extends boolean, T, F> = C extends true ? T : F
export type IsArray<T> = T extends any[] ? true : false
export type IsFunction<T> = T extends (...args: any[]) => any ? true : false
export type IsObject<T> = T extends object ? true : false
export type IsString<T> = T extends string ? true : false
export type IsNumber<T> = T extends number ? true : false
export type IsBoolean<T> = T extends boolean ? true : false

// Template literal types
export type CamelCase<S extends string> =
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
    : S
export type SnakeCase<S extends string> = S extends `${infer P1}${infer P2}`
  ? P2 extends Uncapitalize<P2>
    ? `${Uncapitalize<P1>}${SnakeCase<P2>}`
    : `${Uncapitalize<P1>}_${SnakeCase<Uncapitalize<P2>>}`
  : S
export type KebabCase<S extends string> = S extends `${infer P1}${infer P2}`
  ? P2 extends Uncapitalize<P2>
    ? `${Uncapitalize<P1>}${KebabCase<P2>}`
    : `${Uncapitalize<P1>}-${KebabCase<Uncapitalize<P2>>}`
  : S

// Type guards
export type TypeGuard<T> = (value: unknown) => value is T
export type TypePredicate<T> = (value: unknown) => value is T

// Mapped types
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
export type ReadonlyBy<T, K extends keyof T> = Omit<T, K> & Readonly<Pick<T, K>>
export type MutableBy<T, K extends keyof T> = Omit<T, K> & {
  -readonly [P in K]: T[P]
}

// Recursive types
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P]
}
export type RecursiveRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? RecursiveRequired<T[P]> : T[P]
}
export type RecursiveReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? RecursiveReadonly<T[P]> : T[P]
}

// Tuple types
export type Head<T extends readonly unknown[]> = T extends readonly [
  infer H,
  ...unknown[]
]
  ? H
  : never
export type Tail<T extends readonly unknown[]> = T extends readonly [
  unknown,
  ...infer T
]
  ? T
  : []
export type Last<T extends readonly unknown[]> = T extends readonly [
  ...unknown[],
  infer L
]
  ? L
  : never
export type Length<T extends readonly unknown[]> = T["length"]

// String manipulation types
export type Trim<S extends string> = S extends ` ${infer T}` | `${infer T} `
  ? Trim<T>
  : S
export type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S
export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Lowercase<F>}${R}`
  : S
