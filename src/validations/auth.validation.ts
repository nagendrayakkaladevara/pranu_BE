import { z } from 'zod';

// Validate registration body
const register = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string(),
    role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']).optional(), // Default is STUDENT
  }),
};

// Validate login body
const login = {
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
};

export default {
  register,
  login,
};
