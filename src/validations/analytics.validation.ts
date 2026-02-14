import { z } from 'zod';

// Validate get quiz results params
const getQuizResults = {
  params: z.object({
    quizId: z.string(),
  }),
};

// Validate get student stats params
const getStudentStats = {
  params: z.object({
    studentId: z.string(),
  }),
};

export default {
  getQuizResults,
  getStudentStats,
};
