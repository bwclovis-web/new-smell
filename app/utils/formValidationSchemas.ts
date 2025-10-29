import { z } from 'zod'

// Common validation patterns
const emailSchema = z.string().email({ message: 'Please enter a valid email address' })
const urlSchema = z.string().url({ message: 'Please enter a valid URL' }).optional()
const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, { message: 'Please enter a valid phone number' }).optional()
const yearSchema = z.string().regex(/^(19|20)\d{2}$/, { message: 'Please enter a valid year (1900-2099)' }).optional()

// Enhanced password validation with complexity requirements
const passwordSchema = z.string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(128, { message: 'Password must be less than 128 characters' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' })
  .refine(password => !password.includes(' '), {
    message: 'Password cannot contain spaces'
  })

// Rating validation (1-5 scale)
const ratingSchema = z.number()
  .min(1, { message: 'Rating must be at least 1' })
  .max(5, { message: 'Rating must be at most 5' })

// Amount validation (positive number with optional decimal)
const amountSchema = z.string()
  .regex(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a positive number with up to 2 decimal places' })

// Price validation (positive number with optional decimal)
const priceSchema = z.string()
  .regex(/^\d+(\.\d{1,2})?$/, { message: 'Price must be a positive number with up to 2 decimal places' })
  .optional()

// Perfume House Schemas
export const CreatePerfumeHouseSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' })
    .trim(),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(1000, { message: 'Description must be less than 1000 characters' })
    .optional(),
  image: urlSchema,
  website: urlSchema,
  country: z.string()
    .min(2, { message: 'Country must be at least 2 characters' })
    .max(50, { message: 'Country must be less than 50 characters' })
    .optional(),
  founded: yearSchema,
  type: z.enum(['niche', 'designer', 'indie', 'celebrity', 'drugstore']).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  address: z.string()
    .min(5, { message: 'Address must be at least 5 characters' })
    .max(200, { message: 'Address must be less than 200 characters' })
    .optional()
})

export const UpdatePerfumeHouseSchema = CreatePerfumeHouseSchema.partial()

// Perfume Schemas
export const CreatePerfumeSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' })
    .trim(),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(1000, { message: 'Description must be less than 1000 characters' }),
  house: z.string().min(1, { message: 'Perfume house is required' }),
  image: urlSchema,
  perfumeId: z.string().optional(),
  notesTop: z.array(z.string()).optional(),
  notesHeart: z.array(z.string()).optional(),
  notesBase: z.array(z.string()).optional()
})

export const UpdatePerfumeSchema = z.object({
  perfumeId: z.string().min(1, { message: 'Perfume ID is required' }),
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' })
    .trim()
    .optional(),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(1000, { message: 'Description must be less than 1000 characters' })
    .optional(),
  image: urlSchema,
  house: z.string().min(1, { message: 'Perfume house is required' }).optional(),
  notesTop: z.array(z.string()).optional(),
  notesHeart: z.array(z.string()).optional(),
  notesBase: z.array(z.string()).optional()
})

// User Perfume Schemas
export const UpdateUserPerfumeSchema = z.object({
  perfumeId: z.string().min(1, { message: 'Perfume ID is required' }),
  amount: amountSchema,
  available: amountSchema,
  price: priceSchema,
  placeOfPurchase: z.string()
    .max(200, { message: 'Place of purchase must be less than 200 characters' })
    .optional(),
  tradePrice: priceSchema,
  tradePreference: z.enum(['cash', 'trade', 'both'], {
    errorMap: () => ({ message: 'Trade preference must be cash, trade, or both' })
  }).optional(),
  tradeOnly: z.boolean().optional(),
  type: z.string().min(1, { message: 'Perfume type is required' }).optional()
})

// Rating Schemas
export const CreateRatingSchema = z.object({
  perfumeId: z.string().min(1, { message: 'Perfume ID is required' }),
  longevity: ratingSchema.optional(),
  sillage: ratingSchema.optional(),
  gender: ratingSchema.optional(),
  priceValue: ratingSchema.optional(),
  overall: ratingSchema.optional()
}).refine(data => {
  const ratings = [
    data.longevity, data.sillage, data.gender, data.priceValue, data.overall
  ]
  return ratings.some(rating => rating !== undefined)
}, {
  message: 'At least one rating is required',
  path: ['overall']
})

export const UpdateRatingSchema = z.object({
  id: z.string().min(1, { message: 'Rating ID is required' }),
  longevity: ratingSchema.optional(),
  sillage: ratingSchema.optional(),
  gender: ratingSchema.optional(),
  priceValue: ratingSchema.optional(),
  overall: ratingSchema.optional()
})

// Comment Schemas
export const CreateCommentSchema = z.object({
  perfumeId: z.string().min(1, { message: 'Perfume ID is required' }),
  userPerfumeId: z.string().min(1, { message: 'User perfume ID is required' }),
  comment: z.string()
    .min(1, { message: 'Comment is required' })
    .max(1000, { message: 'Comment must be less than 1000 characters' })
    .trim(),
  isPublic: z.boolean().optional()
})

