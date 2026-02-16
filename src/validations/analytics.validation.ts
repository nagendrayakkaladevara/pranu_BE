import { z } from 'zod';

const getQuizResults = {
  params: z.object({
    quizId: z.string(),
  }),
};

const getStudentStats = {
  params: z.object({
    studentId: z.string(),
  }),
};

const getQuestionAnalysis = {
  params: z.object({
    quizId: z.string(),
  }),
};

const getDifficultyAnalysis = {
  params: z.object({
    quizId: z.string(),
  }),
};

export default {
  getQuizResults,
  getStudentStats,
  getQuestionAnalysis,
  getDifficultyAnalysis,
};
