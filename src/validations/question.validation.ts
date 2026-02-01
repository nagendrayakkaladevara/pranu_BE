import { z } from 'zod';
import { Difficulty, QuestionType } from '@prisma/client';

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const createQuestion = {
  body: z.object({
    text: z.string().min(1),
    type: z.nativeEnum(QuestionType).default(QuestionType.MCQ),
    difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
    marks: z.number().int().min(1).default(1),
    subject: z.string().min(1),
    topic: z.string().optional(),
    options: z.array(optionSchema).min(2, 'MCQ must have at least 2 options'),
  }),
};

const getQuestions = {
  query: z.object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    difficulty: z.nativeEnum(Difficulty).optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    limit: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
  }),
};

const getQuestion = {
  params: z.object({
    questionId: z.coerce.number(),
  }),
};

const updateQuestion = {
  params: z.object({
    questionId: z.coerce.number(),
  }),
  body: z
    .object({
      text: z.string().min(1).optional(),
      difficulty: z.nativeEnum(Difficulty).optional(),
      marks: z.number().int().min(1).optional(),
      subject: z.string().min(1).optional(),
      topic: z.string().optional(),
      options: z.array(optionSchema).min(2).optional(),
      // Optimization: If options are provided, we replace all existing ones.
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

const deleteQuestion = {
  params: z.object({
    questionId: z.coerce.number(),
  }),
};

export default {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
