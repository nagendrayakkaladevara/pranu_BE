import { z } from 'zod';

const getQuizResults = {
    params: z.object({
        quizId: z.coerce.number(),
    }),
};

const getStudentStats = {
    params: z.object({
        studentId: z.coerce.number(),
    }),
};

export default {
    getQuizResults,
    getStudentStats
}
