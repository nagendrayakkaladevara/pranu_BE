import { z } from 'zod';
import { Difficulty, QuestionType } from '../models/question.model';

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

// Validate create question body - type-specific validation
const createQuestion = {
  body: z
    .object({
      text: z.string().min(1),
      type: z.nativeEnum(QuestionType).default(QuestionType.MCQ),
      difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
      marks: z.number().int().min(1).default(1),
      subject: z.string().min(1),
      topic: z.string().optional(),
      options: z.array(optionSchema).optional(),
      multipleCorrect: z.boolean().default(false),
      correctAnswers: z.array(z.string().min(1)).optional(),
    })
    .refine(
      (data) => {
        if (data.type === QuestionType.MCQ) {
          if (!data.options || data.options.length < 2) return false;
          const correctCount = data.options.filter((o) => o.isCorrect).length;
          if (data.multipleCorrect) return correctCount >= 1;
          return correctCount === 1;
        }
        if (data.type === QuestionType.FILL_IN_BLANK) {
          const answers = (data.correctAnswers || [])
            .map((a) => a.trim())
            .filter((a) => a.length > 0);
          return answers.length >= 1;
        }
        return true; // SUBJECTIVE
      },
      {
        message:
          'MCQ: at least 2 options required; single correct: exactly one option must be correct; multiple correct: at least one option must be correct. FILL_IN_BLANK: at least one non-empty correctAnswer required.',
      },
    )
    .refine(
      (data) => {
        if (data.type === QuestionType.FILL_IN_BLANK) {
          return !data.options || data.options.length === 0;
        }
        return true;
      },
      { message: 'FILL_IN_BLANK questions should not have options; use correctAnswers instead.' },
    ),
};

// Validate get questions query
const getQuestions = {
  query: z.object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    difficulty: z.nativeEnum(Difficulty).optional(),
    type: z.nativeEnum(QuestionType).optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    limit: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
  }),
};

// Validate get question params
const getQuestion = {
  params: z.object({
    questionId: z.string(),
  }),
};

// Validate update question params and body - type-specific validation
const updateQuestion = {
  params: z.object({
    questionId: z.string(),
  }),
  body: z
    .object({
      text: z.string().min(1).optional(),
      type: z.nativeEnum(QuestionType).optional(),
      difficulty: z.nativeEnum(Difficulty).optional(),
      marks: z.number().int().min(1).optional(),
      subject: z.string().min(1).optional(),
      topic: z.string().optional(),
      options: z.array(optionSchema).optional(),
      multipleCorrect: z.boolean().optional(),
      correctAnswers: z.array(z.string().min(1)).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    })
    .refine(
      (data) => {
        if (data.type === QuestionType.MCQ || (data.options && data.options.length > 0)) {
          const opts = data.options || [];
          if (opts.length > 0 && opts.length < 2) return false;
          const correctCount = opts.filter((o) => o.isCorrect).length;
          const multipleCorrect = data.multipleCorrect;
          if (multipleCorrect === undefined) return opts.length >= 2;
          if (multipleCorrect) return correctCount >= 1;
          return correctCount === 1;
        }
        if (
          data.type === QuestionType.FILL_IN_BLANK ||
          (data.correctAnswers && data.correctAnswers.length > 0)
        ) {
          const answers = (data.correctAnswers || [])
            .map((a) => a.trim())
            .filter((a) => a.length > 0);
          return answers.length >= 1;
        }
        return true;
      },
      {
        message:
          'MCQ: at least 2 options; single correct: exactly one option must be correct. FILL_IN_BLANK: at least one non-empty correctAnswer.',
      },
    ),
};

const deleteQuestion = {
  params: z.object({
    questionId: z.string(),
  }),
};

export default {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
