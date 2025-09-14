/**
 * Component prop types and interfaces
 * Provides type safety for all React components
 */

import type { ComponentType, ReactNode, RefObject } from 'react'

import type { ApiResponse, PaginatedResponse } from './api'
import type { SafeUser, SafeUserPerfume, SafeUserPerfumeComment, SafeUserPerfumeRating } from './database'

// Base component props
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
  id?: string
  'data-testid'?: string
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  text?: string
}

export interface ErrorProps extends BaseComponentProps {
  error: string | Error
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'inline' | 'banner' | 'modal' | 'toast'
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export interface EmptyStateProps extends BaseComponentProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  variant?: 'default' | 'minimal' | 'illustrated'
}

// Button component types
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

// Input component types
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search'
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  touched?: boolean
  label?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  maxLength?: number
  minLength?: number
  pattern?: string
  autoComplete?: string
  autoFocus?: boolean
}

export interface TextAreaProps extends Omit<InputProps, 'type'> {
  rows?: number
  cols?: number
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
}

export interface SelectProps<T = string> extends BaseComponentProps {
  value: T
  onChange: (value: T) => void
  onBlur?: () => void
  options: Array<{
    value: T
    label: string
    disabled?: boolean
    group?: string
  }>
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  touched?: boolean
  label?: string
  helperText?: string
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  loading?: boolean
}

export interface CheckboxProps extends BaseComponentProps {
  checked: boolean
  onChange: (checked: boolean) => void
  onBlur?: () => void
  disabled?: boolean
  required?: boolean
  error?: string
  touched?: boolean
  label?: string
  helperText?: string
  indeterminate?: boolean
}

export interface RadioProps<T = string> extends BaseComponentProps {
  value: T
  onChange: (value: T) => void
  onBlur?: () => void
  options: Array<{
    value: T
    label: string
    disabled?: boolean
  }>
  disabled?: boolean
  required?: boolean
  error?: string
  touched?: boolean
  label?: string
  helperText?: string
  orientation?: 'horizontal' | 'vertical'
}

export interface SwitchProps extends BaseComponentProps {
  checked: boolean
  onChange: (checked: boolean) => void
  onBlur?: () => void
  disabled?: boolean
  required?: boolean
  error?: string
  touched?: boolean
  label?: string
  helperText?: string
  size?: 'sm' | 'md' | 'lg'
}

// Card component types
export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  clickable?: boolean
  onClick?: () => void
}

export interface CardHeaderProps extends BaseComponentProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  avatar?: ReactNode
}

export interface CardContentProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export interface CardFooterProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  justify?: 'start' | 'center' | 'end' | 'between'
}

// Modal component types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'centered' | 'fullscreen'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  footer?: ReactNode
}

export interface ModalHeaderProps extends BaseComponentProps {
  title?: string
  subtitle?: string
  onClose?: () => void
}

export interface ModalBodyProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export interface ModalFooterProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  justify?: 'start' | 'center' | 'end' | 'between'
}

// Table component types
export interface TableProps<T = unknown> extends BaseComponentProps {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  emptyState?: ReactNode
  pagination?: PaginationProps
  sorting?: SortingProps<T>
  selection?: SelectionProps<T>
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  rowKey?: keyof T | ((row: T) => string | number)
  stickyHeader?: boolean
  striped?: boolean
  hover?: boolean
}

export interface TableColumn<T = unknown> {
  key: keyof T | string
  title: string
  dataIndex?: keyof T
  render?: (value: unknown, record: T, index: number) => ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  ellipsis?: boolean
  className?: string
}

export interface PaginationProps {
  current: number
  total: number
  pageSize: number
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
  onChange: (page: number, pageSize: number) => void
  onShowSizeChange?: (current: number, size: number) => void
}

export interface SortingProps<T = unknown> {
  field?: keyof T
  direction?: 'asc' | 'desc'
  onChange: (field: keyof T, direction: 'asc' | 'desc') => void
}

export interface SelectionProps<T = unknown> {
  selectedRowKeys: (string | number)[]
  onChange: (selectedRowKeys: (string | number)[], selectedRows: T[]) => void
  type?: 'checkbox' | 'radio'
  getCheckboxProps?: (record: T) => { disabled?: boolean; name?: string }
}

