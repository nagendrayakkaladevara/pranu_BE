import { z } from 'zod';

const register = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string(),
    role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']).optional(), // Default is STUDENT
  }),
};

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
