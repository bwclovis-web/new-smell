import { z } from 'zod'

export const CreatePerfumeHouseSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  description: z.string().min(2, { message: 'Description is required' }),
  image: z.string().url({ message: 'Image URL is required' }),
  website: z.string().url({ message: 'Website URL is required' }),
  country: z.string().min(2, { message: 'Country is required' }),
  founded: z.string().min(4, { message: 'Founded year is required' })
})

export const CreatePerfumeSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  house: z.string().min(2, { message: 'House is required' })
})