// Navigation component types
export interface NavItemProps extends BaseComponentProps {
  href: string
  label: string
  icon?: ReactNode
  active?: boolean
  disabled?: boolean
  badge?: string | number
  children?: NavItemProps[]
}

export interface NavProps extends BaseComponentProps {
  items: NavItemProps[]
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills' | 'tabs' | 'underline'
  size?: 'sm' | 'md' | 'lg'
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: Array<{
    label: string
    href?: string
    active?: boolean
  }>
  separator?: ReactNode
  maxItems?: number
}

// Layout component types
export interface LayoutProps extends BaseComponentProps {
  variant?: 'default' | 'sidebar' | 'header-footer' | 'fullscreen'
}

export interface HeaderProps extends BaseComponentProps {
  title?: string
  subtitle?: string
  logo?: ReactNode
  navigation?: ReactNode
  actions?: ReactNode
  user?: SafeUser
  onUserMenuClick?: () => void
  onLogout?: () => void
  sticky?: boolean
  transparent?: boolean
}

export interface SidebarProps extends BaseComponentProps {
  items: NavItemProps[]
  user?: SafeUser
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  onUserMenuClick?: () => void
  onLogout?: () => void
  variant?: 'default' | 'minimal' | 'icons'
}

export interface FooterProps extends BaseComponentProps {
  links?: Array<{
    label: string
    href: string
    external?: boolean
  }>
  copyright?: string
  social?: Array<{
    name: string
    href: string
    icon: ReactNode
  }>
  variant?: 'default' | 'minimal' | 'centered'
}

// Perfume-specific component types
export interface PerfumeCardProps extends BaseComponentProps {
  perfume: SafeUserPerfume
  onEdit?: (perfume: SafeUserPerfume) => void
  onDelete?: (perfume: SafeUserPerfume) => void
  onRate?: (perfume: SafeUserPerfume) => void
  onComment?: (perfume: SafeUserPerfume) => void
  onTrade?: (perfume: SafeUserPerfume) => void
  showActions?: boolean
  variant?: 'default' | 'compact' | 'detailed'
}

export interface PerfumeListProps extends BaseComponentProps {
  perfumes: SafeUserPerfume[]
  loading?: boolean
  emptyState?: ReactNode
  onPerfumeClick?: (perfume: SafeUserPerfume) => void
  onPerfumeEdit?: (perfume: SafeUserPerfume) => void
  onPerfumeDelete?: (perfume: SafeUserPerfume) => void
  pagination?: PaginationProps
  selection?: SelectionProps<SafeUserPerfume>
}

export interface PerfumeRatingProps extends BaseComponentProps {
  rating: SafeUserPerfumeRating
  onEdit?: (rating: SafeUserPerfumeRating) => void
  onDelete?: (rating: SafeUserPerfumeRating) => void
  showActions?: boolean
  variant?: 'default' | 'compact' | 'detailed'
}

export interface PerfumeCommentProps extends BaseComponentProps {
  comment: SafeUserPerfumeComment
  onEdit?: (comment: SafeUserPerfumeComment) => void
  onDelete?: (comment: SafeUserPerfumeComment) => void
  onReply?: (comment: SafeUserPerfumeComment) => void
  showActions?: boolean
  variant?: 'default' | 'compact' | 'detailed'
}

// Search component types
export interface SearchProps extends BaseComponentProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void
  onClear?: () => void
  placeholder?: string
  loading?: boolean
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  variant?: 'default' | 'minimal' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  showClearButton?: boolean
  showSearchButton?: boolean
}

export interface FilterProps extends BaseComponentProps {
  filters: Record<string, unknown>
  onChange: (filters: Record<string, unknown>) => void
  onReset?: () => void
  onApply?: () => void
  variant?: 'default' | 'minimal' | 'sidebar'
  collapsible?: boolean
}

// Chart component types
export interface ChartProps extends BaseComponentProps {
  data: unknown[]
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'radar'
  options?: Record<string, unknown>
  loading?: boolean
  error?: string
  height?: number | string
  width?: number | string
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

// Utility types
export type ComponentProps<T> = T extends ComponentType<infer P> ? P : never

export type RefComponent<T> = T extends ComponentType<infer P>
  ? ComponentType<P & { ref?: RefObject<unknown> }>
  : never

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}
