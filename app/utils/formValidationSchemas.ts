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

export const UserFormSchema = z.object({
  email: z.string().email({ message: 'Email is required' }),
  password: z.string().min(6, { message: 'Password is required' }),
  confirmPassword: z.string().min(6, { message: 'Confirm Password is required' })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match'
})

export const UserLogInSchema = z.object({
  email: z.string().email({ message: 'Email is required' }),
  password: z.string().min(6, { message: 'Password is required' })
})
