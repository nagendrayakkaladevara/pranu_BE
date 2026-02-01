import { z } from 'zod';

const createQuiz = {
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    durationMinutes: z.number().int().min(1).default(60),
    totalMarks: z.number().int().min(1),
    passMarks: z.number().int().optional(),
    shuffleQuestions: z.boolean().default(false),
    startTime: z.string().datetime().optional(), // ISO string
    endTime: z.string().datetime().optional(),
  }),
};

const getQuizzes = {
  query: z.object({
    title: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    sortBy: z.string().optional(),
    limit: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
  }),
};

const getQuiz = {
  params: z.object({
    quizId: z.coerce.number(),
  }),
};

const updateQuiz = {
  params: z.object({
    quizId: z.coerce.number(),
  }),
  body: z
    .object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      durationMinutes: z.number().int().min(1).optional(),
      totalMarks: z.number().int().min(1).optional(),
      passMarks: z.number().int().optional(),
      shuffleQuestions: z.boolean().optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

const deleteQuiz = {
  params: z.object({
    quizId: z.coerce.number(),
  }),
};

const addQuestions = {
  params: z.object({
    quizId: z.coerce.number(),
  }),
  body: z.object({
    questionIds: z.array(z.number().int()),
  }),
};

const publishQuiz = {
  params: z.object({
    quizId: z.coerce.number(),
  }),
  body: z.object({
    classIds: z.array(z.number().int()),
  }),
};

export default {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestions,
  publishQuiz,
};
