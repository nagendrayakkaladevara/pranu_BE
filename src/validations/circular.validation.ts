import { z } from 'zod';
import { CircularType, TargetType, Priority } from '../models/circular.model';

const createCircular = {
  body: z
    .object({
      type: z.enum([CircularType.CIRCULAR, CircularType.NOTICE, CircularType.ANNOUNCEMENT]),
      title: z.string().min(1).max(200),
      content: z.string().min(1),
      targetType: z.enum([TargetType.CLASS, TargetType.DEPARTMENT, TargetType.ALL]),
      targetClassId: z.string().optional(),
      targetDepartment: z.string().optional(),
      priority: z.enum([Priority.LOW, Priority.NORMAL, Priority.HIGH, Priority.URGENT]).optional(),
      isPinned: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (data.targetType === TargetType.CLASS) return !!data.targetClassId;
        if (data.targetType === TargetType.DEPARTMENT) return !!data.targetDepartment;
        return true;
      },
      {
        message:
          'targetClassId required when targetType is CLASS; targetDepartment required when targetType is DEPARTMENT',
      },
    ),
};

const getCirculars = {
  query: z.object({
    type: z.enum([CircularType.CIRCULAR, CircularType.NOTICE, CircularType.ANNOUNCEMENT]).optional(),
    targetType: z.enum([TargetType.CLASS, TargetType.DEPARTMENT, TargetType.ALL]).optional(),
    targetClassId: z.string().optional(),
    targetDepartment: z.string().optional(),
    priority: z.enum([Priority.LOW, Priority.NORMAL, Priority.HIGH, Priority.URGENT]).optional(),
    isPinned: z.coerce.boolean().optional(),
    myOnly: z.coerce.boolean().optional(),
    sortBy: z.string().optional(),
    limit: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
  }),
};

const getCircular = {
  params: z.object({
    circularId: z.string(),
  }),
};

const updateCircular = {
  params: z.object({
    circularId: z.string(),
  }),
  body: z
    .object({
      type: z.enum([CircularType.CIRCULAR, CircularType.NOTICE, CircularType.ANNOUNCEMENT]).optional(),
      title: z.string().min(1).max(200).optional(),
      content: z.string().min(1).optional(),
      targetType: z.enum([TargetType.CLASS, TargetType.DEPARTMENT, TargetType.ALL]).optional(),
      targetClassId: z.string().optional().nullable(),
      targetDepartment: z.string().optional().nullable(),
      priority: z.enum([Priority.LOW, Priority.NORMAL, Priority.HIGH, Priority.URGENT]).optional(),
      isPinned: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

const deleteCircular = {
  params: z.object({
    circularId: z.string(),
  }),
};

export default {
  createCircular,
  getCirculars,
  getCircular,
  updateCircular,
  deleteCircular,
};
