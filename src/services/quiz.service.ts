import httpStatus from 'http-status';
import prisma from '../client';
import { ApiError } from '../middlewares/error';
import { QuizStatus, User } from '@prisma/client';

const createQuiz = async (quizBody: any, user: User) => {
  return prisma.quiz.create({
    data: {
      ...quizBody,
      createdById: user.id,
    },
  });
};

const queryQuizzes = async (filter: any, options: any) => {
  const where: any = {};
  if (filter.title) where.title = { contains: filter.title, mode: 'insensitive' };
  if (filter.status) where.status = filter.status;
  if (filter.createdById) where.createdById = filter.createdById;

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  const quizzes = await prisma.quiz.findMany({
    where,
    skip,
    take: limit,
    orderBy: options.sortBy ? { [options.sortBy]: 'asc' } : { createdAt: 'desc' },
    include: {
      _count: {
        select: { questions: true, assignedClasses: true },
      },
    },
  });

  const totalResults = await prisma.quiz.count({ where });
  const totalPages = Math.ceil(totalResults / limit);

  return { quizzes, page, limit, totalPages, totalResults };
};

const getQuizById = async (id: number) => {
  return prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          question: true,
        },
      },
      assignedClasses: {
        include: {
          class: true,
        },
      },
    },
  });
};

const updateQuizById = async (quizId: number, updateBody: any) => {
  const quiz = await getQuizById(quizId);
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  // Basic validation for dates
  if (updateBody.startTime && updateBody.endTime) {
    if (new Date(updateBody.startTime) >= new Date(updateBody.endTime)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Start time must be before end time');
    }
  }

  const updatedQuiz = await prisma.quiz.update({
    where: { id: quizId },
    data: updateBody,
  });
  return updatedQuiz;
};

const deleteQuizById = async (quizId: number) => {
  const quiz = await getQuizById(quizId);
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }
  await prisma.quiz.delete({ where: { id: quizId } });
  return quiz;
};

const addQuestionsToQuiz = async (quizId: number, questionIds: number[]) => {
  const quiz = await getQuizById(quizId);
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  // Verify questions exist
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });

  if (questions.length !== questionIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more questions not found');
  }

  // Add to pivot
  const data = questionIds.map((qId) => ({
    quizId,
    questionId: qId,
  }));

  await prisma.quizQuestion.createMany({
    data,
    skipDuplicates: true,
  });

  return getQuizById(quizId);
};

const publishQuiz = async (quizId: number, classIds: number[]) => {
  const quiz = await getQuizById(quizId);
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  if (!quiz.startTime || !quiz.endTime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Quiz must have start and end times before publishing',
    );
  }

  if (quiz.questions.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz must have questions before publishing');
  }

  // Update status and assign classes in transaction
  await prisma.$transaction(async (tx) => {
    // Assign classes
    const classData = classIds.map((cId) => ({
      quizId,
      classId: cId,
    }));

    await tx.quizClass.createMany({
      data: classData,
      skipDuplicates: true,
    });

    // Set status
    await tx.quiz.update({
      where: { id: quizId },
      data: { status: QuizStatus.PUBLISHED },
    });
  });

  return getQuizById(quizId);
};

export default {
  createQuiz,
  queryQuizzes,
  getQuizById,
  updateQuizById,
  deleteQuizById,
  addQuestionsToQuiz,
  publishQuiz,
};
