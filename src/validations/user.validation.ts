import { z } from 'zod';
import { Role } from '@prisma/client';

const createUser = {
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string(),
        role: z.nativeEnum(Role),
    }),
};

const getUsers = {
    query: z.object({
        name: z.string().optional(),
        role: z.nativeEnum(Role).optional(),
        sortBy: z.string().optional(),
        limit: z.coerce.number().optional(),
        page: z.coerce.number().optional(),
    }),
};

const getUser = {
    params: z.object({
        userId: z.coerce.number(),
    }),
};

const updateUser = {
    params: z.object({
        userId: z.coerce.number(),
    }),
    body: z.object({
        email: z.string().email().optional(),
        password: z.string().min(8).optional(),
        name: z.string().optional(),
        role: z.nativeEnum(Role).optional(),
        isActive: z.boolean().optional(),
    })
        .refine(data => Object.keys(data).length > 0, {
            message: "At least one field must be provided"
        }),
};

const deleteUser = {
    params: z.object({
        userId: z.coerce.number(),
    }),
};

export default {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
};
