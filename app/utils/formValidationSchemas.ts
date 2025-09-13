import { z } from 'zod'

export const CreatePerfumeHouseSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  description: z.string().min(2, { message: 'Description is required' }).optional(),
  image: z.string().optional(),
  website: z.string().url().optional(),
  country: z.string().min(2, { message: 'Country is required' }).optional(),
  founded: z.string().min(4, { message: 'Founded year is required' }).optional(),
  email: z.string().email({ message: 'Email is required' }).optional(),
  phone: z.string().min(2, { message: 'Phone number is required' }).optional(),
  address: z.string().min(2, { message: 'Address is required' }).optional()
})

export const CreatePerfumeSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  description: z.string().min(2, { message: 'Description is required' }),
  house: z.string().min(2, { message: 'House is required' }),
  image: z.string().url({ message: 'Image URL is required' })
})

export const UpdateUserPerfumeSchema = z.object({
  perfumeId: z.string().min(1, { message: 'Perfume ID is required' }),
  amount: z.string().min(1, { message: 'Amount is required' }),
  // notes: z.string().min(1, { message: 'Notes are required' }).optional(),
  // rating: z.number().min(1, { message: 'Rating is required' }).max(5, { message: 'Rating must be between 1 and 5' }),
  // isFavorite: z.boolean().optional()
})

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

export const UserFormSchema = z.object({
  email: z.string().email({ message: 'Email is required' }),
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: 'Confirm Password is required' })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export const UserLogInSchema = z.object({
  email: z.string().email({ message: 'Email is required' }),
  password: z.string().min(1, { message: 'Password is required' })
})

// Schema for password change/reset
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

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'A valid email is required' }),
})
