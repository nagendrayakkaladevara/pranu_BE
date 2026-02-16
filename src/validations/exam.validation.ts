import { z } from 'zod';

const startAttempt = {
  params: z.object({
    quizId: z.string(),
  }),
};

const submitAttempt = {
  params: z.object({
    attemptId: z.string(),
  }),
  body: z.object({
    responses: z.array(
      z.object({
        questionId: z.string(),
        selectedOptionId: z.string().optional(),
        textAnswer: z.string().optional(),
      }),
    ),
  }),
};

const gradeAttempt = {
  params: z.object({
    attemptId: z.string(),
  }),
  body: z.object({
    grades: z.array(
      z.object({
        questionId: z.string(),
        awardedMarks: z.number().min(0),
      }),
    ),
  }),
};

const getAttempts = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    quizId: z.string().optional(),
    studentId: z.string().optional(),
    status: z.enum(['STARTED', 'SUBMITTED', 'EXPIRED']).optional(),
  }),
};

const getAttemptById = {
  params: z.object({
    attemptId: z.string(),
  }),
};

export default {
  startAttempt,
  submitAttempt,
  gradeAttempt,
  getAttempts,
  getAttemptById,
};
