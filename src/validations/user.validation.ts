import { z } from 'zod';
import { Role } from '../models/user.model';

// Validate create user body
const createUser = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string(),
    role: z.nativeEnum(Role),
  }),
};

// Validate get users query
const getUsers = {
  query: z.object({
    name: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    sortBy: z.string().optional(),
    limit: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
  }),
};

// Validate get user by ID params
const getUser = {
  params: z.object({
    userId: z.string(),
  }),
};

// Validate update user params and body
const updateUser = {
  params: z.object({
    userId: z.string(),
  }),
  body: z
    .object({
      email: z.string().email().optional(),
      password: z.string().min(8).optional(),
      name: z.string().optional(),
      role: z.nativeEnum(Role).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

// Validate delete user params
const deleteUser = {
  params: z.object({
    userId: z.string(),
  }),
};

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
