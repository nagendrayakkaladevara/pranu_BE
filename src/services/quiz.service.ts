
import httpStatus from 'http-status';
import Quiz, { QuizStatus } from '../models/quiz.model';
import Question from '../models/question.model';
import Class from '../models/class.model';
import { IUser } from '../models/user.model';
import { ApiError } from '../middlewares/error';

/**
 * Create a quiz
 * @param {Object} quizBody
 * @param {User} user
 * @returns {Promise<Quiz>}
 */
const createQuiz = async (quizBody: any, user: IUser) => {
  return Quiz.create({
    ...quizBody,
    createdBy: user.id,
  });
};

/**
 * Query for quizzes
 * @param {Object} filter - Filter
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
const queryQuizzes = async (filter: any, options: any) => {
  const where: any = {};
  if (filter.title) where.title = { $regex: filter.title, $options: 'i' };
  if (filter.status) where.status = filter.status;
  if (filter.createdBy) where.createdBy = filter.createdBy;

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  let sort = '-createdAt';
  if (options.sortBy) {
    const [field, order] = options.sortBy.split(':');
    sort = (order === 'desc' ? '-' : '') + field;
  }

  const quizzesDocs = await Quiz.find(where)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalResults = await Quiz.countDocuments(where);
  const totalPages = Math.ceil(totalResults / limit);

  const quizzes = quizzesDocs.map((doc) => {
    const obj = doc.toJSON();
    return {
      ...obj,
      _count: {
        questions: doc.questions.length,
        assignedClasses: doc.assignedClasses.length,
      },
    };
  });

  return { quizzes, page, limit, totalPages, totalResults };
};

/**
 * Get quiz by id
 * @param {string} id
 * @returns {Promise<Quiz>}
 */
const getQuizById = async (id: string) => {
  const quiz = await Quiz.findById(id)
    .populate('questions')
    .populate('assignedClasses');

  if (!quiz) return null;

  // Transform to match Prisma structure
  const obj = quiz.toJSON();
  const questions = (obj.questions as any[]).map((q) => ({ question: q }));
  const assignedClasses = (obj.assignedClasses as any[]).map((c) => ({ class: c }));

  return { ...obj, questions, assignedClasses };
};

/**
 * Update quiz by id
 * @param {string} quizId
 * @param {Object} updateBody
 * @returns {Promise<Quiz>}
 */
const updateQuizById = async (quizId: string, updateBody: any) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  if (updateBody.startTime && updateBody.endTime) {
    if (new Date(updateBody.startTime) >= new Date(updateBody.endTime)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Start time must be before end time');
    }
  }

  Object.assign(quiz, updateBody);
  await quiz.save();
  return quiz;
};

/**
 * Delete quiz by id
 * @param {string} quizId
 * @returns {Promise<Quiz>}
 */
const deleteQuizById = async (quizId: string) => {
  const quiz = await Quiz.findByIdAndDelete(quizId);
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }
  return quiz;
};

/**
 * Add questions to quiz
 * @param {string} quizId
 * @param {string[]} questionIds
 * @returns {Promise<Quiz>}
 */
const addQuestionsToQuiz = async (quizId: string, questionIds: string[]) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  const count = await Question.countDocuments({ _id: { $in: questionIds } });
  if (count !== questionIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more questions not found');
  }

  await Quiz.updateOne(
    { _id: quizId },
    { $addToSet: { questions: { $each: questionIds } } }
  );

  return getQuizById(quizId);
};

/**
 * Publish quiz
 * @param {string} quizId
 * @param {string[]} classIds
 * @returns {Promise<Quiz>}
 */
const publishQuiz = async (quizId: string, classIds: string[]) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  if (!quiz.startTime || !quiz.endTime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Quiz must have start and end times before publishing'
    );
  }

  if (quiz.questions.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz must have questions before publishing');
  }

  // Update status and assign classes
  // Mongoose transaction or just sequential updates
  // Sequential is usually fine if we don't strictly need atomicity across different collections
  // but if we are updating Quiz only, it is atomic on document level.
  // Actually we are updating assignedClasses (on Quiz) and status (on Quiz).

  await Quiz.updateOne(
    { _id: quizId },
    {
      $set: { status: QuizStatus.PUBLISHED },
      $addToSet: { assignedClasses: { $each: classIds } },
    }
  );

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
