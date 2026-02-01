import { z } from 'zod';

// Validate get quiz results params
const getQuizResults = {
  params: z.object({
    quizId: z.coerce.number(),
  }),
};

// Validate get student stats params
const getStudentStats = {
  params: z.object({
    studentId: z.coerce.number(),
  }),
};

export default {
  getQuizResults,
  getStudentStats,
};
