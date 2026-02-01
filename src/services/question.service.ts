import httpStatus from 'http-status';
import prisma from '../client';
import { ApiError } from '../middlewares/error';

/**
 * Create a question
 * @param {Object} questionBody
 * @returns {Promise<Question>}
 */
const createQuestion = async (questionBody: any) => {
  const { options, ...questionData } = questionBody;

  // Verify at least one correct option exists for MCQ
  if (options && !options.some((opt: any) => opt.isCorrect)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'At least one option must be correct');
  }

  return prisma.question.create({
    data: {
      ...questionData,
      options: {
        create: options,
      },
    },
    include: {
      options: true,
    },
  });
};

/**
 * Query for questions
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
const queryQuestions = async (filter: any, options: any) => {
  const where: any = {};
  if (filter.subject) where.subject = { contains: filter.subject, mode: 'insensitive' };
  if (filter.topic) where.topic = { contains: filter.topic, mode: 'insensitive' };
  if (filter.difficulty) where.difficulty = filter.difficulty;
  if (filter.search) where.text = { contains: filter.search, mode: 'insensitive' };

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  const questions = await prisma.question.findMany({
    where,
    skip,
    take: limit,
    orderBy: options.sortBy ? { [options.sortBy]: 'asc' } : { createdAt: 'desc' },
    include: {
      options: true,
    },
  });

  const totalResults = await prisma.question.count({ where });
  const totalPages = Math.ceil(totalResults / limit);

  return { questions, page, limit, totalPages, totalResults };
};

/**
 * Get question by id
 * @param {number} id
 * @returns {Promise<Question>}
 */
const getQuestionById = async (id: number) => {
  return prisma.question.findUnique({
    where: { id },
    include: {
      options: true,
    },
  });
};

/**
 * Update question by id
 * @param {number} questionId
 * @param {Object} updateBody
 * @returns {Promise<Question>}
 */
const updateQuestionById = async (questionId: number, updateBody: any) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  const { options, ...data } = updateBody;

  if (options) {
    if (!options.some((opt: any) => opt.isCorrect)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'At least one option must be correct');
    }

    // Transaction to update question and replace options
    return prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id: questionId },
        data,
      });

      // Delete old options
      await tx.questionOption.deleteMany({
        where: { questionId },
      });

      // Create new options
      await tx.questionOption.createMany({
        data: options.map((opt: any) => ({ ...opt, questionId })),
      });

      return tx.question.findUnique({
        where: { id: questionId },
        include: { options: true },
      });
    });
  }

  return prisma.question.update({
    where: { id: questionId },
    data: data,
    include: { options: true },
  });
};

/**
 * Delete question by id
 * @param {number} questionId
 * @returns {Promise<Question>}
 */
const deleteQuestionById = async (questionId: number) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }
  await prisma.question.delete({ where: { id: questionId } });
  return question;
};

export default {
  createQuestion,
  queryQuestions,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById,
};
