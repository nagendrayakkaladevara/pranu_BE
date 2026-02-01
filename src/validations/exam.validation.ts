import { z } from 'zod';

const startAttempt = {
    params: z.object({
        quizId: z.coerce.number(),
    }),
};

const submitAttempt = {
    params: z.object({
        attemptId: z.coerce.number(),
    }),
    body: z.object({
        responses: z.array(z.object({
            questionId: z.number().int(),
            selectedOptionId: z.number().int(),
        })),
    }),
};

export default {
    startAttempt,
    submitAttempt,
};