export const UpdateCommentSchema = z.object({
  id: z.string().min(1, { message: 'Comment ID is required' }),
  comment: z.string()
    .min(1, { message: 'Comment is required' })
    .max(1000, { message: 'Comment must be less than 1000 characters' })
    .trim(),
  isPublic: z.boolean().optional()
})

// Wishlist Schemas
export const WishlistActionSchema = z.object({
  perfumeId: z.string().min(1, { message: 'Perfume ID is required' }),
  action: z.enum(['add', 'remove', 'updateVisibility'], {
    errorMap: () => ({ message: 'Action must be add, remove, or updateVisibility' })
  }),
  isPublic: z.string().optional().default('false').transform(val => val === 'true')
})

// User Authentication Schemas
export const UserFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: 'Confirm Password is required' }),
  firstName: z.string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name must be less than 50 characters' })
    .trim()
    .optional(),
  lastName: z.string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name must be less than 50 characters' })
    .trim()
    .optional(),
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username must be less than 30 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
    .trim()
    .optional(),
  acceptTerms: z
    .string()
    .optional()
    .transform(val => val === 'on' || val === 'true')
    .pipe(z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions'
    }))
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export const UserLogInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional()
})

// Password change/reset schemas
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, { message: 'Confirm new password is required' })
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
})

export const ForgotPasswordSchema = z.object({
  email: emailSchema
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, { message: 'Confirm new password is required' })
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword']
})

// Profile update schema
export const UpdateProfileSchema = z.object({
  firstName: z.string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name must be less than 50 characters' })
    .trim(),
  lastName: z.string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name must be less than 50 characters' })
    .trim(),
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username must be less than 30 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
    .trim(),
  email: emailSchema
})

// Search and filter schemas
export const PerfumeSearchSchema = z.object({
  query: z.string().max(100, { message: 'Search query must be less than 100 characters' }).optional(),
  houseName: z.string().max(50, { message: 'House name must be less than 50 characters' }).optional(),
  type: z.string().optional(),
  priceRange: z.object({
    min: z.number().min(0, { message: 'Minimum price must be 0 or greater' }),
    max: z.number().min(0, { message: 'Maximum price must be 0 or greater' })
  }).optional(),
  ratingRange: z.object({
    min: z.number().min(1, { message: 'Minimum rating must be 1 or greater' }),
    max: z.number().max(5, { message: 'Maximum rating must be 5 or less' })
  }).optional(),
  notes: z.array(z.string()).optional(),
  sortBy: z.enum([
    'name', 'price', 'rating', 'createdAt'
  ]).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

// Admin schemas
export const AdminUserFormSchema = z.object({
  email: emailSchema,
  firstName: z.string().max(50, { message: 'First name must be less than 50 characters' }).trim().optional(),
  lastName: z.string().max(50, { message: 'Last name must be less than 50 characters' }).trim().optional(),
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username must be less than 30 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
    .trim()
    .optional(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR'], {
    errorMap: () => ({ message: 'Role must be USER, ADMIN, or MODERATOR' })
  }),
  isActive: z.boolean()
})

// Data quality report schema
export const DataQualityReportSchema = z.object({
  timeframe: z.enum([
    '7d', '30d', '90d', '1y', 'all'
  ], {
    errorMap: () => ({ message: 'Timeframe must be 7d, 30d, 90d, 1y, or all' })
  }),
  includeHistory: z.boolean(),
  exportFormat: z.enum(['csv', 'json', 'xlsx'], {
    errorMap: () => ({ message: 'Export format must be csv, json, or xlsx' })
  })
})

// Export all schemas for easy access
export const validationSchemas = {
  // Perfume House
  createPerfumeHouse: CreatePerfumeHouseSchema,
  updatePerfumeHouse: UpdatePerfumeHouseSchema,

  // Perfume
  createPerfume: CreatePerfumeSchema,
  updatePerfume: UpdatePerfumeSchema,
  updateUserPerfume: UpdateUserPerfumeSchema,

  // Rating
  createRating: CreateRatingSchema,
  updateRating: UpdateRatingSchema,

  // Comment
  createComment: CreateCommentSchema,
  updateComment: UpdateCommentSchema,

  // Wishlist
  wishlistAction: WishlistActionSchema,

  // User Authentication
  userForm: UserFormSchema,
  userLogin: UserLogInSchema,
  changePassword: ChangePasswordSchema,
  forgotPassword: ForgotPasswordSchema,
  resetPassword: ResetPasswordSchema,
  updateProfile: UpdateProfileSchema,

  // Search and Filter
  perfumeSearch: PerfumeSearchSchema,

  // Admin
  adminUserForm: AdminUserFormSchema,
  dataQualityReport: DataQualityReportSchema
} as const
