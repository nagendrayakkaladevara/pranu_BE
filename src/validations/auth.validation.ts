import { z } from 'zod';

const register = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string(),
    role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']).optional(),
  }),
};

const login = {
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
};

const logout = {
  body: z.object({
    refreshToken: z.string(),
  }),
};

const refreshTokens = {
  body: z.object({
    refreshToken: z.string(),
  }),
};

const updateMe = {
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
  }),
};

const changePassword = {
  body: z
    .object({
      currentPassword: z.string({ required_error: 'Current password is required' }),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }),
};

export default {
  register,
  login,
  logout,
  refreshTokens,
  updateMe,
  changePassword,
};
