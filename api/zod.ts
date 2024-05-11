import { z } from 'zod'

export const emailSchema = z.string().email()

const dataSchema = z.object({
  email: z.string().trim().min(1, { message: 'Email is required' }),
})

export type Data = z.infer<typeof dataSchema>

export default dataSchema
