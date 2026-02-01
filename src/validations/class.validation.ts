import { z } from 'zod';

const createClass = {
    body: z.object({
        name: z.string().min(1),
        department: z.string().min(1),
        academicYear: z.string().min(1),
        semester: z.coerce.number().int().min(1),
    }),
};

const getClasses = {
    query: z.object({
        name: z.string().optional(),
        department: z.string().optional(),
        sortBy: z.string().optional(),
        limit: z.coerce.number().optional(),
        page: z.coerce.number().optional(),
    }),
};

const getClass = {
    params: z.object({
        classId: z.coerce.number(),
    }),
};

const updateClass = {
    params: z.object({
        classId: z.coerce.number(),
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        department: z.string().min(1).optional(),
        academicYear: z.string().min(1).optional(),
        semester: z.coerce.number().int().min(1).optional(),
    })
        .refine(data => Object.keys(data).length > 0, {
            message: "At least one field must be provided"
        }),
};

const deleteClass = {
    params: z.object({
        classId: z.coerce.number(),
    }),
};

const assignStudents = {
    params: z.object({
        classId: z.coerce.number(),
    }),
    body: z.object({
        studentIds: z.array(z.coerce.number()),
    }),
};

const assignLecturers = {
    params: z.object({
        classId: z.coerce.number(),
    }),
    body: z.object({
        lecturerIds: z.array(z.coerce.number()),
    }),
};

export default {
    createClass,
    getClasses,
    getClass,
    updateClass,
    deleteClass,
    assignStudents,
    assignLecturers
};
