import { z } from 'zod';

// Validate start attempt params
const startAttempt = {
  params: z.object({
    quizId: z.string(),
  }),
};

// Validate submit attempt params and body
const submitAttempt = {
  params: z.object({
    attemptId: z.string(),
  }),
  body: z.object({
    responses: z.array(
      z.object({
        questionId: z.string(),
        selectedOptionId: z.string(),
      }),
    ),
  }),
};

export default {
  startAttempt,
  submitAttempt,
};
