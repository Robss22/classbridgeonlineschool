import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: z.enum(['Male', 'Female']),
  role: z.enum(['admin', 'teacher', 'student']),
  phone: z.string().min(6),
  department: z.string().min(1)
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

